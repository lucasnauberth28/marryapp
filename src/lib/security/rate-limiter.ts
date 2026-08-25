/**
 * Rate Limiter com Algoritmo de Janela Deslizante (Sliding Window)
 * Protege endpoints sensíveis contra Ataques de Força Bruta, Card Testing, Scraping e Spam.
 */

interface RateLimitRecord {
  timestamps: number[];
}

// Armazenamento em memória (isolado por chave de contexto)
const store = new Map<string, RateLimitRecord>();

// Limpeza automática de registros expirados a cada 5 minutos
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 1000 * 60 * 15);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 1000 * 60 * 5);
}

export interface RateLimitOptions {
  key: string;
  limit: number; // Máximo de requisições permitidas
  windowMs: number; // Janela de tempo em milissegundos
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Valida se a chave/IP atual excedeu o limite de requisições.
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { key, limit, windowMs } = options;
  const now = Date.now();

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filtra apenas timestamps dentro da janela atual
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0] || now;
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return {
      success: false,
      remaining: 0,
      resetMs,
    };
  }

  // Registra a requisição atual
  record.timestamps.push(now);

  return {
    success: true,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Predefinições de segurança por tipo de operação
 */
export const SecurityLimits = {
  LOGIN: { limit: 5, windowMs: 1000 * 60 }, // 5 tentativas / minuto
  CHECKOUT: { limit: 10, windowMs: 1000 * 60 * 5 }, // 10 tentativas / 5 minutos
  RSVP: { limit: 15, windowMs: 1000 * 60 * 2 }, // 15 requisições / 2 minutos
  SIGNUP: { limit: 5, windowMs: 1000 * 60 * 10 }, // 5 cadastros / 10 minutos
  MESSAGES: { limit: 30, windowMs: 1000 * 60 }, // 30 disparos / minuto
};
