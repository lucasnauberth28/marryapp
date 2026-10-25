// CPF e CNPJ: validação pelos dígitos verificadores, máscara e versão escondida. Puro (sem banco nem Next).

export type TipoDeDocumento = "cpf" | "cnpj";

/** Tira pontos, traço, barra e espaços; letras ficam em maiúsculas (o CNPJ novo aceita letras). */
export function normalizarDocumento(input: string): string {
  return String(input ?? "")
    .replace(/[\s.\-/]/g, "")
    .toUpperCase();
}

const todosIguais = (value: string) => /^(.)\1*$/.test(value);

/** CPF: 11 dígitos, não todos iguais, e os dois dígitos verificadores batem. */
export function ehCpfValido(input: string): boolean {
  const cpf = normalizarDocumento(input);
  if (!/^\d{11}$/.test(cpf) || todosIguais(cpf)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

/**
 * CNPJ: 14 caracteres, os 12 primeiros números ou letras (o CNPJ alfanumérico da Receita) e os
 * 2 últimos números. Cada caractere vale seu código ASCII menos 48 (para números é o próprio dígito).
 */
export function ehCnpjValido(input: string): boolean {
  const cnpj = normalizarDocumento(input);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || todosIguais(cnpj)) return false;
  const value = (char: string) => char.charCodeAt(0) - 48;
  const digit = (length: number) => {
    let weight = 2;
    let sum = 0;
    for (let i = length - 1; i >= 0; i--) {
      sum += value(cnpj[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13]);
}

/** "cpf", "cnpj" ou null quando não é nenhum dos dois (inclusive com dígitos errados). */
export function tipoDoDocumento(input: string): TipoDeDocumento | null {
  if (ehCpfValido(input)) return "cpf";
  if (ehCnpjValido(input)) return "cnpj";
  return null;
}

export function ehDocumentoValido(input: string): boolean {
  return tipoDoDocumento(input) !== null;
}

/** Máscara de exibição: 000.000.000-00 ou 00.000.000/0000-00. Valor fora do tamanho volta como veio. */
export function formatarDocumento(input: string): string {
  const doc = normalizarDocumento(input);
  if (/^\d{11}$/.test(doc)) return `${doc.slice(0, 3)}.${doc.slice(3, 6)}.${doc.slice(6, 9)}-${doc.slice(9)}`;
  if (/^[0-9A-Z]{12}\d{2}$/.test(doc)) {
    return `${doc.slice(0, 2)}.${doc.slice(2, 5)}.${doc.slice(5, 8)}/${doc.slice(8, 12)}-${doc.slice(12)}`;
  }
  return String(input ?? "");
}

/** Este valor já é a versão escondida (tem asterisco)? */
export function ehDocumentoEscondido(input: string): boolean {
  return String(input ?? "").includes("*");
}

/**
 * Versão escondida para guardar depois do registro (privacidade): só o miolo aparece.
 * CPF 529.982.247-25 → ***.982.247-**; CNPJ 11.222.333/0001-81 → **.222.333/****-**.
 * Valor que não é CPF nem CNPJ nunca volta inteiro: vira só asteriscos. Já escondido, volta igual.
 */
export function esconderDocumento(input: string): string {
  if (ehDocumentoEscondido(input)) return String(input);
  const doc = normalizarDocumento(input);
  if (/^\d{11}$/.test(doc)) return `***.${doc.slice(3, 6)}.${doc.slice(6, 9)}-**`;
  if (/^[0-9A-Z]{14}$/.test(doc)) return `**.${doc.slice(2, 5)}.${doc.slice(5, 8)}/****-**`;
  return "***";
}
