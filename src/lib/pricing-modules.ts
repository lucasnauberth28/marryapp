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
    name: "Site dos noivos com editor completo",
    category: "Essencial",
    description: "Capa personalizada, história do casal, guia de trajes, mapa interativo Waze/Uber e mural de recados.",
    price: 4900, // R$ 49,00
    iconName: "Sliders",
    highlightBadge: "Base Essencial",
  },
  {
    id: "pixZero",
    name: "Sem taxa no Pix dos presentes",
    category: "Presentes",
    description: "Vocês recebem o valor inteiro dos presentes, sem o desconto de 2,99%.",
    price: 5900, // R$ 59,00
    iconName: "Percent",
    highlightBadge: "Economia Real",
  },
  {
    id: "whatsapp",
    name: "WhatsApp para convites, lembretes e agradecimentos",
    category: "Comunicação",
    description: "Mande convites e lembretes de confirmação pelo painel, direto no WhatsApp dos convidados, e o agradecimento sai sozinho quando alguém presenteia.",
    price: 6900, // R$ 69,00
    iconName: "MessageCircle",
    highlightBadge: "Mais Pedido",
  },
  {
    id: "qrcode",
    name: "Check-in com QR Code na portaria",
    category: "Dia do Evento",
    description: "Leitor de QR Code para receber os convidados rápido, marcar presença e indicar a mesa.",
    price: 3900, // R$ 39,00
    iconName: "QrCode",
  },
  {
    id: "tables",
    name: "Mesas e relatório para o buffet",
    category: "Organização",
    description: "Organize os lugares e gere um PDF com as restrições alimentares para o buffet.",
    price: 3900, // R$ 39,00
    iconName: "Users",
  },
  {
    id: "customDomain",
    name: "Domínio próprio (.com.br) por 1 ano",
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
