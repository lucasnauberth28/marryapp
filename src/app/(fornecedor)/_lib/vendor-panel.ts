import { somenteDigitos } from "@/lib/formatacao/telefone";
// Constantes e formatação do painel do fornecedor. Sem dependências de servidor:
// usado por páginas, componentes de cliente e pelas Server Actions.

export const SITUACOES_DO_PEDIDO = ["NEW", "CONTACTED", "PROPOSAL_SENT", "CLOSED", "DECLINED"] as const;
export type SituacaoDoPedido = (typeof SITUACOES_DO_PEDIDO)[number];

export function ehSituacaoDoPedido(value: string): value is SituacaoDoPedido {
  return (SITUACOES_DO_PEDIDO as readonly string[]).includes(value);
}

export const ROTULO_DA_SITUACAO_DO_PEDIDO: Record<SituacaoDoPedido, string> = {
  NEW: "Novo",
  CONTACTED: "Respondido",
  PROPOSAL_SENT: "Proposta enviada",
  CLOSED: "Fechado",
  DECLINED: "Recusado",
};

/** Próximo passo do funil e o rótulo do botão que leva até ele. */
export const PROXIMO_PASSO_DO_PEDIDO: Record<SituacaoDoPedido, { status: SituacaoDoPedido; label: string } | null> = {
  NEW: { status: "CONTACTED", label: "Marcar como respondido" },
  CONTACTED: { status: "PROPOSAL_SENT", label: "Marcar proposta enviada" },
  PROPOSAL_SENT: { status: "CLOSED", label: "Marcar como fechado" },
  CLOSED: null,
  DECLINED: null,
};

/** Faixas de orçamento do formulário público "pedir orçamento". */
export const OPCOES_DE_ORCAMENTO_DO_PEDIDO = [
  "Até R$ 3 mil",
  "R$ 3 a 6 mil",
  "R$ 6 a 9 mil",
  "R$ 9 a 15 mil",
  "Acima de R$ 15 mil",
  "Ainda não sei",
] as const;

/** Tipos de compromisso da agenda (VendorEvent.kind). */
export const TIPOS_DE_EVENTO_DO_FORNECEDOR = ["MEETING", "BLOCKED"] as const;
export type TipoDeEventoDoFornecedor = (typeof TIPOS_DE_EVENTO_DO_FORNECEDOR)[number];

/** Categorias do marketplace (mesma lista da vitrine pública e do cadastro). */
export const CATEGORIAS_DE_FORNECEDOR = [
  "Espaço",
  "Buffet",
  "Fotografia",
  "Decoração",
  "DJ & Som",
  "Vestidos",
  "Doces & Bolo",
] as const;

/** Plano Start (gratuito): até 3 pedidos de orçamento por mês (ver PLANS_CONFIG.start em lib/plans). */
export const LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL = 3;

/** Página do plano no painel (assinar, renovar ou trocar). */
export const LINK_DO_PLANO = "/fornecedor/plano";

export const ROTULO_DO_PLANO: Record<string, string> = {
  FREE: "Plano Start",
  PRO: "Plano Pro",
  MASTER: "Plano Master",
};

export const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Datas do casamento são gravadas à meia-noite UTC: formata em UTC para não voltar um dia. */
export function formatarDataDoCasamento(date: Date | null): string | null {
  if (!date) return null;
  return `${date.getUTCDate()} ${MESES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export const NOMES_DOS_MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const DIAS_DA_SEMANA_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_DA_SEMANA_LONGOS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** "Sábado, 17 abr 2027" (data gravada à meia-noite UTC). */
export function formatarDataDoCasamentoPorExtenso(date: Date | null): string | null {
  if (!date) return null;
  return `${DIAS_DA_SEMANA_LONGOS[date.getUTCDay()]}, ${formatarDataDoCasamento(date)}`;
}

/** Date (meia-noite UTC) -> "2026-10-09". */
export function paraDataIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "2026-10-09" -> Date à meia-noite UTC (ou null se inválida). */
export function interpretarDataIso(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || paraDataIso(date) !== value ? null : date;
}

/** "19:00" -> "19h"; "18:30" -> "18h30". */
export function formatarHoraDoPainel(time: string | null): string | null {
  if (!time) return null;
  const [h, m] = time.split(":");
  return `${Number(h)}h${m && m !== "00" ? m : ""}`;
}

/** Centavos -> "R$ 7.800" ou "R$ 7.800,50". */
export function formatarReaisDoPainel(cents: number | null): string | null {
  if (cents == null) return null;
  return `R$ ${centavosParaCampoDeReais(cents)}`;
}

const DESLOCAMENTO_DE_BRASILIA_EM_MS = 3 * 60 * 60 * 1000; // Brasília (UTC-3, sem horário de verão desde 2019)

/** "há 2 h", "há 15 min", "ontem" ou "3 out" (em horário de Brasília). */
export function formatarTempoRelativo(date: Date, now: Date = new Date()): string {
  const diffMin = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const local = new Date(date.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  const today = new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  const days = Math.round(
    (Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) -
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())) /
      86400000,
  );
  if (days === 1) return "ontem";
  const sameYear = local.getUTCFullYear() === today.getUTCFullYear();
  return `${local.getUTCDate()} ${MESES[local.getUTCMonth()]}${sameYear ? "" : ` ${local.getUTCFullYear()}`}`;
}

/** Dia de hoje em Brasília, como Date à meia-noite UTC (mesmo formato das datas de casamento). */
export function hojeEmBrasilia(now: Date = new Date()): Date {
  const local = new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
}

/** Data e hora em Brasília: "hoje, 14:20", "ontem, 09:05" ou "3 out, 14:20". */
export function formatarDataEHoraEmBrasilia(date: Date, now: Date = new Date()): string {
  const local = new Date(date.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  const day = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const diffDays = Math.round((hojeEmBrasilia(now).getTime() - day) / 86400000);
  const hm = `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`;
  if (diffDays === 0) return `hoje, ${hm}`;
  if (diffDays === 1) return `ontem, ${hm}`;
  const sameYear = local.getUTCFullYear() === new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS).getUTCFullYear();
  return `${local.getUTCDate()} ${MESES[local.getUTCMonth()]}${sameYear ? "" : ` ${local.getUTCFullYear()}`}, ${hm}`;
}

/** Primeiro instante do mês corrente em Brasília, como Date UTC. */
export function inicioDoMesEmBrasilia(now: Date = new Date()): Date {
  const local = new Date(now.getTime() - DESLOCAMENTO_DE_BRASILIA_EM_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) + DESLOCAMENTO_DE_BRASILIA_EM_MS);
}

/** Link do WhatsApp para um telefone brasileiro (com ou sem 55), com mensagem pronta. */
export function linkDoWhatsapp(phone: string, text?: string): string | null {
  let digits = somenteDigitos(phone);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 12 || digits.length > 13) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
/** Centavos para "6.800" ou "6.800,50" (sem o "R$"), para preencher o campo de preço. */
export function centavosParaCampoDeReais(cents: number | null): string {
  if (cents == null) return "";
  const hasCents = cents % 100 !== 0;
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/** serviceRegions é um JSON de strings; tolera texto antigo fora do formato. */
export function interpretarRegioes(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((r): r is string => typeof r === "string") : [];
  } catch {
    return value.split(",").map((r) => r.trim()).filter(Boolean);
  }
}

export function iniciaisDe(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => /^[\p{L}\p{N}]/u.test(p));
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "A";
}

// ==========================================
// PLANO EFETIVO, PEDIDOS BLOQUEADOS E LINKS PÚBLICOS
// ==========================================

export type NivelDoFornecedor = "FREE" | "PRO" | "MASTER";

/**
 * Plano em vigor: um plano pago com período vencido vale como Start,
 * mesmo antes de a rotina de expiração gravar FREE no banco.
 */
export function nivelEfetivoDoFornecedor(planTier: string, planExpiresAt: Date | null, now: Date = new Date()): NivelDoFornecedor {
  if (planTier !== "PRO" && planTier !== "MASTER") return "FREE";
  if (planExpiresAt && planExpiresAt.getTime() <= now.getTime()) return "FREE";
  return planTier;
}

/**
 * Pedido bloqueado pelo limite do Start. Se o fornecedor passou a ter um plano pago
 * (inclusive dado manualmente), o pedido deixa de ser tratado como bloqueado.
 */
export function pedidoEstaBloqueado(lead: { locked: boolean }, tier: NivelDoFornecedor): boolean {
  return lead.locked && tier === "FREE";
}

/** "Giovanna & Lucas" -> "Giovanna" (pedido bloqueado mostra só o primeiro nome). */
export function primeiroNomeDe(name: string): string {
  return name.trim().split(/[\s&,]+/)[0] || "Casal";
}

/** Tokens públicos (proposta e avaliação): 24 bytes em base64url. */
export const PADRAO_DO_TOKEN_PUBLICO = /^[A-Za-z0-9_-]{32}$/;

function origemPublica(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? "https://meuaceito.com.br").replace(/\/+$/, "");
}

/** Link que o casal abre para aceitar a proposta. */
export function urlPublicaDaProposta(token: string): string {
  return `${origemPublica()}/proposta/${token}`;
}

/** Link que o casal abre para avaliar o fornecedor. */
export function urlPublicaDaAvaliacao(token: string): string {
  return `${origemPublica()}/avaliar/${token}`;
}

/** Galeria (JSON de URLs) tolerante a valores antigos. */
export function interpretarGaleria(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((u): u is string => typeof u === "string" && u.length > 0) : [];
  } catch {
    return [];
  }
}

export const MAXIMO_DE_IMAGENS_NA_GALERIA = 8;
