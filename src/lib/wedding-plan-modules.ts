// Regras puras: o que cada plano de casal libera (sem banco nem Next), testáveis isoladamente.
import { COUPLE_MODULES } from "./pricing-modules.ts";

/**
 * Módulos do catálogo (lib/pricing-modules) que cada plano fechado inclui, segundo a lista de
 * benefícios em lib/plans: Classic = site completo, Pix sem taxa, WhatsApp automático e QR Code;
 * VIP = tudo do Classic + domínio próprio e álbum ao vivo (na prática, todos os módulos).
 * O plano adaptado (custom) vale pelos módulos escolhidos; o Básico não inclui nenhum.
 */
const CLASSIC_MODULES = ["site", "pixZero", "whatsapp", "qrcode"];

/**
 * Módulos que o servidor realmente bloqueia hoje: os claramente premium e que já existem no app.
 * O resto fica liberado (site, mesas e Pix sem taxa têm limites ambíguos no catálogo;
 * álbum ao vivo e domínio próprio ainda não existem como recurso).
 */
export const ENFORCED_MODULES = ["whatsapp", "qrcode"] as const;
export type EnforcedModule = (typeof ENFORCED_MODULES)[number];

const ALL_MODULE_IDS = COUPLE_MODULES.map((m) => m.id);

export function modulesForPlan(planId: string | null, customModules?: unknown): string[] {
  if (planId === "vip") return ALL_MODULE_IDS;
  if (planId === "classic") return CLASSIC_MODULES;
  if (planId === "custom") {
    const chosen = Array.isArray(customModules) ? customModules.filter((m): m is string => typeof m === "string") : [];
    return ALL_MODULE_IDS.filter((id) => chosen.includes(id));
  }
  return [];
}

export function planIncludes(modules: readonly string[], moduleId: string): boolean {
  return modules.includes(moduleId);
}

const FEATURE: Record<EnforcedModule, { sentence: string; short: string }> = {
  whatsapp: { sentence: "Os disparos automáticos no WhatsApp fazem parte", short: "WhatsApp automático" },
  qrcode: { sentence: "O check-in com QR Code na portaria faz parte", short: "Check-in com QR Code" },
};

/** Texto simples para quando o plano do casamento não inclui o módulo. */
export function upgradeMessage(moduleId: EnforcedModule): string {
  return `${FEATURE[moduleId].sentence} do plano Classic, do VIP ou de um plano adaptado com este módulo. Vejam as opções em Plano e pagamentos.`;
}

export function featureName(moduleId: EnforcedModule): string {
  return FEATURE[moduleId].short;
}
