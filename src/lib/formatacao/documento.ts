// Máscara de CPF e CNPJ enquanto a pessoa digita. A validação e o texto escondido ficam em document-br.ts.
import { somenteDigitos } from "./telefone.ts";

/** 000.000.000-00 ou 00.000.000/0000-00 enquanto a pessoa digita. */
export function mascararDocumentoDigitando(texto: string, tipo: "CPF" | "CNPJ") {
  const d = somenteDigitos(texto).slice(0, tipo === "CPF" ? 11 : 14);
  if (tipo === "CPF") {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
