// Disponibilidade de um .com.br pelo RDAP do Registro.br. Sem "server-only" e com `fetch` injetável,
// para testar com respostas simuladas. A resposta é só um aviso: quem confere de verdade é o dono
// do Aceito, na hora de registrar. Por isso falha de rede, limite de consultas ou lentidão viram
// "indisponível agora" e não bloqueiam o pedido.

import { toDomain } from "./domain-name.ts";

export type DomainAvailability =
  /** Ninguém registrou. */
  | "available"
  /** Já tem dono. */
  | "taken"
  /** Está em processo de liberação: não dá para pedir agora. */
  | "releasing"
  /** Não deu para consultar agora (não impede o pedido). */
  | "unknown";

export const DEFAULT_RDAP_BASE = "https://rdap.registro.br";
export const RDAP_TIMEOUT_MS = 5000;

export interface AvailabilityOptions {
  fetch?: typeof fetch;
  /** Padrão: DOMAIN_RDAP_BASE do ambiente (usada nos testes) ou o RDAP do Registro.br. */
  base?: string;
  timeoutMs?: number;
}

/** Texto de estado do RDAP sem espaços, caixa nem símbolos: "pending delete" e "pendingDelete" viram o mesmo. */
const statusKey = (value: unknown) => (typeof value === "string" ? value.toLowerCase().replace(/[^a-z]/g, "") : "");

/** O JSON do RDAP diz que o domínio está sendo liberado (pendingDelete)? */
export function isPendingDelete(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const status = (body as { status?: unknown }).status;
  const list = Array.isArray(status) ? status : [status];
  return list.some((s) => statusKey(s) === "pendingdelete");
}

function rdapBase(options: AvailabilityOptions): string {
  const configured = options.base ?? (typeof process !== "undefined" ? process.env.DOMAIN_RDAP_BASE : undefined);
  return (configured?.trim() || DEFAULT_RDAP_BASE).replace(/\/+$/, "");
}

/**
 * Consulta se o domínio está livre. Só aceita nomes .com.br válidos (o que não for válido vira "unknown"
 * sem sair da máquina). 404 = livre; 200 = ocupado (ou em liberação, se o JSON disser pendingDelete);
 * qualquer outra coisa (erro, 429, 5xx, lentidão) = "unknown".
 */
export async function checkDomainAvailability(domainInput: string, options: AvailabilityOptions = {}): Promise<DomainAvailability> {
  const domain = toDomain(domainInput);
  if (!domain) return "unknown";

  const doFetch = options.fetch ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? RDAP_TIMEOUT_MS);
  try {
    const response = await doFetch(`${rdapBase(options)}/domain/${encodeURIComponent(domain)}`, {
      method: "GET",
      headers: { accept: "application/rdap+json, application/json" },
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });
    if (response.status === 404) return "available";
    if (response.status !== 200) return "unknown";
    const body = await response.json().catch(() => null);
    return isPendingDelete(body) ? "releasing" : "taken";
  } catch {
    return "unknown";
  } finally {
    clearTimeout(timer);
  }
}

/** Frase para mostrar ao casal, com a cor do aviso. */
export const AVAILABILITY_TEXT: Record<DomainAvailability, { tone: "sucesso" | "perigo" | "aviso" | "neutro"; text: (domain: string) => string }> = {
  available: { tone: "sucesso", text: (d) => `${d} parece estar livre. Confirmamos na hora de registrar.` },
  taken: { tone: "perigo", text: (d) => `${d} já tem dono. Experimentem uma das sugestões ou outro nome.` },
  releasing: { tone: "aviso", text: (d) => `${d} está em liberação e não dá para pedir agora. Escolham outro nome ou tentem de novo mais tarde.` },
  unknown: { tone: "neutro", text: () => "Não deu para conferir agora. Vocês podem fazer o pedido mesmo assim: conferimos na hora de registrar." },
};
