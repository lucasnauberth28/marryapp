"use server";

// Cadastro de conta pelo plano (casal ou fornecedor): cria a conta e abre a sessão.
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { assinarToken, opcoesDoCookieDeSessao, temAcessoAoCaminho, NOME_DO_COOKIE_DE_SESSAO } from "@/lib/auth";
import { resolverPlanoNoCatalogo } from "@/lib/catalog";
import { obterCatalogo } from "@/lib/catalog-server";
import { limitarUsoPorIp } from "@/lib/security/rate-limiter";
import { normalizarTexto, limparEndereco, limparUrl } from "@/lib/security/sanitize";
import { CAMINHO_DO_PAINEL_DO_FORNECEDOR } from "@/lib/security/vendor-guard";
import { VendorPlanTier } from "@prisma/client";
import { ehViolacaoDeUnicidade } from "@/lib/prisma-erros";
import { prepararCasamento, criarOuAtualizarPapelDoCasal, comNovaTentativaDeEndereco } from "@/lib/account/wedding-provisioning";
import { EsquemaDoCadastro, NOME_DO_PAPEL_DE_FORNECEDOR, calcularFaixaDePreco, dataDeCasamentoValida, guardarImagem, type DadosDoCadastroDoPlano } from "@/actions/assinatura/cadastro-comum";

type EntradaValida = NonNullable<ReturnType<typeof EsquemaDoCadastro.safeParse>["data"]>;
type Plano = NonNullable<ReturnType<typeof resolverPlanoNoCatalogo>>;
type DadosDoFornecedor = Parameters<typeof prisma.partnerVendor.create>[0]["data"];

/** O que a tela recebe do cadastro: a conta criada (success) ou o motivo de não ter sido (error). */
interface ResultadoDoCadastro {
  success: boolean;
  error?: string;
  userId?: string;
  isFree?: boolean;
  isVendor?: boolean;
  redirectTo?: string | null;
  slug?: string;
}

const ERRO_DE_EMAIL_JA_CADASTRADO = "Já existe uma conta com este e-mail. Faça login para continuar.";

/** Guarda o papel e o token no cookie da sessão. */
async function abrirSessao(userId: string, role: { name: string; allowedPaths: unknown }) {
  const allowedPaths = Array.isArray(role.allowedPaths) ? (role.allowedPaths as string[]) : [];
  const token = await assinarToken({ userId, role: role.name, allowedPaths });
  const cookieStore = await cookies();
  cookieStore.set(NOME_DO_COOKIE_DE_SESSAO, token, opcoesDoCookieDeSessao());
  return allowedPaths;
}

/** Perfil do fornecedor a criar: imagens enviadas ao storage, faixa de preço e curadoria pendente. */
async function dadosDoFornecedor(input: EntradaValida, plan: Plano, planId: string): Promise<DadosDoFornecedor> {
  const [logoUrl, coverUrl, gallery] = await Promise.all([
    guardarImagem(input.logoUrl, "vendors/logos"),
    guardarImagem(input.coverUrl, "vendors/covers"),
    Promise.all((input.galleryImages ?? []).map((img) => guardarImagem(img, "vendors/gallery"))),
  ]);
  const tier = planId === "master" ? VendorPlanTier.MASTER : planId === "pro" ? VendorPlanTier.PRO : VendorPlanTier.FREE;
  const galeria = gallery.filter(Boolean);

  return {
    companyName: normalizarTexto(input.companyName ?? ""),
    category: input.vendorCategory || "Outros",
    description: `Profissional de excelência em ${input.vendorCategory || "serviços de casamento"}.`,
    phone: input.phone,
    whatsapp: input.phone,
    logoUrl,
    coverUrl: coverUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    galleryImages: galeria.length > 0 ? JSON.stringify(galeria) : null,
    startingPrice: input.startingPrice ?? null,
    averageTicket: input.averageTicket ?? null,
    priceRange: input.priceRange || calcularFaixaDePreco(input.averageTicket, input.startingPrice),
    documentType: input.documentType || "CNPJ",
    documentNumber: (input.documentNumber ?? "").replace(/[^\d./-]/g, ""),
    instagram: input.instagram || null,
    tiktok: input.tiktok || null,
    website: input.website ? limparUrl(input.website) : null,
    serviceRegions: JSON.stringify([input.vendorRegion || "São Paulo - Capital"]),
    // O plano pago só é aplicado após confirmação do pagamento; até lá fica no gratuito.
    planTier: plan.price > 0 ? VendorPlanTier.FREE : tier,
    isVerified: false, // Fica false até aprovação na curadoria
    curationStatus: "PENDING_APPROVAL",
  };
}

/** Casamento, site, regras, perfil "Casal" e usuário nascem juntos (tudo ou nada); o casal segue para o onboarding. */
async function criarContaDoCasal(input: EntradaValida, name: string, hashedPassword: string, plan: Plano): Promise<ResultadoDoCadastro> {
  const weddingDate = dataDeCasamentoValida(input.weddingDate);
  const created = await comNovaTentativaDeEndereco(() =>
    prisma.$transaction(async (tx) => {
      const role = await criarOuAtualizarPapelDoCasal(tx);
      const wedding = await prepararCasamento(tx, { coupleNames: name, weddingDate, slugSource: input.slug || name });
      const user = await tx.user.create({ data: { name, username: input.email, password: hashedPassword, roleId: role.id, weddingId: wedding.id }, select: { id: true } });
      return { user, role, wedding };
    }),
  ).catch(async (error) => {
    // Dois envios do mesmo formulário ao mesmo tempo: o segundo bate no e-mail único.
    if (ehViolacaoDeUnicidade(error) && (await prisma.user.findUnique({ where: { username: input.email }, select: { id: true } }))) return null;
    throw error;
  });
  if (!created) return { success: false, error: ERRO_DE_EMAIL_JA_CADASTRADO };

  await abrirSessao(created.user.id, created.role);
  return { success: true, userId: created.user.id, isFree: plan.price === 0, isVendor: false, redirectTo: "/boas-vindas", slug: created.wedding.slug };
}

/** Fornecedores entram direto no painel próprio, já vinculados ao perfil criado. */
async function criarContaDoFornecedor(input: EntradaValida, name: string, hashedPassword: string, plan: Plano, vendorData: DadosDoFornecedor): Promise<ResultadoDoCadastro> {
  const role = await prisma.role.upsert({
    where: { name: NOME_DO_PAPEL_DE_FORNECEDOR },
    update: {},
    create: { name: NOME_DO_PAPEL_DE_FORNECEDOR, allowedPaths: [CAMINHO_DO_PAINEL_DO_FORNECEDOR] },
  });

  const user = await prisma.$transaction(async (tx) => {
    const vendor = await tx.partnerVendor.create({ data: vendorData, select: { id: true } });
    // O vínculo nasce no servidor: o fornecedor só enxerga o próprio perfil no painel.
    return tx.user.create({ data: { name, username: input.email, password: hashedPassword, roleId: role.id, partnerVendorId: vendor.id }, select: { id: true } });
  });

  const allowedPaths = await abrirSessao(user.id, role);
  return {
    success: true,
    userId: user.id,
    isFree: plan.price === 0,
    isVendor: true,
    redirectTo: temAcessoAoCaminho(allowedPaths, CAMINHO_DO_PAINEL_DO_FORNECEDOR) ? CAMINHO_DO_PAINEL_DO_FORNECEDOR : null,
    slug: input.slug ? limparEndereco(input.slug) : undefined,
  };
}

/**
 * Registra a conta do usuário (Casal ou Fornecedor).
 * Casal: cria o casamento junto com a conta e devolve redirectTo "/boas-vindas" (onboarding).
 */
export async function cadastrarContaDoPlano(data: DadosDoCadastroDoPlano): Promise<ResultadoDoCadastro> {
  // O preço vem do catálogo do servidor; o `amount` enviado pelo navegador é ignorado.
  const plan = resolverPlanoNoCatalogo(await obterCatalogo(), data.planId, data.modules);
  if (!plan) return { success: false, error: "Plano inválido." };

  const parsed = EsquemaDoCadastro.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const input = parsed.data;

  try {
    const rateLimit = await limitarUsoPorIp("SIGNUP");
    if (!rateLimit.success) return { success: false, error: "Muitos cadastros em pouco tempo. Aguarde alguns minutos." };

    // Um e-mail já cadastrado nunca recebe sessão por aqui: o dono deve entrar pelo login.
    const existingUser = await prisma.user.findUnique({ where: { username: input.email }, select: { id: true } });
    if (existingUser) return { success: false, error: ERRO_DE_EMAIL_JA_CADASTRADO };

    let vendorData: DadosDoFornecedor | null = null;
    if (plan.type === "VENDOR") {
      if (!input.companyName || !input.documentNumber) return { success: false, error: "Informe o nome da empresa e o documento." };
      vendorData = await dadosDoFornecedor(input, plan, data.planId);
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const name = normalizarTexto(input.name);
    return vendorData ? await criarContaDoFornecedor(input, name, hashedPassword, plan, vendorData) : await criarContaDoCasal(input, name, hashedPassword, plan);
  } catch (error) {
    console.error("[registerPlanAccount Error]:", error);
    const message = error instanceof Error && /imagem|Imagem|Formato/.test(error.message) ? error.message : null;
    return { success: false, error: message || "Erro ao registrar conta." };
  }
}
