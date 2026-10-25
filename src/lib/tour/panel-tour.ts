import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { ID_DO_SUPER_ADMIN, type ContextoDeAutenticacaoSegura } from "@/lib/security/auth-guard";
import type { ContextoDoCasamento } from "@/lib/security/wedding-context";
import { ehAcessoDeAdminDaPlataforma } from "@/lib/permissions";
import { classificarConta } from "@/lib/account/wedding-provisioning";
import { casamentoTemModulo } from "@/lib/casamento/wedding-plan";
import { AREAS_DO_PAINEL } from "@/lib/painel/panel-nav";
import { montarPassosDoTour, type LugarDoPasso, type ModuloDoTour, type PassoDoTour } from "./steps";
import { decidirModoDoTour, passosDoModo, tourElegivel, type ContaDoTour, type ModoDoTour } from "./rules";

/**
 * Passo a passo do painel, lado do servidor. A pessoa vem SEMPRE da sessão (nunca de um id do navegador).
 * Regras em lib/tour/rules (testadas): quando aparece, quem nunca vê, o que se grava.
 */

/** Linha da pessoa com o que o passo a passo precisa (uma consulta por requisição). */
export const obterLinhaDaPessoaDoTour = cache(async (userId: string) => {
  if (userId === ID_DO_SUPER_ADMIN) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      partnerVendorId: true,
      role: { select: { name: true, allowedPaths: true } },
      panelTourVersion: true,
      panelChecklistDismissedAt: true,
    },
  });
});

/** Dados da conta que decidem se o passo a passo existe para ela. */
export function contaDoTourDe(args: {
  session: ContextoDeAutenticacaoSegura;
  ctx: Pick<ContextoDoCasamento, "wedding" | "impersonation"> | null;
  row: Awaited<ReturnType<typeof obterLinhaDaPessoaDoTour>>;
}): ContaDoTour {
  const { session, ctx, row } = args;
  return {
    platformAdmin: session.userId === ID_DO_SUPER_ADMIN || ehAcessoDeAdminDaPlataforma(session.allowedPaths),
    impersonating: Boolean(ctx?.impersonation),
    vendor: row ? classificarConta(row) === "vendor" : false,
    onboardedWedding: Boolean(ctx?.wedding.onboardedAt),
  };
}

export interface ConfiguracaoDoTourDoPainel {
  /** Como aparece sozinho neste carregamento. */
  mode: ModoDoTour;
  /** Todos os passos que esta pessoa pode ver ("Ver o passo a passo" usa estes). */
  steps: PassoDoTour[];
  /** Ids dos passos que o modo atual mostra (as boas-vindas, tudo; as novidades, só o novo). */
  autoIds: string[];
  /** Nome do item no menu e na barra de baixo do celular, por área. */
  places: Record<string, LugarDoPasso>;
}

const MODULOS_DO_TOUR: ModuloDoTour[] = ["whatsapp", "qrcode", "customDomain"];

function lugaresPara(steps: PassoDoTour[]): Record<string, LugarDoPasso> {
  // O item do menu de cada passo é a área a que a tela pertence (lib/panel-nav)
  const areaOf = (href: string) => AREAS_DO_PAINEL.find((a) => a.screens.some((sc) => sc.href === href));
  const out: Record<string, LugarDoPasso> = {};
  for (const s of steps) {
    if (!s.href || out[s.href]) continue;
    const area = areaOf(s.href);
    out[s.href] = { menuLabel: area?.name ?? s.title, tabLabel: area?.shortName ?? null };
  }
  return out;
}

/** Configuração do passo a passo para o layout do painel, ou null quando a conta não tem (administração, visita, etc.). */
export async function carregarTourDoPainel(session: ContextoDeAutenticacaoSegura, ctx: ContextoDoCasamento | null): Promise<ConfiguracaoDoTourDoPainel | null> {
  if (!ctx) return null;
  const row = await obterLinhaDaPessoaDoTour(session.userId);
  const account = contaDoTourDe({ session, ctx, row });
  if (!tourElegivel(account) || !row) return null;

  const owned = await Promise.all(MODULOS_DO_TOUR.map(async (m) => ((await casamentoTemModulo(ctx, m)) ? m : null)));
  const steps = montarPassosDoTour({ allowedPaths: session.allowedPaths, modules: owned.filter((m): m is ModuloDoTour => m !== null) });
  if (steps.length === 0) return null;

  const mode = decidirModoDoTour({ eligible: true, seenVersion: row.panelTourVersion, stepVersions: steps.map((s) => s.since) });
  const autoIds = passosDoModo(steps, mode, row.panelTourVersion).map((s) => s.id);
  return { mode, steps, autoIds, places: lugaresPara(steps) };
}
