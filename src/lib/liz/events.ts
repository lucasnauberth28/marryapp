/** Pedido para abrir o painel da Liz (ex.: o cartão de sugestão do Início tem o botão "Falar com a Liz"). */
export const EVENTO_DE_ABRIR_A_LIZ = "aceito:liz-abrir";

/** Abre o painel da Liz, se o botão dela estiver na tela. */
export function abrirALiz(): void {
  window.dispatchEvent(new Event(EVENTO_DE_ABRIR_A_LIZ));
}
