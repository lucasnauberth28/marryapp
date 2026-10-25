/**
 * Classes compartilhadas pelas telas do painel (convidados, mesas, mensagens, tarefas, cronograma).
 * Seguem o design system: campos de 44px, cartões com borda linha, chips com ícone e palavra.
 */
import { estiloDoBotao } from "@/components/landing/styles";

export { estiloDoBotao };

/** Botão de ação destrutiva: contorno em perigo, fundo papel. */
export const estiloDoBotaoDePerigo =
  "group/btn relative inline-flex min-h-11 cursor-pointer select-none items-center justify-center gap-2 rounded-[12px] border border-perigo bg-papel px-4 text-sm font-semibold leading-5 text-perigo no-underline transition-colors duration-150 hover:bg-perigo-suave disabled:cursor-not-allowed disabled:opacity-60";

/** Botão só com ícone, com 44px de área de toque. */
export const estiloDoBotaoDeIcone =
  "inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-[12px] text-tinta-suave transition-colors duration-150 hover:bg-ameixa-suave hover:text-ameixa disabled:cursor-not-allowed disabled:opacity-60";

export const estiloDoBotaoDeIconeDePerigo =
  "inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-[12px] text-tinta-suave transition-colors duration-150 hover:bg-perigo-suave hover:text-perigo disabled:cursor-not-allowed disabled:opacity-60";

/** Cartão: papel, borda linha, raio grande e sombra leve. */
export const estiloDoCartao = "rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)]";

export const estiloDoRotuloDoPainel = "text-sm font-semibold leading-5 text-tinta";

export const estiloDaDicaDoPainel = "text-sm leading-5 text-tinta-suave";

export const estiloDaEntradaDoPainel =
  "min-h-11 w-full rounded-xl border border-linha-forte bg-papel px-4 text-base leading-6 text-tinta transition-colors placeholder:text-tinta-suave hover:border-tinta-suave disabled:opacity-60 aria-[invalid=true]:border-2 aria-[invalid=true]:border-perigo";
export const estiloDoSobretitulo = "text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";

export const estiloDaCaixaDeErro = "flex items-start gap-2 rounded-xl border border-perigo/40 bg-perigo-suave px-3 py-2 text-sm font-semibold text-perigo";

/** Chip de estado: sempre com ícone e palavra. */
export const estiloBaseDaEtiqueta =
  "inline-flex min-h-7 items-center gap-1 whitespace-nowrap rounded-md py-0 pl-2 pr-3 text-sm font-semibold leading-5";

export const estiloDoTomDaEtiqueta = {
  sucesso: "bg-sucesso-suave text-sucesso",
  aviso: "bg-aviso-suave text-aviso",
  perigo: "bg-perigo-suave text-perigo",
  neutro: "bg-areia text-tinta-suave",
  categoria: "bg-salvia-suave text-salvia",
} as const;

export type TomDaEtiqueta = keyof typeof estiloDoTomDaEtiqueta;
