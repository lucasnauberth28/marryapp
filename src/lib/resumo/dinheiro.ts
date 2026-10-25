// Resumo do casamento: dinheiro escrito (com centavos, saída com sinal e partes de destaque).
import { formatarReais } from "../formatacao/dinheiro.ts";

const formatoDeReais = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "R$ 3.850,00": sempre com centavos. */
export function formatarReaisSemSinal(cents: number): string {
  return formatarReais(Math.abs(cents));
}

/** Saída com sinal de menos verdadeiro: "−R$ 193,90". */
export function formatarReaisDeSaida(cents: number): string {
  return `−${formatarReaisSemSinal(cents)}`;
}

/** Partes de um valor de destaque: reais com milhar e os centavos à parte. */
export function separarReais(cents: number): { whole: string; cents: string } {
  const [whole, c] = formatoDeReais.format(Math.abs(cents) / 100).split(",");
  return { whole, cents: c };
}
