// Arco bege: a barra de resumo, a história com duas fotos, os quatro cartões do dia e a faixa de números.
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { DiasRestantes, Foto } from "../comum";
import type { PropriedadesDoLayout } from "../tipos";

type Fotos = { foto: (i: number) => string | null };
const titulo = "m-0 font-display text-[clamp(30px,4vw,48px)] font-medium leading-[1.1] tracking-[-0.015em] text-tinta";

export function BarraDeResumo({ site }: Pick<PropriedadesDoLayout, "site">) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 md:px-8">
      <div className="grid items-center gap-6 rounded-3xl bg-papel p-6 shadow-[var(--shadow-aceito-1)] md:grid-cols-[1fr_1.4fr_auto] md:gap-10 md:p-8">
        <p className="m-0 font-display text-2xl leading-8 text-tinta md:text-3xl">{site.dateLabel ?? "Em breve"}<br />{site.locationName || "O local vem aí"}</p>
        <p className="m-0 text-sm leading-6 text-tinta-suave">{site.s.dressCodeDesc?.trim() || site.s.dressCodeTitle?.trim() || site.whenWhere}</p>
        <p className="m-0 flex items-baseline gap-2 font-display text-tinta"><DiasRestantes alvo={site.countdownTarget} className="text-5xl md:text-6xl" /><span className="text-xl">dias</span></p>
      </div>
    </div>
  );
}

export function SobreNos({ site, fotos, linkProps }: Pick<PropriedadesDoLayout, "site" | "linkProps"> & { fotos: Fotos }) {
  return (
    <section id="historia" className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-20 md:grid-cols-2 md:gap-16 md:px-8 md:py-28">
      <div className="flex items-end gap-4">
        <div className="relative aspect-[3/4] w-[46%] overflow-hidden rounded-2xl"><Foto src={fotos.foto(1)} sizes="260px" /></div>
        <div className="relative aspect-[4/3] flex-1 overflow-hidden rounded-2xl"><Foto src={fotos.foto(2)} sizes="320px" /></div>
      </div>
      <div className="flex flex-col items-start gap-5">
        <h2 className={titulo}>Uma jornada de amor</h2>
        <p className="m-0 max-w-[52ch] whitespace-pre-line leading-7 text-tinta-suave">{site.s.welcomeMessage?.trim() || `${site.coupleNames} vão se casar e querem ter você por perto.`}</p>
        <a href="#cerimonia" className={`${estiloDoBotao.primary} ${estiloDoBotao.sm}`} {...linkProps}>Ver o dia <ArrowRight className="size-4" aria-hidden="true" /></a>
      </div>
    </section>
  );
}

export function QuatroMomentos({ site }: Pick<PropriedadesDoLayout, "site">) {
  const itens = site.program.slice(0, 4);
  if (itens.length === 0) return null;
  return (
    <section id="cerimonia" className="mx-auto max-w-[1200px] px-4 pb-20 md:px-8 md:pb-28">
      <div className="mb-8 grid gap-4 md:grid-cols-2 md:items-end"><h2 className={titulo}>O nosso dia, passo a passo</h2><p className="m-0 max-w-[48ch] text-sm leading-6 text-tinta-suave md:justify-self-end">{site.address || "Os detalhes de cada momento estão aqui."}</p></div>
      <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {itens.map((m, i) => (
          <li key={`${m.title}-${i}`} className="flex min-h-[220px] flex-col justify-between gap-6 rounded-3xl border border-linha bg-areia p-5">
            <span className="font-display text-3xl text-tinta">{String(i + 1).padStart(2, "0")}.</span>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0"><h3 className="m-0 font-display text-xl leading-6 text-tinta">{m.title}</h3><p className="m-0 mt-1 text-sm leading-5 text-tinta-suave">{[m.day, m.time, m.place].filter(Boolean).join(" · ")}</p></div>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#CDB68A] text-[#2E211C]" aria-hidden="true"><ArrowUpRight className="size-4" /></span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A faixa verde-oliva com os números do dia: só o que o casal informou. */
export function FaixaDeNumeros({ site, momentos }: Pick<PropriedadesDoLayout, "site"> & { momentos: number }) {
  type Numero = { v: ReactNode; r: string };
  const numeros = ([
    { v: <DiasRestantes alvo={site.countdownTarget} />, r: "dias para o sim" },
    site.ceremonyTime ? { v: site.ceremonyTime, r: "cerimônia" } : null,
    site.receptionTime ? { v: site.receptionTime, r: "recepção" } : null,
    momentos > 0 ? { v: momentos, r: momentos === 1 ? "momento da nossa história" : "momentos da nossa história" } : null,
  ] as (Numero | null)[]).filter((n): n is Numero => n !== null);
  return (
    <div className="bg-ameixa text-on-ameixa">
      <dl className="mx-auto m-0 grid max-w-[1200px] grid-cols-2 gap-y-8 px-4 py-12 md:grid-cols-4 md:px-8">
        {numeros.map((n) => <div key={n.r} className="flex flex-col"><dd className="m-0 font-display text-5xl leading-none md:text-6xl">{n.v}</dd><dt className="mt-2 text-sm opacity-80">{n.r}</dt></div>)}
      </dl>
    </div>
  );
}
