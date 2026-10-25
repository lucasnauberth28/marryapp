// Regras puras: o que cada plano de casal libera (sem banco nem Next), testáveis isoladamente.
import { MODULOS_DO_CASAL } from "../pagamento/pricing-modules.ts";

/**
 * Módulos do catálogo (lib/pricing-modules) que cada plano fechado inclui, segundo a lista de
 * benefícios em lib/plans: Classic = site completo, Pix sem taxa, WhatsApp e QR Code;
 * VIP = tudo do Classic + domínio próprio (na prática, todos os módulos).
 * O plano adaptado (custom) vale pelos módulos escolhidos; o Básico não inclui nenhum.
 */
const MODULOS_DO_CLASSIC = ["site", "pixZero", "whatsapp", "qrcode"];

/**
 * Módulos que o servidor realmente bloqueia hoje: os claramente premium e que existem no app.
 * O resto fica liberado (site, mesas e Pix sem taxa têm limites ambíguos no catálogo).
 * O domínio próprio (.com.br, no nome do titular) é pedido em /dominio e só o plano VIP
 * (ou um plano adaptado com o módulo) libera o pedido.
 */
export const MODULOS_COM_BLOQUEIO = ["whatsapp", "qrcode", "customDomain", "tables3d"] as const;
export type ModuloComBloqueio = (typeof MODULOS_COM_BLOQUEIO)[number];

const TODOS_OS_IDS_DE_MODULO = MODULOS_DO_CASAL.map((m) => m.id);

export function modulosDoPlano(planId: string | null, customModules?: unknown): string[] {
  if (planId === "vip") return TODOS_OS_IDS_DE_MODULO;
  if (planId === "classic") return MODULOS_DO_CLASSIC;
  if (planId === "custom") {
    const chosen = Array.isArray(customModules) ? customModules.filter((m): m is string => typeof m === "string") : [];
    return TODOS_OS_IDS_DE_MODULO.filter((id) => chosen.includes(id));
  }
  return [];
}

export function planoInclui(modules: readonly string[], moduleId: string): boolean {
  return modules.includes(moduleId);
}

const RECURSOS: Record<ModuloComBloqueio, { sentence: string; title: string; plans: string; planLabel: string }> = {
  whatsapp: {
    sentence: "Os convites e lembretes pelo WhatsApp, enviados pelo painel, fazem parte",
    title: "Convites e lembretes pelo WhatsApp são do plano",
    plans: "do plano Classic, do VIP",
    planLabel: "Classic",
  },
  qrcode: {
    sentence: "O registro de entrada dos convidados com código QR faz parte",
    title: "O registro de entrada com código QR é do plano",
    plans: "do plano Classic, do VIP",
    planLabel: "Classic",
  },
  tables3d: {
    sentence: "As mesas em 3D, com o link de visualização para os convidados, fazem parte",
    title: "As mesas em 3D são do plano",
    plans: "do plano VIP",
    planLabel: "VIP",
  },
  customDomain: {
    sentence: "O endereço personalizado do site (.com.br) faz parte",
    title: "O endereço personalizado do site é do plano",
    plans: "do plano VIP",
    planLabel: "VIP",
  },
};

/** Texto simples para quando o plano do casamento não inclui o módulo. */
export function mensagemDeUpgrade(moduleId: ModuloComBloqueio): string {
  return `${RECURSOS[moduleId].sentence} ${RECURSOS[moduleId].plans} ou de um plano adaptado com este módulo. Vejam as opções em Plano e pagamentos.`;
}

/** Nome do plano mais simples que inclui o módulo ("Classic", "VIP"), para o título do aviso. */
export function rotuloDoPlanoNecessario(moduleId: ModuloComBloqueio): string {
  return RECURSOS[moduleId].planLabel;
}

/** Título do aviso de upgrade: "O endereço personalizado do site é do plano VIP". */
export function tituloDeUpgrade(moduleId: ModuloComBloqueio): string {
  return `${RECURSOS[moduleId].title} ${RECURSOS[moduleId].planLabel}`;
}
