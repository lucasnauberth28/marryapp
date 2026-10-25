import "server-only";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ehViolacaoDeUnicidade } from "@/lib/prisma-erros";
import { temAcessoAoCaminho, opcoesDoCookieDeSessao, assinarToken, NOME_DO_COOKIE_DE_SESSAO } from "@/lib/auth";
import { ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { CAMINHOS_DO_CASAL, NOME_DO_PAPEL_DO_CASAL, gerarEnderecoDosNomesDoCasal } from "@/lib/casamento/wedding-rules";
import { COR_PADRAO_DO_TEMA } from "@/lib/painel/onboarding-options";

/**
 * Criação de casamento e ajustes de conta compartilhados pelo cadastro, onboarding e convite do par.
 * Não é uma Server Action: só recebe dados já validados no servidor.
 */

type Transacao = Prisma.TransactionClient;

/** Módulos da administração da plataforma: quem tem algum deles não é conta de casal. */
const CAMINHOS_DA_PLATAFORMA = ["/curadoria", "/assinaturas", "/usuarios", "/perfis"];

export type TipoDeConta = "admin" | "vendor" | "couple";

export function classificarConta(user: {
  id: string;
  partnerVendorId?: string | null;
  role?: { name: string; allowedPaths: unknown } | null;
}): TipoDeConta {
  if (user.id === ID_DO_SUPER_ADMIN) return "admin";
  const paths = Array.isArray(user.role?.allowedPaths) ? (user.role.allowedPaths as string[]) : [];
  if (paths.includes("*") || CAMINHOS_DA_PLATAFORMA.some((p) => paths.includes(p))) return "admin";
  if (user.partnerVendorId) return "vendor";
  if (/^fornecedor/i.test(user.role?.name ?? "")) return "vendor";
  if (temAcessoAoCaminho(paths, "/fornecedor") && !temAcessoAoCaminho(paths, "/dashboard")) return "vendor";
  return "couple";
}

/**
 * Endereço livre para o site: "ana-e-rafael", depois "ana-e-rafael-2", "-3"...
 * `excludeWeddingId` permite manter o próprio endereço ao regenerar.
 */
export async function enderecoUnicoDoCasamento(tx: Transacao, source: string, excludeWeddingId?: string): Promise<string> {
  const base = gerarEnderecoDosNomesDoCasal(source);
  const taken = new Set(
    (
      await tx.wedding.findMany({
        where: { slug: { startsWith: base }, ...(excludeWeddingId ? { id: { not: excludeWeddingId } } : {}) },
        select: { slug: true },
      })
    ).map((w) => w.slug),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** O endereço ainda é o gerado automaticamente a partir dos nomes (com ou sem sufixo numérico)? */
export function ehEnderecoAutomatico(slug: string, coupleNames: string) {
  const base = gerarEnderecoDosNomesDoCasal(coupleNames);
  if (slug === base) return true;
  return slug.startsWith(`${base}-`) && /^\d+$/.test(slug.slice(base.length + 1));
}

/** Perfil "Casal". Se já existir, mantém os módulos que a administração tiver ajustado. */
export function criarOuAtualizarPapelDoCasal(tx: Transacao) {
  return tx.role.upsert({
    where: { name: NOME_DO_PAPEL_DO_CASAL },
    update: {},
    create: { name: NOME_DO_PAPEL_DO_CASAL, allowedPaths: [...CAMINHOS_DO_CASAL] },
    select: { id: true, name: true, allowedPaths: true },
  });
}

/**
 * Cria o casamento com o site e as regras (uma linha de cada por casamento).
 * Deve rodar dentro de uma transação junto com a vinculação do usuário.
 */
export async function prepararCasamento(
  tx: Transacao,
  { coupleNames, weddingDate, slugSource }: { coupleNames: string; weddingDate?: Date | null; slugSource?: string },
) {
  const slug = await enderecoUnicoDoCasamento(tx, slugSource || coupleNames);
  const wedding = await tx.wedding.create({
    data: { slug, coupleNames, weddingDate: weddingDate ?? null, themeColor: COR_PADRAO_DO_TEMA },
    select: { id: true, slug: true, coupleNames: true },
  });

  await tx.siteCustomization.create({
    data: {
      weddingId: wedding.id,
      slug,
      title: coupleNames,
      subtitle: "",
      weddingDate: weddingDate ?? null,
      // Sem os dados de exemplo do modelo: o casal preenche no editor do site.
      ceremonyTime: null,
      receptionTime: null,
      locationName: null,
      locationAddress: null,
      themeColor: COR_PADRAO_DO_TEMA,
      fontFamily: "serif",
      dressCodeTitle: null,
      dressCodeDesc: null,
      dressCodePalette: null,
      welcomeMessage: null,
    },
  });

  await tx.systemSettings.create({
    data: { weddingId: wedding.id, weddingDate: weddingDate ?? null, welcomeText: "Bem-vindos ao nosso casamento!" },
  });

  return wedding;
}

/**
 * Executa uma transação que cria casamento e repete se outro cadastro pegou o mesmo endereço
 * no meio do caminho (índice único do slug).
 */
export async function comNovaTentativaDeEndereco<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await run();
    } catch (error) {
      if (i >= attempts || !ehViolacaoDeUnicidade(error)) throw error;
    }
  }
}

/**
 * Regrava o cookie de sessão com o perfil atual do banco. Necessário depois de trocar o perfil
 * da conta (ex.: "aguardando ativação" -> "Casal"): o proxy decide a navegação pelo JWT.
 */
export async function renovarCookieDeSessao(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: { select: { name: true, allowedPaths: true } } },
  });
  if (!user) return;
  const allowedPaths = Array.isArray(user.role.allowedPaths) ? (user.role.allowedPaths as string[]) : [];
  const token = await assinarToken({ userId: user.id, role: user.role.name, allowedPaths });
  const cookieStore = await cookies();
  cookieStore.set(NOME_DO_COOKIE_DE_SESSAO, token, opcoesDoCookieDeSessao());
}
