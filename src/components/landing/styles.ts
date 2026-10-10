/**
 * Classes compartilhadas pelas páginas públicas do Aceito (landing, login).
 * Botões seguem o design system: altura mínima de 44px, raio de 12px, um primário por bloco.
 */
const base =
  "group/btn relative inline-flex min-h-11 cursor-pointer select-none items-center justify-center gap-2 rounded-[12px] px-6 text-base font-semibold leading-6 no-underline transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[var(--ease-aceito)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60";

export const btn = {
  primary: `${base} bg-ameixa text-on-ameixa hover:bg-ameixa-hover hover:shadow-[0_10px_24px_-12px_rgba(94,43,78,0.55)]`,
  secondary: `${base} border border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave`,
  quiet: `${base} px-3 text-ameixa hover:bg-ameixa-suave`,
  /** Botão claro sobre a faixa ameixa. */
  onAmeixa: `${base} bg-on-ameixa text-ameixa hover:bg-ameixa-suave focus-visible:outline-on-ameixa`,
  /** Compacto no computador; no celular mantém os 44px de área de toque. */
  sm: "min-h-11 px-4 text-sm leading-5 sm:min-h-9",
  block: "w-full",
};

/** Seta que avança levemente ao passar o mouse no botão. */
export const btnArrow = "size-4 transition-transform duration-300 ease-[var(--ease-aceito)] group-hover/btn:translate-x-0.5";

export const overline = "text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-tinta-suave";

export const h2 =
  "font-display text-[34px] font-normal leading-[40px] tracking-[-0.015em] text-tinta sm:text-[40px] sm:leading-[46px] lg:text-[52px] lg:leading-[58px]";

export const lead = "text-[17px] leading-[26px] text-tinta-suave sm:text-lg sm:leading-7";

export const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6";
