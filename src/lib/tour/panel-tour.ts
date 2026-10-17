import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";
import { SUPER_ADMIN_USER_ID, type SecureAuthContext } from "@/lib/security/auth-guard";
import type { WeddingContext } from "@/lib/security/wedding-context";
import { isPlatformAdminPaths } from "@/lib/permissions";
import { classifyAccount } from "@/lib/account/wedding-provisioning";
import { weddingHasModule } from "@/lib/wedding-plan";
import { MOBILE_TABS, NAV_GROUPS } from "@/components/admin/nav-config";
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
    platformAdmin: session.userId === SUPER_ADMIN_USER_ID || isPlatformAdminPaths(session.allowedPaths),
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
  const tabs = new Map(MOBILE_TABS.map((t) => [t.href, t.name]));
  const labels = new Map(NAV_GROUPS.flatMap((g) => g.items).map((i) => [i.href, i.name]));
  const out: Record<string, StepPlace> = {};
  for (const s of steps) {
    if (!s.href || out[s.href]) continue;
    out[s.href] = { menuLabel: labels.get(s.href) ?? s.title, tabLabel: tabs.get(s.href) ?? null };
  }
  return out;
}

/** Configuração do passo a passo para o layout do painel, ou null quando a conta não tem (administração, visita, etc.). */
export async function loadPanelTour(session: SecureAuthContext, ctx: WeddingContext | null): Promise<PanelTourConfig | null> {
  if (!ctx) return null;
  const row = await getTourUserRow(session.userId);
  const account = tourAccountOf({ session, ctx, row });
  if (!tourEligible(account) || !row) return null;

  const owned = await Promise.all(TOUR_MODULES.map(async (m) => ((await weddingHasModule(ctx, m)) ? m : null)));
  const steps = buildTourSteps({ allowedPaths: session.allowedPaths, modules: owned.filter((m): m is TourModule => m !== null) });
  if (steps.length === 0) return null;

  const mode = decideTourMode({ eligible: true, seenVersion: row.panelTourVersion, stepVersions: steps.map((s) => s.since) });
  const autoIds = stepsForMode(steps, mode, row.panelTourVersion).map((s) => s.id);
  return { mode, steps, autoIds, places: placesFor(steps) };
}
