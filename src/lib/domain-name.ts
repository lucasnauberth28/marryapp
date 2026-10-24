// Nome do domínio pedido pelo casal. Puro (sem banco nem Next): roda no servidor, no navegador e nos testes.
// Nesta versão só registramos .com.br.

export const DOMAIN_SUFFIX = ".com.br";
const DOMAIN_LABEL_MIN = 2;
const DOMAIN_LABEL_MAX = 63;

export type DomainNameResult =
  | { ok: true; /** Só o nome, sem ".com.br": "ana-e-rafael" */ label: string; /** Nome completo: "ana-e-rafael.com.br" */ domain: string }
  | { ok: false; error: string };

const stripAccents = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Entende o que a pessoa digitou ("Ana e Rafael.com.br", "www.anaerafael.com.br", "https://ana-e-rafael.com.br/")
 * e devolve o nome em minúsculas, sem acentos e sem "www.". Mensagens de erro em português simples.
 */
export function normalizeDomainName(input: string): DomainNameResult {
  let text = stripAccents(String(input ?? ""))
    .toLowerCase()
    .trim();
  if (!text) return { ok: false, error: "Digite o nome que vocês querem para o endereço." };

  // Quem cola o endereço inteiro: tira o "https://", o caminho e a busca.
  text = text.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  text = text.split(/[/?#]/)[0].trim().replace(/\.+$/, "");

  // O final ".com.br" sai primeiro, para "www.com.br" continuar sendo o nome "www".
  let rest = text;
  let hadSuffix = false;
  if (rest.endsWith(DOMAIN_SUFFIX)) {
    rest = rest.slice(0, -DOMAIN_SUFFIX.length);
    hadSuffix = true;
  }
  if (rest.startsWith("www.") && rest.length > 4) rest = rest.slice(4);

  if (rest.includes(".")) {
    return {
      ok: false,
      error: hadSuffix
        ? "Escolham só o nome, sem pontos no meio. Por exemplo: anaerafael.com.br."
        : "Por enquanto só registramos endereços terminados em .com.br.",
    };
  }

  // Espaços viram hífen ("Ana e Rafael" → "ana-e-rafael"); hífens repetidos viram um só.
  const label = rest.trim().replace(/\s+/g, "-").replace(/-{2,}/g, "-");

  if (!label) return { ok: false, error: "Digite o nome que vocês querem para o endereço." };
  if (!/^[a-z0-9-]+$/.test(label)) {
    return { ok: false, error: "Use só letras, números e hífen, sem acentos nem símbolos." };
  }
  if (label.startsWith("-") || label.endsWith("-")) {
    return { ok: false, error: "O nome não pode começar nem terminar com hífen." };
  }
  if (label.length < DOMAIN_LABEL_MIN) {
    return { ok: false, error: `O nome precisa ter pelo menos ${DOMAIN_LABEL_MIN} letras.` };
  }
  if (label.length > DOMAIN_LABEL_MAX) {
    return { ok: false, error: `O nome pode ter no máximo ${DOMAIN_LABEL_MAX} letras.` };
  }
  return { ok: true, label, domain: `${label}${DOMAIN_SUFFIX}` };
}

/** Atalho: o nome completo normalizado ou null. */
export function toDomain(input: string): string | null {
  const result = normalizeDomainName(input);
  return result.ok ? result.domain : null;
}

/** "Ana & Rafael" → ["ana", "rafael"] (primeiro nome de cada lado, sem acentos nem símbolos). */
function firstNames(coupleNames: string): string[] {
  const clean = stripAccents(coupleNames).toLowerCase();
  const sides = clean
    .split(/\s*(?:&|\+|,|\be\b)\s*/)
    .map((side) => side.replace(/[^a-z0-9]+/g, " ").trim().split(" ")[0] ?? "")
    .filter(Boolean);
  return sides.slice(0, 2);
}

/**
 * Sugestões de nome a partir dos nomes do casal e do ano do casamento. Só devolve nomes válidos,
 * sem repetir e sem os que a pessoa já tentou (`exclude`, em qualquer formato aceito).
 * Ex.: "Ana & Rafael", 2027 → anaerafael, ana-e-rafael, anaerafael2027, casamentoanaerafael, aernoivos (iniciais + "noivos").
 */
export function suggestDomainNames(
  { coupleNames, weddingDate }: { coupleNames: string; weddingDate?: Date | null },
  options: { exclude?: string[]; max?: number } = {},
): string[] {
  const names = firstNames(coupleNames);
  if (names.length === 0) return [];

  const joined = names.join("e");
  const year = weddingDate instanceof Date && !Number.isNaN(weddingDate.getTime()) ? weddingDate.getUTCFullYear() : null;
  const initials = names.map((n) => n[0]).join("e") + "noivos";
  const candidates = [
    joined,
    names.join("-e-"),
    year ? `${joined}${year}` : null,
    `casamento${joined}`,
    names.length === 2 ? initials : null,
    names.length === 2 ? names.join("-") : null,
    year ? `casamento${joined}${year}` : null,
  ];

  const taken = new Set((options.exclude ?? []).map((d) => toDomain(d)).filter((d): d is string => !!d));
  const out: string[] = [];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const result = normalizeDomainName(candidate);
    if (!result.ok || taken.has(result.domain) || out.includes(result.domain)) continue;
    out.push(result.domain);
  }
  return out.slice(0, options.max ?? 5);
}
