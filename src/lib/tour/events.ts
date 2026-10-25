// Constantes do passo a passo compartilhadas entre o passo a passo e o botão da Liz.

/**
 * Enquanto o passo a passo está na tela (cartão de boas-vindas ou balões), o <body> leva
 * `data-tour-active="true"`. O botão flutuante da Liz se esconde com isso, por exemplo em CSS:
 * `body[data-tour-active] .meu-botao { display: none }`, ou no Tailwind: `group-data-[tour-active]:hidden`.
 */
export const ATRIBUTO_DO_TOUR_ATIVO = "data-tour-active";
