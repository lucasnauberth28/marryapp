/**
 * Catálogo de planos. Fonte única de preço: o servidor sempre recalcula o valor a partir daqui,
 * nunca confiando no valor enviado pelo navegador.
 */
import { calculateCustomPlanPrice } from "@/lib/pricing-modules";

export const PLANS_CONFIG = {
  // Casais
  basic: {
    type: "COUPLE" as const,
    name: "Plano Básico",
    price: 0,
    period: "Gratuito",
    badge: "Para Começar",
    features: [
      "Site padrão dos noivos com subdomínio",
      "Lista de presentes com Pix e Cartão",
      "RSVP padrão com controle de convidados",
      "Taxa de 2,99% por presente recebido",
    ],
  },
  classic: {
    type: "COUPLE" as const,
    name: "Plano Classic",
    price: 14900, // R$ 149,00
    period: "Taxa única",
    badge: "Mais Escolhido",
    isPopular: true,
    features: [
      "0% de Taxa no Pix dos Noivos (Saque 100% integral)",
      "Construtor completo No-Code com todos os blocos",
      "Disparos automáticos no WhatsApp dos convidados",
      "Credenciamento com QR Code na portaria",
      "Mural de Recados interativo e Dicas de Traje",
    ],
  },
  vip: {
    type: "COUPLE" as const,
    name: "Plano VIP Premium",
    price: 29900, // R$ 299,00
    period: "Taxa única",
    badge: "Experiência VIP",
    features: [
      "Tudo incluído no Plano Classic",
      "Domínio Próprio (.com.br) gratuito por 1 ano",
      "Álbum Coletivo ao Vivo com QR Code nas mesas",
      "Concierge VIP e suporte prioritário no WhatsApp",
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
      "Perfil no marketplace após curadoria",
      "1 região de atendimento",
      "Até 3 solicitações de orçamento/mês",
    ],
  },
  pro: {
    type: "VENDOR" as const,
    name: "Fornecedor Pro",
    price: 9900, // R$ 99,00
    period: "/ mês",
    badge: "Mais Popular",
    isPopular: true,
    features: [
      "Selo de Fornecedor Verificado pela Curadoria",
      "Múltiplas regiões e cidades de atendimento",
      "Orçamentos e leads ilimitados",
      "Agendamento de reuniões online e presenciais",
      "Botão de WhatsApp direto com o casal",
    ],
  },
  master: {
    type: "VENDOR" as const,
    name: "Fornecedor Master Elite",
    price: 24900, // R$ 249,00
    period: "/ mês",
    badge: "Alta Performance",
    features: [
      "Topo das buscas na sua categoria e região",
      "Banner de destaque no feed dos noivos",
      "Painel de Analytics de visualizações e propostas",
      "Envio de propostas e contratos digitais integrados",
    ],
  },
};

export type PlanKey = keyof typeof PLANS_CONFIG;

export function isPlanKey(value: string): value is PlanKey {
  return Object.prototype.hasOwnProperty.call(PLANS_CONFIG, value);
}

/**
 * Resolve tipo e preço (em centavos) de um plano. Planos personalizados são sempre de casal.
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
