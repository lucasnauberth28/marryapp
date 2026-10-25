const formatoDoSalvo = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export function paraCampoDeData(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function interpretarPaleta(raw?: string | null): string[] {
  try {
    const p = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? p.filter((c) => typeof c === "string") : [];
  } catch {
    return [];
  }
}

/** O que o cabeçalho diz sobre o estado da publicação. */
export function rotuloDaPublicacao(alterado: boolean, publicadoEm: string | null) {
  if (alterado) return "alterações ainda não publicadas";
  return publicadoEm ? `publicado em ${formatoDoSalvo.format(new Date(publicadoEm)).replace(".", "")}` : "tudo publicado";
}
