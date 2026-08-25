export interface PricingModule {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number; // em centavos
  iconName: string;
  isIncludedInBase?: boolean;
  highlightBadge?: string;
}

export const COUPLE_MODULES: PricingModule[] = [
  {
    id: "site",
    name: "Site dos Noivos & Construtor No-Code",
    category: "Essencial",
    description: "Capa personalizada, história do casal, guia de trajes, mapa interativo Waze/Uber e mural de recados.",
    price: 4900, // R$ 49,00
    iconName: "Sliders",
    highlightBadge: "Base Essencial",
  },
  {
    id: "pixZero",
    name: "Taxa 0% no Pix dos Noivos",
    category: "Presentes",
    description: "Receba 100% do valor dos presentes em dinheiro com saque direto via Pix no mesmo dia sem desconto de 2,99%.",
    price: 5900, // R$ 59,00
    iconName: "Percent",
    highlightBadge: "Economia Real",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Automático & RSVP Interativo",
    category: "Comunicação",
    description: "Disparos automáticos de convites oficiais e lembretes de confirmação com botões interativos direto no WhatsApp.",
    price: 6900, // R$ 69,00
    iconName: "MessageCircle",
    highlightBadge: "Mais Pedido",
  },
  {
    id: "qrcode",
    name: "Credenciamento com QR Code na Portaria",
    category: "Dia do Evento",
    description: "Leitor de QR Code para recepção rápida de convidados, controle de presença e identificação de mesas.",
    price: 3900, // R$ 39,00
    iconName: "QrCode",
  },
  {
    id: "liveAlbum",
    name: "Mural de Fotos ao Vivo nas Mesas (Telão)",
    category: "Experiência",
    description: "QR Code nas mesas para convidados enviarem fotos da festa em tempo real projetadas no telão do evento.",
    price: 4900, // R$ 49,00
    iconName: "Sparkles",
  },
  {
    id: "tables",
    name: "Gestão de Mesas & Relatórios para Buffet",
    category: "Organização",
    description: "Organizador visual de assentos e exportação de relatórios em PDF com restrições alimentares para o chef.",
    price: 3900, // R$ 39,00
    iconName: "Users",
  },
  {
    id: "customDomain",
    name: "Domínio Próprio (.com.br) por 1 Ano",
    category: "Exclusividade",
    description: "Endereço exclusivo para os seus convites impressos (ex: www.lucasegiovanna.com.br) com SSL grátis incluso.",
    price: 7900, // R$ 79,00
    iconName: "Compass",
    highlightBadge: "Exclusivo",
  },
];

/**
 * Calcula o valor total e o desconto progressivo por combo
 */
export function calculateCustomPlanPrice(selectedModuleIds: string[]) {
  const selectedModules = COUPLE_MODULES.filter((m) =>
    selectedModuleIds.includes(m.id)
  );

  const subtotal = selectedModules.reduce((acc, m) => acc + m.price, 0);

  const paidCount = selectedModules.filter((m) => m.price > 0).length;

  let discountPercent = 0;
  let discountBadge = "";

  if (paidCount >= 5) {
    discountPercent = 25; // 25% OFF
    discountBadge = "Combo VIP (25% OFF)";
  } else if (paidCount >= 3) {
    discountPercent = 15; // 15% OFF
    discountBadge = "Combo Especial (15% OFF)";
  }

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount);

  return {
    selectedModules,
    paidCount,
    subtotal,
    discountPercent,
    discountBadge,
    discountAmount,
    total,
  };
}
