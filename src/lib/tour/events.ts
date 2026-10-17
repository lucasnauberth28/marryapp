// Sinais entre o passo a passo e a barra inferior do celular (sem estado compartilhado).

/** O passo a passo pede para abrir a aba "Mais" (onde ficam as áreas que não cabem na barra). */
export const TOUR_OPEN_MORE = "aceito:tour-abrir-mais";
/** O passo a passo pede para fechar a aba "Mais". */
export const TOUR_CLOSE_MORE = "aceito:tour-fechar-mais";

/**
 * Enquanto o passo a passo está na tela (cartão de boas-vindas ou balões), o <body> leva
 * `data-tour-active="true"`. O botão flutuante da Liz se esconde com isso, por exemplo em CSS:
 * `body[data-tour-active] .meu-botao { display: none }`, ou no Tailwind: `group-data-[tour-active]:hidden`.
 */
export const TOUR_ACTIVE_ATTR = "data-tour-active";

/** `data-tour` do botão flutuante da Liz (o passo da Liz só aparece se um elemento com este valor estiver na tela). */
export const TOUR_LIZ_ANCHOR = "liz";
