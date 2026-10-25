import "server-only";
import { headers } from "next/headers";

/**
 * Rate Limiter
 * Protege endpoints sensíveis contra força bruta, card testing, scraping e spam.
 *
 * - Com UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN configurados, usa Redis (janela fixa),
 *   compartilhado entre todas as instâncias serverless.
 * - Sem eles, cai para memória local (janela deslizante). Em serverless cada instância tem
 *   o seu contador, então isso só é adequado para desenvolvimento ou servidor único.
 */

interface RegistroDeLimiteDeUso {
  timestamps: number[];
}

const armazemDeLimites = new Map<string, RegistroDeLimiteDeUso>();

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of armazemDeLimites.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 1000 * 60 * 60);
      if (record.timestamps.length === 0) armazemDeLimites.delete(key);
    }
  }, 1000 * 60 * 5).unref?.();
}

export interface OpcoesDoLimiteDeUso {
  key: string;
  limit: number; // Máximo de requisições permitidas
  windowMs: number; // Janela de tempo em milissegundos
}

export interface ResultadoDoLimiteDeUso {
  success: boolean;
  remaining: number;
  resetMs: number;
}

function conferirNaMemoria({ key, limit, windowMs }: OpcoesDoLimiteDeUso): ResultadoDoLimiteDeUso {
  const now = Date.now();
  let record = armazemDeLimites.get(key);
  if (!record) {
    record = { timestamps: [] };
    armazemDeLimites.set(key, record);
  }

  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0] || now;
    return { success: false, remaining: 0, resetMs: Math.max(0, windowMs - (now - oldest)) };
  }

  record.timestamps.push(now);
  return { success: true, remaining: limit - record.timestamps.length, resetMs: windowMs };
}

async function conferirNoUpstash(
  { key, limit, windowMs }: OpcoesDoLimiteDeUso,
  url: string,
  token: string
): Promise<ResultadoDoLimiteDeUso> {
  const redisKey = `ratelimit:${key}`;
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, String(windowMs), "NX"],
      ["PTTL", redisKey],
    ]),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash respondeu ${res.status}`);

  const [incr, , pttl] = (await res.json()) as { result: number }[];
  const count = Number(incr?.result ?? 0);
  const ttl = Math.max(0, Number(pttl?.result ?? windowMs));
  return { success: count <= limit, remaining: Math.max(0, limit - count), resetMs: ttl };
}

/**
 * Valida se a chave atual excedeu o limite de requisições.
 * Em caso de falha do Redis, degrada para o limitador em memória em vez de bloquear tudo.
 */
export async function conferirLimiteDeUso(options: OpcoesDoLimiteDeUso): Promise<ResultadoDoLimiteDeUso> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      return await conferirNoUpstash(options, url, token);
    } catch (error) {
      console.error("[RateLimit] Falha no Redis, usando memória local:", error);
    }
  }

  return conferirNaMemoria(options);
}

/**
 * IP do cliente a partir dos headers do proxy/CDN (Vercel, Cloudflare, Nginx).
 */
export async function obterIpDoCliente(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || h.get("cf-connecting-ip") || "unknown";
}

/**
 * Atalho: aplica o limite combinando o tipo de operação com o IP do cliente
 * (e, opcionalmente, um identificador extra como telefone ou usuário).
 */
export async function limitarUsoPorIp(
  scope: keyof typeof LimitesDeSeguranca,
  extra?: string
): Promise<ResultadoDoLimiteDeUso> {
  const ip = await obterIpDoCliente();
  const key = extra ? `${scope}:${ip}:${extra}` : `${scope}:${ip}`;
  return conferirLimiteDeUso({ key, ...LimitesDeSeguranca[scope] });
}

/**
 * Predefinições de segurança por tipo de operação
 */
export const LimitesDeSeguranca = {
  LOGIN: { limit: 5, windowMs: 1000 * 60 }, // 5 tentativas / minuto
  LOGIN_ACCOUNT: { limit: 20, windowMs: 1000 * 60 * 15 }, // 20 tentativas / 15 min por conta (qualquer IP)
  CHECKOUT: { limit: 10, windowMs: 1000 * 60 * 5 }, // 10 tentativas / 5 minutos
  RSVP: { limit: 15, windowMs: 1000 * 60 * 2 }, // 15 requisições / 2 minutos
  SIGNUP: { limit: 5, windowMs: 1000 * 60 * 10 }, // 5 cadastros / 10 minutos
  MESSAGES: { limit: 30, windowMs: 1000 * 60 }, // 30 disparos / minuto
  PUBLIC_FORM: { limit: 5, windowMs: 1000 * 60 * 10 }, // recados, avaliações, leads: 5 / 10 min
  PAYMENT_STATUS: { limit: 60, windowMs: 1000 * 60 }, // polling de status: 60 / minuto
};
