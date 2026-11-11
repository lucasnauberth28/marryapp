// O selo "A" (o círculo ameixa do logotipo) que marca um Pix de presente confirmado.

/** Selo "A" do Pix confirmado (o mesmo círculo ameixa do logotipo), 22px. */
export function SeloDoPix({ stamp = false }: { stamp?: boolean }) {
  return (
    <span role="img" aria-label="Confirmado" className={`inline-grid size-[22px] shrink-0 place-items-center ${stamp ? "motion-safe:animate-[carimbo_340ms_cubic-bezier(0.16,1,0.3,1)_both]" : ""}`}>
      <svg viewBox="4 26 56 56" className="size-[22px]" aria-hidden="true">
        <circle cx="32" cy="54" r="27" fill="var(--color-ameixa)" />
        <circle cx="32" cy="54" r="23.5" fill="none" stroke="var(--color-papel)" strokeOpacity=".55" strokeWidth="1.2" />
        <path
          fill="var(--color-papel)"
          transform="translate(32 54) scale(.62) translate(-32 -54)"
          d="M16.87 74 39.81 34.25H42.39L47.32 74H40L36.69 41.56L18.04 74ZM13.01 74V72.99H24.45V74ZM34.02 74V72.99H50.99V74ZM24.91 61.78V60.77H42.11V61.78Z"
        />
      </svg>
    </span>
  );
}
