// Dinheiro em reais, em um só lugar. Todo valor entra em centavos. Sem dependências: roda no servidor, no navegador e
// nos testes. O espaço entre o R$ e o número é o sem quebra, para o valor não ficar partido em duas linhas.

const formatoComCentavos = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoInteiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const formatoSemSimbolo = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Centavos em reais, sempre com centavos: 14900 -> "R$ 149,00". */
export function formatarReais(centavos: number): string {
  return formatoComCentavos.format(centavos / 100);
}

/** Centavos em reais inteiros, para números grandes de destaque: 423700 -> "R$ 4.237". */
export function formatarReaisInteiros(centavos: number): string {
  return formatoInteiro.format(centavos / 100);
}

/** Sem centavos quando o valor é redondo: 35000 -> "R$ 350", 35050 -> "R$ 350,50". */
export function formatarReaisEnxuto(centavos: number): string {
  return centavos % 100 === 0 ? formatarReaisInteiros(centavos) : formatarReais(centavos);
}

/** Só o número, sem o R$: 125050 -> "1.250,50". */
export function formatarValorSemSimbolo(centavos: number): string {
  return formatoSemSimbolo.format(centavos / 100);
}

/** O que a pessoa digitou ("10,50", "10.50", "R$ 1.250,00") em centavos; null se não for um valor. */
export function reaisParaCentavos(value: string): number | null {
  const clean = value.trim().replace(/\s|R\$/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}
