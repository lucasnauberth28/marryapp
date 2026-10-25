/**
 * Catálogo de planos. Fonte única de preço: o servidor sempre recalcula o valor a partir daqui,
 * nunca confiando no valor enviado pelo navegador.
 */
import { ROTULO_DA_TAXA_DO_PRESENTE } from "./gift-fee.ts";
import { calcularPrecoDoPlanoPersonalizado, pisosDosPlanosProntos } from "./pricing-modules.ts";

export const CONFIGURACAO_DOS_PLANOS = {
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
      `Taxa de ${ROTULO_DA_TAXA_DO_PRESENTE} por presente recebido`,
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
      `Presentes por Pix sem a taxa de ${ROTULO_DA_TAXA_DO_PRESENTE} do Aceito`,
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
      "Mesas em 3D, com link de visualização para os convidados",
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

export type ChaveDoPlano = keyof typeof CONFIGURACAO_DOS_PLANOS;

export function ehChaveDePlano(value: string): value is ChaveDoPlano {
  return Object.prototype.hasOwnProperty.call(CONFIGURACAO_DOS_PLANOS, value);
}

/**
 * Resolve tipo e preço (em centavos) de um plano pelos valores DO CÓDIGO. Planos personalizados são sempre de casal.
 * No servidor, quem cobra usa o catálogo mesclado com os preços da administração (lib/catalog.ts: resolvePlanIn).
 */
export function resolverPlano(planId: string, modules?: string[]): { type: "COUPLE" | "VENDOR"; name: string; price: number } | null {
  if (planId === "custom") {
    const pisos = pisosDosPlanosProntos({ classic: CONFIGURACAO_DOS_PLANOS.classic.price, vip: CONFIGURACAO_DOS_PLANOS.vip.price });
    const calc = calcularPrecoDoPlanoPersonalizado(modules ?? [], undefined, pisos);
    if (calc.selectedModules.length === 0) return null;
    return { type: "COUPLE", name: "Plano Adaptado", price: calc.total };
  }
  if (!ehChaveDePlano(planId)) return null;
  const plan = CONFIGURACAO_DOS_PLANOS[planId];
  return { type: plan.type, name: plan.name, price: plan.price };
}
