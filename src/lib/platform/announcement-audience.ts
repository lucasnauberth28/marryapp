// Comunicados: o público (casais, fornecedores ou todos), o recorte por plano e por data do casamento, e o link do botão.
import { z } from "zod";

const TIPOS_DE_PUBLICO = ["couples", "vendors", "all"] as const;
export const GRUPOS_DE_PLANO_DO_CASAL = ["all", "basic", "classic", "vip", "custom", "classic_vip", "paid"] as const;
export const GRUPOS_DE_PLANO_DO_FORNECEDOR = ["all", "free", "pro", "master", "pro_master", "paid"] as const;
export const JANELAS_DE_CASAMENTO = ["all", "30", "60", "90", "past"] as const;

/** Filtro de público guardado em Announcement.audience. */
export const esquemaDoPublico = z.object({
  kind: z.enum(TIPOS_DE_PUBLICO),
  couplePlans: z.enum(GRUPOS_DE_PLANO_DO_CASAL).default("all"),
  vendorPlans: z.enum(GRUPOS_DE_PLANO_DO_FORNECEDOR).default("all"),
  weddingWindow: z.enum(JANELAS_DE_CASAMENTO).default("all"),
  /** Casais escolhidos na lista de Casais (restringe os destinatários). */
  weddingIds: z.array(z.string().uuid()).max(500).optional(),
  /** Aviso de serviço (manutenção, cobrança, segurança) ignora a escolha de não receber e-mail; novidade respeita. */
  service: z.boolean().default(false),
});
export type Publico = z.infer<typeof esquemaDoPublico>;

export const CANAIS = ["PANEL", "PUSH", "EMAIL"] as const;
export type Canal = (typeof CANAIS)[number];

export const ROTULO_DO_CANAL: Record<Canal | "WHATSAPP", string> = {
  PANEL: "Aviso no painel",
  PUSH: "Notificação no celular",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
};

/** Por que o WhatsApp não é oferecido (aparece no campo desligado). */
export const MOTIVO_DO_WHATSAPP_DESLIGADO =
  "Indisponível: o cadastro do casal não guarda o número de WhatsApp e não há envio em massa autorizado.";

export const ROTULO_DO_GRUPO_DE_PLANO: Record<string, string> = {
  all: "Todos os planos",
  basic: "Básico",
  classic: "Classic",
  vip: "VIP",
  custom: "Adaptado",
  classic_vip: "Classic e VIP",
  paid: "Só planos pagos",
  free: "Start",
  pro: "Pro",
  master: "Master",
  pro_master: "Pro e Master",
};

export const ROTULO_DA_JANELA: Record<(typeof JANELAS_DE_CASAMENTO)[number], string> = {
  all: "Qualquer data",
  "30": "Próximos 30 dias",
  "60": "Próximos 60 dias",
  "90": "Próximos 90 dias",
  past: "Já aconteceram",
};

/** Texto do público para o histórico: "Casais Classic e VIP, casamento nos próximos 90 dias". */
export function rotuloDoPublico(audience: Publico): string {
  const parts: string[] = [];
  if (audience.kind === "all") parts.push("Casais e fornecedores");
  else if (audience.kind === "couples") parts.push(audience.couplePlans === "all" ? "Casais" : `Casais ${ROTULO_DO_GRUPO_DE_PLANO[audience.couplePlans]}`);
  else parts.push(audience.vendorPlans === "all" ? "Fornecedores" : `Fornecedores ${ROTULO_DO_GRUPO_DE_PLANO[audience.vendorPlans]}`);
  if (audience.kind !== "vendors" && audience.weddingWindow !== "all") parts.push(`casamento: ${ROTULO_DA_JANELA[audience.weddingWindow].toLowerCase()}`);
  if (audience.weddingIds?.length) parts.push(audience.weddingIds.length === 1 ? "1 casal escolhido" : `${audience.weddingIds.length} casais escolhidos`);
  return parts.join(", ");
}

/** Filtro guardado no banco (pode estar velho ou inválido): nunca lança, cai no padrão "Casais". */
export function interpretarPublico(raw: unknown): Publico {
  const parsed = esquemaDoPublico.safeParse(raw);
  return parsed.success ? parsed.data : esquemaDoPublico.parse({ kind: "couples" });
}

/** Planos de casal incluídos em cada grupo (a chave `basic` é o casamento sem assinatura paga). */
export function chavesDePlanoDoCasal(group: Publico["couplePlans"]): string[] | null {
  switch (group) {
    case "all": return null;
    case "classic_vip": return ["classic", "vip"];
    case "paid": return ["classic", "vip", "custom"];
    default: return [group];
  }
}

export function chavesDeNivelDoFornecedor(group: Publico["vendorPlans"]): ("FREE" | "PRO" | "MASTER")[] | null {
  switch (group) {
    case "all": return null;
    case "free": return ["FREE"];
    case "pro": return ["PRO"];
    case "master": return ["MASTER"];
    case "pro_master": case "paid": return ["PRO", "MASTER"];
  }
}

/** Janela de casamento em datas: [início, fim) relativas a `now`; null = sem filtro. */
export function intervaloDaJanelaDeCasamento(window: Publico["weddingWindow"], now: Date): { gte?: Date; lt?: Date } | null {
  if (window === "all") return null;
  if (window === "past") return { lt: inicioDoDiaUtc(now) };
  const days = Number(window);
  const start = inicioDoDiaUtc(now);
  return { gte: start, lt: new Date(start.getTime() + (days + 1) * 86_400_000) };
}

function inicioDoDiaUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Link do botão: só https:// com endereço de verdade. Vazio é permitido (sem botão). */
