// Capa de tela cheia: a foto ocupa a largura toda e os nomes ficam sobre ela. Usada por Editorial, Monocromático,
// Noturno, Campo e Papel rasgado.
import { ContagemRegressivaDoCasamento } from "@/components/public/wedding-site-countdown";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import type { CSSProperties } from "react";
import type { DadosDoSite, PropriedadesDeLink } from "../dados-do-site";
import { NomesDoCasal, TextoDeIniciais } from "../pecas";
import { AcoesDaCapa } from "./acoes-da-capa";

/** A contagem sobre a foto: vidro fosco com o texto claro, qualquer que seja a paleta do modelo. */
const ESTILO_DA_CONTAGEM = {
  "--color-papel": "rgb(255 255 255 / 0.14)",
  "--color-linha": "rgb(255 255 255 / 0.4)",
  "--color-ameixa": "#fff",
  "--color-tinta-suave": "rgb(255 255 255 / 0.85)",
} as CSSProperties;

function FundoDaCapa({ site }: { site: DadosDoSite }) {
  return (
    <>
      <div className="absolute inset-0 bg-ameixa" aria-hidden="true" />
      {site.coverUrl ? (
        <div className="absolute inset-0 overflow-hidden">
          <ImagemDaPessoa src={site.coverUrl} alt={`Foto de ${site.coupleNames}`} sizes="100vw" priority className="hero-settle object-cover" />
        </div>
      ) : (
        <span className="absolute inset-0 grid place-items-center font-display text-8xl text-[#fff]/70" aria-hidden="true"><TextoDeIniciais initials={site.initials} /></span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/20" aria-hidden="true" />
    </>
  );
}

export function CapaTelaCheia({ site, linkProps }: { site: DadosDoSite; linkProps: PropriedadesDeLink }) {
  const centro = site.modelo.alinhamento === "centro";
  const nomesManuscritos = site.modelo.fonteDosNomes === "great-vibes";
  return (
    <section id="inicio" className={`relative isolate flex min-h-[86vh] overflow-hidden text-[#fff] ${site.modelo.divisor === "rasgado" ? "borda-rasgada" : ""}`}>
      <FundoDaCapa site={site} />
      <div className={`relative mx-auto flex w-full max-w-[1120px] flex-col justify-end gap-5 px-4 pb-14 pt-24 md:px-6 md:pb-20 ${centro ? "items-center text-center" : "items-start text-left"}`}>
        {site.s.subtitle?.trim() && <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] opacity-90">{site.s.subtitle.trim()}</p>}
        <h1 className={`m-0 max-w-full text-balance font-medium leading-[0.98] tracking-[-0.02em] [text-shadow:0_2px_24px_rgb(0_0_0/0.35)] ${nomesManuscritos ? "font-[family-name:var(--font-modelo-great-vibes)] text-[64px] font-normal md:text-[clamp(80px,11vw,150px)]" : "font-display text-[56px] md:text-[clamp(64px,9vw,128px)]"}`}>
          <NomesDoCasal names={site.coupleNames} ampClassName="text-[#fff]/90" />
        </h1>
        <p className="m-0 max-w-[52ch] text-[17px] leading-7 opacity-95 md:text-xl">{site.whenWhere}</p>
        {site.countdownTarget !== null && (
          <div style={ESTILO_DA_CONTAGEM}><ContagemRegressivaDoCasamento target={site.countdownTarget} /></div>
        )}
        <div className={`flex flex-col gap-3 ${centro ? "items-center" : "items-start"}`}><AcoesDaCapa site={site} linkProps={linkProps} centralizar={centro} /></div>
      </div>
    </section>
  );
}
