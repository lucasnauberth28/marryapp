import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { after } from "next/server";
import prisma from "@/lib/prisma";
import {
  AuthorizationError,
  obterSessao,
  redirecionarParaOLogin,
  exigirSessaoAutenticada,
  exigirPermissaoDoCaminho,
  ID_DO_SUPER_ADMIN,
  type ContextoDeAutenticacaoSegura,
} from "@/lib/security/auth-guard";
import { resolverPersonificacao, type ContextoDePersonificacao } from "@/lib/security/impersonation";
import { recusaDeEscritaNoCasamento } from "@/lib/security/impersonation-rules";
import { registrarAuditoria } from "@/lib/audit";
import { recusaDeEscritaPorManutencao } from "@/lib/platform/maintenance";

/**
 * Multi-casamento: todo dado do painel do casal pertence a um casamento (weddingId).
 *
 * Regra de ouro: toda consulta e toda escrita do painel do casal usa o `weddingId` devolvido
 * aqui, NUNCA um id vindo do navegador. Ler um registro por id = `findFirst({ where: { id, weddingId } })`;
 * alterar = `updateMany/deleteMany({ where: { id, weddingId } })` e conferir `count`.
 */

const SELECAO_DO_CASAMENTO = {
  id: true,
  slug: true,
  coupleNames: true,
  weddingDate: true,
  city: true,
  themeColor: true,
  onboardedAt: true,
  customDomain: true,
  suspendedAt: true,
} as const;

export type ResumoDoCasamento = {
  id: string;
  slug: string;
  coupleNames: string;
  weddingDate: Date | null;
  city: string | null;
  themeColor: string;
  onboardedAt: Date | null;
  /** Domínio próprio conectado e no ar (sem "www."), ou null. */
  customDomain?: string | null;
  /** Suspenso pela administração: site público fora do ar e painel só para leitura. */
  suspendedAt?: Date | null;
};

export interface ContextoDoCasamento {
  session: ContextoDeAutenticacaoSegura;
  weddingId: string;
  wedding: ResumoDoCasamento;
  /** Conta de administração sem casamento próprio: está vendo o casamento principal. */
  viaAdmin: boolean;
  /** "Entrar como este casal": sessão auditada da administração (ver security/impersonation.ts). */
  impersonation?: ContextoDePersonificacao | null;
}

/** A visita ao painel só é gravada (Wedding.lastActiveAt) se a última tem mais que isto: 1 escrita a cada 30 min. */
const INTERVALO_PARA_REGISTRAR_ATIVIDADE_EM_MS = 30 * 60 * 1000;

/** Marca a "última atividade" do casamento depois da resposta, no máximo a cada 30 min. Nunca lança erro. */
function registrarAtividadeDoCasamento(weddingId: string, last: Date | null) {
  const now = Date.now();
  if (last && now - last.getTime() < INTERVALO_PARA_REGISTRAR_ATIVIDADE_EM_MS) return;
  const run = async () => {
    try {
      await prisma.wedding.updateMany({
        where: { id: weddingId, OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: new Date(now - INTERVALO_PARA_REGISTRAR_ATIVIDADE_EM_MS) } }] },
        data: { lastActiveAt: new Date(now) },
      });
    } catch {
      // só uma estatística: falhar não pode atrapalhar o painel
    }
  };
  try {
    after(run);
  } catch {
    void run(); // fora de uma requisição (script, teste)
  }
}

/** Casamento mais antigo: usado pela administração da plataforma e pelos links antigos sem slug. */
export const obterCasamentoPrincipal = cache(async (): Promise<ResumoDoCasamento | null> => {
  return prisma.wedding.findFirst({ orderBy: { createdAt: "asc" }, select: SELECAO_DO_CASAMENTO });
});

/**
 * Casamento da sessão atual (uma vez por request), ou null quando a conta ainda não tem casamento
 * (cadastro recém-criado, antes do onboarding) ou não há sessão.
 * Perfis de administração da plataforma ("*") sem casamento próprio veem o casamento principal.
 */
export const obterContextoDoCasamento = cache(async (): Promise<ContextoDoCasamento | null> => {
  const session = await obterSessao();
  if (!session) return null;

  // "Entrar como este casal": com sessão válida (cookie assinado + linha no banco, 30 min) o painel do casal mostra
  // ESTE casamento e não grava atividade. Sem ela, a conta de administração sem casamento próprio ainda cai no
  // casamento principal (viaAdmin).
  const impersonation = await resolverPersonificacao(session);
  if (impersonation) {
    const wedding = await prisma.wedding.findUnique({ where: { id: impersonation.weddingId }, select: SELECAO_DO_CASAMENTO });
    if (wedding) return { session, weddingId: wedding.id, wedding, viaAdmin: false, impersonation };
  }

  if (session.userId === ID_DO_SUPER_ADMIN) {
    const wedding = await obterCasamentoPrincipal();
    return wedding ? { session, weddingId: wedding.id, wedding, viaAdmin: true } : null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { wedding: { select: { ...SELECAO_DO_CASAMENTO, lastActiveAt: true } } },
  });
  if (user?.wedding) {
    const { lastActiveAt, ...wedding } = user.wedding;
    registrarAtividadeDoCasamento(wedding.id, lastActiveAt);
    return { session, weddingId: wedding.id, wedding, viaAdmin: false };
  }

  if (session.allowedPaths.includes("*")) {
    const wedding = await obterCasamentoPrincipal();
    return wedding ? { session, weddingId: wedding.id, wedding, viaAdmin: true } : null;
  }
  return null;
});

/**
 * Para Server Actions do painel do casal que SÓ LEEM: exige sessão (e a permissão do módulo, se informada)
 * e um casamento. Lança AuthorizationError caso contrário. Vale também em "entrar como" somente leitura
 * e em casamento suspenso. Quem escreve usa requireWedding.
 */
export async function exigirCasamentoParaLeitura(path?: string): Promise<ContextoDoCasamento> {
  if (path) await exigirPermissaoDoCaminho(path);
  else await exigirSessaoAutenticada();
  const ctx = await obterContextoDoCasamento();
  if (!ctx) throw new AuthorizationError("Esta conta ainda não tem um casamento. Conclua o cadastro do casamento.");
  return ctx;
}

/**
 * Para Server Actions do painel do casal que ESCREVEM (todas, salvo as de leitura pura): igual a requireWeddingRead,
 * mais duas recusas centrais:
 *  - "entrar como" somente leitura (a administração só olha; a segunda confirmação de "Permitir editar" vira canEdit);
 *  - casamento suspenso (painel só para leitura);
 *  - modo de manutenção ligado pela administração (painel só para leitura, salvo a própria administração).
 * Com "entrar como" editável, cada escrita fica no AuditLog (ator, casamento, sessão e área).
 * Por padrão recusa: uma action nova que esquecer de escolher entre as duas já nasce protegida.
 */
export async function exigirCasamento(path?: string): Promise<ContextoDoCasamento> {
  const ctx = await exigirCasamentoParaLeitura(path);
  const refusal = recusaDeEscritaNoCasamento({ impersonation: ctx.impersonation, suspendedAt: ctx.wedding.suspendedAt });
  if (refusal) throw new AuthorizationError(refusal);
  // Modo de manutenção (administração > Configurações): painel só para leitura; a administração nunca é barrada
  const maintenance = await recusaDeEscritaPorManutencao(ctx.session.allowedPaths);
  if (maintenance) throw new AuthorizationError(maintenance);
  if (ctx.impersonation?.canEdit) {
    await registrarAuditoria({
      action: "impersonation.write",
      targetType: "wedding",
      targetId: ctx.weddingId,
      details: { sessionId: ctx.impersonation.id, area: path ?? "painel", reason: ctx.impersonation.reason },
    });
  }
  return ctx;
}

/**
 * Para páginas do painel do casal: sem sessão vai ao login; sem casamento vai ao onboarding.
 */
export async function exigirCasamentoNaPagina(path?: string): Promise<ContextoDoCasamento> {
  const session = await obterSessao();
  if (!session) return redirecionarParaOLogin(path);
  if (path) {
    try {
      await exigirPermissaoDoCaminho(path);
    } catch {
      redirect("/login");
    }
  }
  const ctx = await obterContextoDoCasamento();
  if (!ctx) redirect("/boas-vindas");
  return ctx;
}

/** Páginas públicas do casal (site, RSVP, presentes): resolve o casamento pelo endereço. */
export const obterCasamentoPeloEndereco = cache(async (slug: string): Promise<ResumoDoCasamento | null> => {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  return prisma.wedding.findUnique({ where: { slug }, select: SELECAO_DO_CASAMENTO });
});
