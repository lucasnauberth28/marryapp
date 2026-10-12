/**
 * Catálogo de planos. Fonte única de preço: o servidor sempre recalcula o valor a partir daqui,
 * nunca confiando no valor enviado pelo navegador.
 */
import { GIFT_FEE_LABEL } from "./gift-fee.ts";
import { calculateCustomPlanPrice } from "./pricing-modules.ts";

export const PLANS_CONFIG = {
  // Casais
  basic: {
    type: "COUPLE" as const,
    name: "Plano Básico",
    price: 0,
    period: "Gratuito",
    badge: "Para começar",
    features: [
      "Site do casamento com endereço no Aceito",
      "Lista de convidados e confirmações de presença",
      "Presentes em dinheiro por Pix e cartão",
      `Taxa de ${GIFT_FEE_LABEL} por presente recebido`,
    ],
  },
  classic: {
    type: "COUPLE" as const,
    name: "Plano Classic",
    price: 14900, // R$ 149,00
    period: "Pagamento único",
    badge: "Convites e entrada",
    // Só entra aqui o que o plano diferencia de fato: WhatsApp pelo painel e código QR são travados em wedding-plan-modules.
    features: [
      `Presentes por Pix sem a taxa de ${GIFT_FEE_LABEL} do Aceito`,
      "Convites e lembretes pelo WhatsApp, enviados pelo painel",
      "Registro de entrada dos convidados com código QR",
    ],
  },
  vip: {
    type: "COUPLE" as const,
    name: "Plano VIP Premium",
    price: 29900, // R$ 299,00
    period: "Pagamento único",
    badge: "Endereço próprio",
    features: [
      "Todos os recursos do Classic",
      "Endereço personalizado (.com.br): primeiro ano incluído, renovações por conta de vocês",
      "Atendimento prioritário pelo WhatsApp",
    ],
  },
  // Fornecedores
  start: {
    type: "VENDOR" as const,
    name: "Fornecedor Start",
    price: 0,
    period: "Gratuito",
    badge: "Iniciante",
    features: [
      "Perfil na vitrine de fornecedores, após curadoria",
      "1 região de atendimento",
      "Até 3 pedidos de orçamento por mês",
    ],
  },
  pro: {
    type: "VENDOR" as const,
    name: "Fornecedor Pro",
    price: 9900, // R$ 99,00
    period: "/ mês",
    badge: "Para crescer",
    features: [
      "Selo de fornecedor verificado pela curadoria",
      "Múltiplas regiões e cidades de atendimento",
      "Pedidos de orçamento ilimitados",
      "Agendamento de reuniões online e presenciais",
      "Botão de WhatsApp direto com o casal",
    ],
  },
  master: {
    type: "VENDOR" as const,
    name: "Fornecedor Master Elite",
    price: 24900, // R$ 249,00
    period: "/ mês",
    badge: "Alta performance",
    features: [
      "Topo das buscas na sua categoria e região",
      "Faixa de destaque na vitrine de fornecedores",
      "Painel com visitas ao perfil e propostas",
      "Envio de propostas ao casal pelo painel",
    ],
  },
};

export type PlanKey = keyof typeof PLANS_CONFIG;

export function isPlanKey(value: string): value is PlanKey {
  return Object.prototype.hasOwnProperty.call(PLANS_CONFIG, value);
}

/**
 * Resolve tipo e preço (em centavos) de um plano pelos valores DO CÓDIGO. Planos personalizados são sempre de casal.
 * No servidor, quem cobra usa o catálogo mesclado com os preços da administração (lib/catalog.ts: resolvePlanIn).
 */
export function resolvePlan(planId: string, modules?: string[]): { type: "COUPLE" | "VENDOR"; name: string; price: number } | null {
  if (planId === "custom") {
    const calc = calculateCustomPlanPrice(modules ?? []);
    if (calc.selectedModules.length === 0) return null;
    return { type: "COUPLE", name: "Plano Adaptado", price: calc.total };
  }
  if (!isPlanKey(planId)) return null;
  const plan = PLANS_CONFIG[planId];
  return { type: plan.type, name: plan.name, price: plan.price };
}
