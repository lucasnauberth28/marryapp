/** Pedido para abrir o painel da Liz (ex.: o cartão de sugestão do Início tem o botão "Perguntar à Liz"). */
export const LIZ_OPEN_EVENT = "aceito:liz-abrir";

/** Abre o painel da Liz, se o botão dela estiver na tela. */
export function openLiz(): void {
  window.dispatchEvent(new Event(LIZ_OPEN_EVENT));
}
