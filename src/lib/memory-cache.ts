export interface CacheComValidade<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
  clear(): void;
  readonly size: number;
}

/** Cache simples com validade e teto de entradas (host forjado em massa não cresce a memória sem limite). */
export function criarCacheComValidade<V>(ttlMs: number, maxEntries = 500, now: () => number = Date.now): CacheComValidade<V> {
  const map = new Map<string, { value: V; expires: number }>();
  return {
    get(key) {
      const hit = map.get(key);
      if (!hit) return undefined;
      if (hit.expires <= now()) {
        map.delete(key);
        return undefined;
      }
      return hit.value;
    },
    set(key, value) {
      if (map.size >= maxEntries && !map.has(key)) {
        // Tira primeiro as vencidas; se continuar cheio, a mais antiga.
        const t = now();
        for (const [k, v] of map) if (v.expires <= t) map.delete(k);
        if (map.size >= maxEntries) {
          const oldest = map.keys().next().value;
          if (oldest !== undefined) map.delete(oldest);
        }
      }
      map.set(key, { value, expires: now() + ttlMs });
    },
    clear() {
      map.clear();
    },
    get size() {
      return map.size;
    },
  };
}
