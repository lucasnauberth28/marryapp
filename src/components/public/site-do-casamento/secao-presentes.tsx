// Lista de presentes em dinheiro: carrossel no celular e grade no computador.
import Link from "next/link";
import { Gift } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { DadosDoSite, PropriedadesDeLink } from "./dados-do-site";
import { FaixaDaSecao, TituloDaSecao } from "./pecas";
import type { PresenteDoSite } from "./tipos";

function CartaoDoPresente({ presente, posicao, linkProps }: { presente: PresenteDoSite; posicao: number; linkProps: PropriedadesDeLink }) {
  return (
    <li className={`w-40 shrink-0 snap-start md:w-auto ${posicao >= 4 ? "md:hidden" : ""}`}>
      <Link href={`/checkout/${presente.id}`} className="group/gift flex flex-col gap-1.5 text-tinta no-underline md:gap-2" {...linkProps}>
        <span className="zoom-media relative block aspect-square overflow-hidden rounded-2xl bg-areia">
          {presente.imageUrl ? (
            <ImagemDaPessoa src={presente.imageUrl} alt="" sizes="(min-width: 768px) 260px, 160px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-ameixa/60"><Gift className="size-8" aria-hidden="true" /></span>
          )}
        </span>
        <strong className="line-clamp-2 text-[15px] font-semibold leading-5 md:text-base md:leading-6">{presente.title}</strong>
        <span className="text-sm text-tinta-suave tabular-nums md:text-base">{formatarReais(presente.amount)}</span>
        <span className="text-sm font-semibold text-ameixa group-hover/gift:underline">Presentear</span>
      </Link>
    </li>
  );
}

export function SecaoDePresentes({ site, presentes, linkProps }: { site: DadosDoSite; presentes: PresenteDoSite[]; linkProps: PropriedadesDeLink }) {
  return (
    <FaixaDaSecao id="presentes" tone={site.toneOf("presentes")}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TituloDaSecao eyebrow="Presentes em dinheiro" title="Um carinho para a vida nova">
          Sua presença é o nosso maior presente. Se quiser contribuir, escolha um item: cada um representa um valor em dinheiro para o casal.
        </TituloDaSecao>
        <Link href={site.giftsHref} className={`${estiloDoBotao.secondary} max-md:hidden`} {...linkProps}>Ver todos os presentes</Link>
      </div>
      {/* Celular: carrossel de cards de 160px; computador: grade de até 4 por linha */}
      <ul className="-mr-4 m-0 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto p-0 pb-1 pr-4 md:mr-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:gap-6 md:overflow-visible md:pr-0">
        {presentes.slice(0, 6).map((p, i) => <CartaoDoPresente key={p.id} presente={p} posicao={i} linkProps={linkProps} />)}
      </ul>
      <Link href={site.giftsHref} className={`${estiloDoBotao.secondary} ${estiloDoBotao.block} md:hidden`} {...linkProps}>Ver todos os presentes</Link>
    </FaixaDaSecao>
  );
}
