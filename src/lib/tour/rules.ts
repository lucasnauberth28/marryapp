// Regras puras do passo a passo do painel (sem banco nem Next): quando aparece, o que gravar, versão.

/**
 * Versão do passo a passo. Ao acrescentar uma novidade, suba este número e marque os passos novos com
 * `since` igual a ele (lib/tour/steps): quem já viu a versão anterior vê só o que é novo.
 * Versão 2: o menu virou 5 áreas (Resumo, Convidados, Site e convite, Presentes e dinheiro, Organização). Quem já tinha
 * resolvido a versão 1 vê só os passos novos ("Tem novidade no painel"), para saber onde cada tela foi parar.
 * Contas que existiam quando o recurso nasceu entram no banco com a versão 1 (migration panel_tour).
 */
export const VERSAO_DO_TOUR_DO_PAINEL = 2;

export interface ContaDoTour {
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
export function tourElegivel(a: ContaDoTour): boolean {
  return !a.platformAdmin && !a.impersonating && !a.vendor && a.onboardedWedding;
}

/** Pode gravar o resultado do passo a passo? Mesma regra: sem escrita para administração nem visita. */
export function tourPodeGravar(a: Pick<ContaDoTour, "platformAdmin" | "impersonating" | "vendor">): boolean {
  return !a.platformAdmin && !a.impersonating && !a.vendor;
}

export type ModoDoTour =
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
export function decidirModoDoTour(opts: {
  eligible: boolean;
  seenVersion: number;
  currentVersion?: number;
  /** Passos que a pessoa pode ver, cada um com a versão em que nasceu. */
  stepVersions: readonly number[];
}): ModoDoTour {
  const current = opts.currentVersion ?? VERSAO_DO_TOUR_DO_PAINEL;
  if (!opts.eligible || opts.stepVersions.length === 0) return "none";
  const seen = Number.isFinite(opts.seenVersion) ? Math.max(0, Math.trunc(opts.seenVersion)) : 0;
  if (seen >= current) return "none";
  if (seen === 0) return "welcome";
  return opts.stepVersions.some((v) => v > seen) ? "news" : "none";
}

/** Passos de uma exibição: o passo a passo inteiro, ou só os que nasceram depois da versão que a pessoa viu. */
export function passosDoModo<T extends { since: number }>(steps: readonly T[], mode: ModoDoTour, seenVersion: number): T[] {
  if (mode === "news") return steps.filter((s) => s.since > seenVersion);
  return [...steps];
}

export type DesfechoDoTour = "completed" | "skipped" | "restart";

export interface GravacaoDoTour {
  panelTourVersion: number;
  panelTourCompletedAt: Date | null;
  panelTourSkippedAt: Date | null;
}

/** O que gravar na pessoa. Concluir e pular resolvem a versão atual; reiniciar volta ao zero (mostra de novo). */
export function gravacaoDoTour(outcome: DesfechoDoTour, now: Date, currentVersion = VERSAO_DO_TOUR_DO_PAINEL): GravacaoDoTour {
  if (outcome === "completed") return { panelTourVersion: currentVersion, panelTourCompletedAt: now, panelTourSkippedAt: null };
  if (outcome === "skipped") return { panelTourVersion: currentVersion, panelTourCompletedAt: null, panelTourSkippedAt: now };
  return { panelTourVersion: 0, panelTourCompletedAt: null, panelTourSkippedAt: null };
}
