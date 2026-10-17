// Regras puras do passo a passo do painel (sem banco nem Next): quando aparece, o que gravar, versão.

/**
 * Versão do passo a passo. Ao acrescentar uma novidade, suba este número e marque os passos novos com
 * `since` igual a ele (lib/tour/steps): quem já viu a versão anterior vê só o que é novo.
 * Contas que existiam quando o recurso nasceu entram no banco com a versão 1 (migration panel_tour):
 * o passo a passo não aparece de surpresa para elas, e continua em "Ver o passo a passo".
 */
export const PANEL_TOUR_VERSION = 1;

export interface TourAccount {
  /** Acesso total ("*") ou conta de emergência: administração da plataforma. */
  platformAdmin: boolean;
  /** "Entrar como este casal": a administração só olha, nada é gravado. */
  impersonating: boolean;
  /** Conta de fornecedor (o painel do fornecedor tem outro menu). */
  vendor: boolean;
  /** A conta tem casamento e ele já passou pelo onboarding (/boas-vindas). */
  onboardedWedding: boolean;
}

/** O passo a passo do painel do casal existe para esta conta? Administração e visitante "Entrar como" nunca. */
export function tourEligible(a: TourAccount): boolean {
  return !a.platformAdmin && !a.impersonating && !a.vendor && a.onboardedWedding;
}

/** Pode gravar o resultado do passo a passo? Mesma regra: sem escrita para administração nem visita. */
export function tourMayWrite(a: Pick<TourAccount, "platformAdmin" | "impersonating" | "vendor">): boolean {
  return !a.platformAdmin && !a.impersonating && !a.vendor;
}

export type TourMode =
  /** Primeiro acesso: cartão de boas-vindas e o passo a passo completo. */
  | "welcome"
  /** Já viu uma versão anterior: só o que é novo. */
  | "news"
  /** Nada a mostrar sozinho (o passo a passo continua disponível em "Ver o passo a passo"). */
  | "none";

/**
 * Como o passo a passo aparece sozinho.
 * - version 0: nunca resolveu (concluiu ou pulou) => boas-vindas.
 * - 0 < version < atual, e há passos novos para esta pessoa => novidades.
 * - versão atual (ou conta anterior ao recurso) => nada.
 */
export function decideTourMode(opts: {
  eligible: boolean;
  seenVersion: number;
  currentVersion?: number;
  /** Passos que a pessoa pode ver, cada um com a versão em que nasceu. */
  stepVersions: readonly number[];
}): TourMode {
  const current = opts.currentVersion ?? PANEL_TOUR_VERSION;
  if (!opts.eligible || opts.stepVersions.length === 0) return "none";
  const seen = Number.isFinite(opts.seenVersion) ? Math.max(0, Math.trunc(opts.seenVersion)) : 0;
  if (seen >= current) return "none";
  if (seen === 0) return "welcome";
  return opts.stepVersions.some((v) => v > seen) ? "news" : "none";
}

/** Passos de uma exibição: o passo a passo inteiro, ou só os que nasceram depois da versão que a pessoa viu. */
export function stepsForMode<T extends { since: number }>(steps: readonly T[], mode: TourMode, seenVersion: number): T[] {
  if (mode === "news") return steps.filter((s) => s.since > seenVersion);
  return [...steps];
}

export type TourOutcome = "completed" | "skipped" | "restart";

export interface TourWrite {
  panelTourVersion: number;
  panelTourCompletedAt: Date | null;
  panelTourSkippedAt: Date | null;
}

/** O que gravar na pessoa. Concluir e pular resolvem a versão atual; reiniciar volta ao zero (mostra de novo). */
export function tourWrite(outcome: TourOutcome, now: Date, currentVersion = PANEL_TOUR_VERSION): TourWrite {
  if (outcome === "completed") return { panelTourVersion: currentVersion, panelTourCompletedAt: now, panelTourSkippedAt: null };
  if (outcome === "skipped") return { panelTourVersion: currentVersion, panelTourCompletedAt: null, panelTourSkippedAt: now };
  return { panelTourVersion: 0, panelTourCompletedAt: null, panelTourSkippedAt: null };
}
