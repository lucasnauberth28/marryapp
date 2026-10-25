// Convite para confirmar presença, com o botão que leva ao formulário de RSVP.
import Link from "next/link";
import { estiloDoBotao } from "@/components/landing/styles";
import { Aparicao } from "@/components/motion/reveal";
import type { DadosDoSite, PropriedadesDeLink } from "./dados-do-site";

export function SecaoDeConfirmacao({ site, linkProps }: { site: DadosDoSite; linkProps: PropriedadesDeLink }) {
  const tom = site.toneOf("rsvp");
  const texto = site.deadlineLabel
    ? `Confirme sua presença até ${site.deadlineLabel}. Digite o seu WhatsApp para achar o seu convite; leva menos de um minuto.`
    : "Digite o seu WhatsApp para achar o seu convite. Leva menos de um minuto.";
  return (
    <section id="confirmar" data-tone={tom} className={`group/band ${tom === "papel" ? "border-y border-linha bg-papel" : ""}`}>
      <Aparicao variant="scale" className="mx-auto flex max-w-[1120px] justify-center px-4 py-12 md:px-6 md:py-24">
        <div className="relative w-full max-w-[560px] rounded-2xl border border-linha bg-papel px-6 py-10 text-center shadow-[var(--shadow-aceito-2)] md:px-8 md:py-12">
          <span className="pointer-events-none absolute inset-2 rounded-[10px] border border-rosa" aria-hidden="true" />
          <div className="relative flex flex-col items-center gap-2">
            <h2 className="m-0 mt-2 font-display text-[34px] font-medium leading-10 tracking-[-0.015em] text-balance md:text-[40px] md:leading-[46px]">Contamos com você?</h2>
            <p className="m-0 mb-4 max-w-[40ch] text-tinta-suave">{texto}</p>
            <Link href={site.rsvpHref} className={`${estiloDoBotao.primary} ${estiloDoBotao.block}`} {...linkProps}>Confirmar presença</Link>
          </div>
        </div>
      </Aparicao>
    </section>
  );
}
