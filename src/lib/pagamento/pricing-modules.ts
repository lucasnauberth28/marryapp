import { ROTULO_DA_TAXA_DO_PRESENTE } from "./gift-fee.ts";

export interface ModuloDePreco {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number; // em centavos
  iconName: string;
  isIncludedInBase?: boolean;
  highlightBadge?: string;
}

export const MODULOS_DO_CASAL: ModuloDePreco[] = [
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
    description: `Os presentes pagos por Pix chegam sem a taxa de ${ROTULO_DA_TAXA_DO_PRESENTE} do Aceito.`,
    price: 5900, // R$ 59,00
    iconName: "Percent",
  },
  {
    id: "whatsapp",
    name: "WhatsApp para convites e lembretes",
    category: "Comunicação",
    description: "Enviem convites e lembretes de confirmação pelo painel, direto no WhatsApp dos convidados.",
    price: 6900, // R$ 69,00
    iconName: "MessageCircle",
  },
  {
    id: "qrcode",
    name: "Registro de entrada com código QR",
    category: "Dia do Evento",
    description: "Leitor de código QR para registrar a chegada de cada convidado na festa e mostrar a mesa dele.",
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
    id: "tables3d",
    name: "Mesas em 3D com link para compartilhar",
    category: "Organização",
    description: "Escolham o cenário do casamento e sentem os convidados nas mesas em 3D. O link para ver o mapa é só leitura: só o casal altera.",
    price: 5900, // R$ 59,00
    iconName: "Box",
    highlightBadge: "Exclusivo VIP",
  },
  {
    id: "customDomain",
    name: "Endereço personalizado (.com.br)",
    category: "Endereço do site",
    description: "Registramos um endereço .com.br no nome de vocês e o site passa a abrir nele (exemplo: lucasegiovanna.com.br). O primeiro ano está incluído; as renovações ficam por conta de vocês.",
    price: 7900, // R$ 79,00
    iconName: "Compass",
    highlightBadge: "Exclusivo",
  },
];

/** Módulos que o plano Classic inclui; o VIP inclui todos. */
export const MODULOS_DO_CLASSIC = ["site", "pixZero", "whatsapp", "qrcode"];

/** Preço mínimo de um plano pronto: quem escolhe todos os recursos dele não paga menos que o plano. */
export interface PisoDoPlano {
  id: "classic" | "vip";
  modulos: readonly string[];
  preco: number;
}

/** Os pisos de Classic e VIP, com os preços vigentes (centavos). */
export function pisosDosPlanosProntos(precos: { classic: number; vip: number }): PisoDoPlano[] {
  return [
    { id: "classic", modulos: MODULOS_DO_CLASSIC, preco: precos.classic },
    { id: "vip", modulos: MODULOS_DO_CASAL.map((m) => m.id), preco: precos.vip },
  ];
}

/** O maior piso que a seleção alcança: tem todos os módulos daquele plano pronto. */
function pisoAlcancado(ids: readonly string[], pisos: readonly PisoDoPlano[]): PisoDoPlano | null {
  const alcancados = pisos.filter((p) => p.preco > 0 && p.modulos.every((id) => ids.includes(id)));
  return alcancados.sort((a, b) => b.preco - a.preco)[0] ?? null;
}

/**
 * Calcula o valor total e o desconto progressivo por combo.
 * `modules` é a lista com os preços vigentes (o catálogo mesclado da administração, lib/catalog.ts);
 * sem ela valem os preços do código.
 */
export function calcularPrecoDoPlanoPersonalizado(selectedModuleIds: string[], modules: readonly ModuloDePreco[] = MODULOS_DO_CASAL, pisos: readonly PisoDoPlano[] = []) {
  const selectedModules = modules.filter((m) =>
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

  const totalComDesconto = Math.max(0, subtotal - Math.round((subtotal * discountPercent) / 100));
  // Nunca sai mais barato que o plano pronto que tem os mesmos recursos (ou menos)
  const piso = pisoAlcancado(selectedModules.map((m) => m.id), pisos);
  const total = piso ? Math.max(totalComDesconto, piso.preco) : totalComDesconto;
  const discountAmount = Math.max(0, subtotal - total);

  return {
    selectedModules,
    paidCount,
    subtotal,
    discountPercent,
    discountBadge,
    discountAmount,
    total,
    /** Plano pronto que cobre estes recursos, quando o preço dele passou a valer (o desconto não chega abaixo dele). */
    planoEquivalente: piso && total === piso.preco ? piso.id : null,
  };
}
