// Concordância de número em português. Sem dependências: roda no servidor, no navegador e nos testes.

const formatoInteiro = new Intl.NumberFormat("pt-BR");

/** O número com a palavra no singular ou no plural: (1, "casal", "casais") -> "1 casal"; (1236, ...) -> "1.236 casais". */
export function pluralizar(quantidade: number, singular: string, plural: string): string {
  return `${formatoInteiro.format(quantidade)} ${escolherPlural(quantidade, singular, plural)}`;
}

/** Só a palavra, sem o número: (1, "convidado", "convidados") -> "convidado". */
export function escolherPlural(quantidade: number, singular: string, plural: string): string {
  return quantidade === 1 ? singular : plural;
}
