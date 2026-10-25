"use server";

// Início do casamento (onboarding): conclui a configuração do casamento da conta logada.
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { COR_PADRAO_DO_TEMA, juntarNomesDoCasal } from "@/lib/painel/onboarding-options";
import { classificarConta, ehEnderecoAutomatico, prepararCasamento, renovarCookieDeSessao, enderecoUnicoDoCasamento, criarOuAtualizarPapelDoCasal, comNovaTentativaDeEndereco } from "@/lib/account/wedding-provisioning";
import { ERROS } from "@/lib/mensagens-de-erro";
import { ConflitoNoInicio, type EntradaDoInicio, EsquemaDoInicio, type ResultadoDoInicio, interpretarDataDoCasamento } from "@/actions/inicio/comum";

type Sessao = NonNullable<Awaited<ReturnType<typeof obterSessao>>>;
type DadosDoInicio = z.output<typeof EsquemaDoInicio>;

/** A conta que está concluindo o início, com o casamento (se já tiver) e o tipo de conta. */
async function carregarContaDoInicio(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      weddingId: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
      wedding: { select: { id: true, slug: true, coupleNames: true, onboardedAt: true } },
    },
  });
}

type ContaDoInicio = NonNullable<Awaited<ReturnType<typeof carregarContaDoInicio>>>;

/** Quem pode concluir o início: só conta de casal que ainda não configurou o casamento. */
function recusaDoInicio(user: ContaDoInicio, kind: ReturnType<typeof classificarConta>): ResultadoDoInicio | null {
  if (kind === "vendor") return { success: false, error: "Contas de fornecedor usam o painel do fornecedor.", redirectTo: "/fornecedor" };
  if (kind === "admin" && !user.wedding) return { success: false, error: "Contas da administração não têm casamento próprio.", redirectTo: "/dashboard" };
  if (user.wedding?.onboardedAt) return { success: false, error: "O casamento já está configurado.", redirectTo: "/dashboard" };
  return null;
}

interface PlanoDoInicio {
  user: ContaDoInicio;
  coupleNames: string;
  weddingDate: Date | null;
  data: DadosDoInicio;
  needsCoupleRole: boolean;
}

/** O site e as configurações do casamento acompanham os nomes, a data e a cor escolhidos no início. */
async function gravarSiteEConfiguracoes(tx: Prisma.TransactionClient, v: { weddingId: string; slug: string; coupleNames: string; weddingDate: Date | null; themeColor?: string }) {
  const { weddingId, slug, coupleNames, weddingDate, themeColor } = v;
  await tx.siteCustomization.upsert({
    where: { weddingId },
    update: { title: coupleNames, slug, weddingDate, ...(themeColor ? { themeColor } : {}) },
    create: {
      weddingId,
      slug,
      title: coupleNames,
      subtitle: "",
      weddingDate,
      themeColor: themeColor ?? COR_PADRAO_DO_TEMA,
      ceremonyTime: null,
      receptionTime: null,
      locationName: null,
      locationAddress: null,
      dressCodeTitle: null,
    },
  });
  await tx.systemSettings.upsert({
    where: { weddingId },
    update: { weddingDate },
    create: { weddingId, weddingDate, welcomeText: "Bem-vindos ao nosso casamento!" },
  });
}

/** Grava o início dentro da transação: cria ou atualiza o casamento, o site e as configurações. Devolve o endereço do site. */
async function gravarInicio(tx: Prisma.TransactionClient, { user, coupleNames, weddingDate, data, needsCoupleRole }: PlanoDoInicio): Promise<string> {
  // Campo que não veio fica como está (o onboarding curto não pergunta cidade, convidados nem cor).
  const optional = {
    ...(data.city !== undefined ? { city: data.city || null } : {}),
    ...(data.guestEstimate !== undefined ? { guestEstimate: data.guestEstimate } : {}),
    ...(data.themeColor ? { themeColor: data.themeColor } : {}),
  };
  let weddingId: string;
  let slug: string;

  if (!user.wedding) {
    const role = await criarOuAtualizarPapelDoCasal(tx);
    const wedding = await prepararCasamento(tx, { coupleNames, weddingDate });
    // Só vincula se a conta continua sem casamento (duas abas concluindo ao mesmo tempo).
    const linked = await tx.user.updateMany({ where: { id: user.id, weddingId: null }, data: { weddingId: wedding.id, roleId: role.id } });
    if (linked.count !== 1) throw new ConflitoNoInicio();
    weddingId = wedding.id;
    slug = wedding.slug;
  } else {
    weddingId = user.wedding.id;
    slug = ehEnderecoAutomatico(user.wedding.slug, user.wedding.coupleNames) ? await enderecoUnicoDoCasamento(tx, coupleNames, weddingId) : user.wedding.slug;
    if (needsCoupleRole) {
      const role = await criarOuAtualizarPapelDoCasal(tx);
      await tx.user.update({ where: { id: user.id }, data: { roleId: role.id } });
    }
  }

  const updated = await tx.wedding.updateMany({ where: { id: weddingId, onboardedAt: null }, data: { coupleNames, slug, weddingDate, ...optional, onboardedAt: new Date() } });
  if (updated.count !== 1) throw new ConflitoNoInicio();

  await gravarSiteEConfiguracoes(tx, { weddingId, slug, coupleNames, weddingDate, themeColor: data.themeColor });
  return slug;
}

/** Sessão válida de uma conta real (a de emergência não tem casamento). */
function recusaDaSessao(session: Sessao | null): ResultadoDoInicio | null {
  if (!session) return { success: false, error: ERROS.sessaoExpirada, redirectTo: "/login" };
  if (session.userId === ID_DO_SUPER_ADMIN) return { success: false, error: "A conta de emergência não tem casamento próprio.", redirectTo: "/dashboard" };
  return null;
}

/**
 * Conclui o onboarding do casamento da conta logada.
 * - Conta de casal sem casamento (cadastros antigos "aguardando ativação"): cria o casamento e
 *   troca o perfil para "Casal".
 * - Atualiza nomes e data (e cidade, faixa de convidados e cor, só se vierem); o endereço do site é
 *   refeito a partir dos nomes enquanto ainda for o automático. Marca onboardedAt.
 */
export async function concluirInicio(input: EntradaDoInicio): Promise<ResultadoDoInicio> {
  const session = await obterSessao();
  const semSessao = recusaDaSessao(session);
  if (semSessao || !session) return semSessao as ResultadoDoInicio;

  const parsed = EsquemaDoInicio.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Confira os dados." };
  const data = parsed.data;

  const weddingDate = interpretarDataDoCasamento(data.weddingDate);
  if (weddingDate === "invalid") return { success: false, error: "Confira a data do casamento." };

  const limit = await conferirLimiteDeUso({ key: `ONBOARDING:${session.userId}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.success) return { success: false, error: ERROS.muitasTentativas };

  const user = await carregarContaDoInicio(session.userId);
  if (!user) return { success: false, error: "Conta não encontrada.", redirectTo: "/login" };

  const kind = classificarConta(user);
  const recusa = recusaDoInicio(user, kind);
  if (recusa) return recusa;

  const coupleNames = juntarNomesDoCasal(data.yourName, data.partnerName);
  // Cadastros antigos ficaram com um perfil sem módulos: passam ao perfil "Casal".
  const paths = Array.isArray(user.role.allowedPaths) ? (user.role.allowedPaths as string[]) : [];
  const needsCoupleRole = kind === "couple" && paths.length === 0;
  const plano: PlanoDoInicio = { user, coupleNames, weddingDate, data, needsCoupleRole };

  try {
    const slug = await comNovaTentativaDeEndereco(() => prisma.$transaction((tx) => gravarInicio(tx, plano)));

    if (!user.wedding || needsCoupleRole) await renovarCookieDeSessao(user.id);
    revalidatePath("/", "layout");

    return { success: true, slug, coupleNames };
  } catch (error) {
    if (error instanceof ConflitoNoInicio) {
      return { success: false, error: "O casamento já foi configurado em outra aba.", redirectTo: "/dashboard" };
    }
    console.error("[completeOnboarding]", error);
    return { success: false, error: "Não conseguimos salvar agora. Tente de novo em instantes." };
  }
}
