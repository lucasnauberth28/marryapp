import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { SUPER_ADMIN_USER_ID, type SecureAuthContext } from "@/lib/security/auth-guard";
import type { WeddingContext } from "@/lib/security/wedding-context";
import { ehAcessoDeAdminDaPlataforma } from "@/lib/permissions";
import { classifyAccount } from "@/lib/account/wedding-provisioning";
import { casamentoTemModulo } from "@/lib/wedding-plan";
import { AREAS_DO_PAINEL } from "@/lib/panel-nav";
import { buildTourSteps, type StepPlace, type TourModule, type TourStep } from "./steps";
import { decideTourMode, stepsForMode, tourEligible, type TourAccount, type TourMode } from "./rules";

/**
 * Passo a passo do painel, lado do servidor. A pessoa vem SEMPRE da sessão (nunca de um id do navegador).
 * Regras em lib/tour/rules (testadas): quando aparece, quem nunca vê, o que se grava.
 */

/** Linha da pessoa com o que o passo a passo precisa (uma consulta por requisição). */
export const getTourUserRow = cache(async (userId: string) => {
  if (userId === SUPER_ADMIN_USER_ID) return null;
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
export function tourAccountOf(args: {
  session: SecureAuthContext;
  ctx: Pick<WeddingContext, "wedding" | "impersonation"> | null;
  row: Awaited<ReturnType<typeof getTourUserRow>>;
}): TourAccount {
  const { session, ctx, row } = args;
  return {
    platformAdmin: session.userId === SUPER_ADMIN_USER_ID || ehAcessoDeAdminDaPlataforma(session.allowedPaths),
    impersonating: Boolean(ctx?.impersonation),
    vendor: row ? classifyAccount(row) === "vendor" : false,
    onboardedWedding: Boolean(ctx?.wedding.onboardedAt),
  };
}

export interface PanelTourConfig {
  /** Como aparece sozinho neste carregamento. */
  mode: TourMode;
  /** Todos os passos que esta pessoa pode ver ("Ver o passo a passo" usa estes). */
  steps: TourStep[];
  /** Ids dos passos que o modo atual mostra (as boas-vindas, tudo; as novidades, só o novo). */
  autoIds: string[];
  /** Nome do item no menu e na barra de baixo do celular, por área. */
  places: Record<string, StepPlace>;
}

const TOUR_MODULES: TourModule[] = ["whatsapp", "qrcode", "customDomain"];

function placesFor(steps: TourStep[]): Record<string, StepPlace> {
  // O item do menu de cada passo é a área a que a tela pertence (lib/panel-nav)
  const areaOf = (href: string) => AREAS_DO_PAINEL.find((a) => a.screens.some((sc) => sc.href === href));
  const out: Record<string, StepPlace> = {};
  for (const s of steps) {
    if (!s.href || out[s.href]) continue;
    const area = areaOf(s.href);
    out[s.href] = { menuLabel: area?.name ?? s.title, tabLabel: area?.shortName ?? null };
  }
  return out;
}

/** Configuração do passo a passo para o layout do painel, ou null quando a conta não tem (administração, visita, etc.). */
export async function loadPanelTour(session: SecureAuthContext, ctx: WeddingContext | null): Promise<PanelTourConfig | null> {
  if (!ctx) return null;
  const row = await getTourUserRow(session.userId);
  const account = tourAccountOf({ session, ctx, row });
  if (!tourEligible(account) || !row) return null;

  const owned = await Promise.all(TOUR_MODULES.map(async (m) => ((await casamentoTemModulo(ctx, m)) ? m : null)));
  const steps = buildTourSteps({ allowedPaths: session.allowedPaths, modules: owned.filter((m): m is TourModule => m !== null) });
  if (steps.length === 0) return null;

  const mode = decideTourMode({ eligible: true, seenVersion: row.panelTourVersion, stepVersions: steps.map((s) => s.since) });
  const autoIds = stepsForMode(steps, mode, row.panelTourVersion).map((s) => s.id);
  return { mode, steps, autoIds, places: placesFor(steps) };
}
