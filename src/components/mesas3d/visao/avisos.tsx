import Link from "next/link";

export function AvisoSemMesas() {
  return (
    <p className="rounded-xl border border-linha bg-areia px-4 py-3 text-sm leading-5 text-tinta-suave">
      O cenário ainda não tem mesas para sentar convidados. <Link href="/mesas" className="font-semibold text-ameixa underline underline-offset-2">Criem as mesas na lista</Link> e elas aparecem aqui.
    </p>
  );
}

/** O nome do convidado que acompanha o ponteiro durante o arrasto. */
export function FantasmaDoArrasto({ ghostRef }: { ghostRef: React.RefObject<HTMLDivElement | null> }) {
  return <div ref={ghostRef} hidden className="pointer-events-none fixed z-50 translate-x-2.5 translate-y-2.5 rounded-full bg-ameixa px-3 py-1.5 text-sm font-medium text-on-ameixa shadow-[var(--shadow-aceito-2)]" />;
}
