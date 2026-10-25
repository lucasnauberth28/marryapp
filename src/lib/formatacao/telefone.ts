// Telefone brasileiro: só os dígitos, o texto legível e a máscara enquanto a pessoa digita. Sem dependências.

/** Tira tudo que não é número: "(11) 98765-4321" -> "11987654321". Aceita vazio. */
export function somenteDigitos(texto: string | null | undefined): string {
  return (texto ?? "").replace(/\D/g, "");
}

/**
 * Telefone legível a partir dos dígitos guardados:
 * "11988887777" -> "(11) 98888-7777"; "5511988887777" -> "+55 (11) 98888-7777".
 * Se não reconhecer o formato, devolve os dígitos como vieram.
 */
export function formatarTelefone(telefone: string | null | undefined): string {
  const digitos = somenteDigitos(telefone);
  const nacional = digitos.length >= 12 && digitos.startsWith("55") ? digitos.slice(2) : digitos;
  const prefixo = nacional !== digitos ? "+55 " : "";
  if (nacional.length === 11) return `${prefixo}(${nacional.slice(0, 2)}) ${nacional.slice(2, 7)}-${nacional.slice(7)}`;
  if (nacional.length === 10) return `${prefixo}(${nacional.slice(0, 2)}) ${nacional.slice(2, 6)}-${nacional.slice(6)}`;
  return digitos;
}

/** "(11) 98765-4321" enquanto a pessoa digita. */
export function mascararTelefone(texto: string): string {
  const d = somenteDigitos(texto).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
