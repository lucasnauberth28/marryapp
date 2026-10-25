import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { FUSO_DE_BRASILIA, rotuloDoDia } from "@/lib/dashboard-summary";
import { rotuloDosDiasRestantes } from "@/lib/wedding-format";
import { estiloDoBotaoSecundario } from "../ui";
import type { ContasDoResumo } from "./contas";
import { colocarEmMaiuscula, type ContextoDaPagina, type IdentidadeDoCasamento } from "./tipos";

const dias = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

/** "Casamento no sábado, 17 de abril de 2027, em Curitiba: faltam 120 dias." */
function FraseDoCasamento({ identity, city, weddingDays }: { identity: IdentidadeDoCasamento; city: string | null; weddingDays: number | null }) {
  const data = identity.weddingDate;
  if (!data) return <>Vocês ainda não definiram a data do casamento. Com ela, o painel mostra quantos dias faltam.</>;
  const extenso = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(data).replace(/^(\p{L}+), /u, "no $1, ");
  const restam = weddingDays !== null && weddingDays >= 0 ? rotuloDosDiasRestantes(weddingDays) : null;
  return (
    <>
      Casamento {extenso}
      {city ? `, em ${city}` : ""}
      {restam ? (
        <>
          : <b className="font-semibold tabular-nums text-tinta">{restam}</b>.
        </>
      ) : (
        "."
      )}
    </>
  );
}

function FraseDoPrazo({ deadline, deadlineLabel }: { deadline: ContasDoResumo["deadline"]; deadlineLabel: string }) {
  if (deadline.state === "passed") return <>O prazo de confirmação terminou em {deadlineLabel}.</>;
  if (deadline.state === "today") return <b className="font-semibold text-tinta">O prazo de confirmação termina hoje.</b>;
  if (deadline.state === "soon") {
    return (
      <>
        Prazo de confirmação em {deadlineLabel}, <b className="font-semibold text-tinta">daqui a {dias(deadline.days)}</b>.
      </>
    );
  }
  return <>Prazo de confirmação em {deadlineLabel} ({deadline.days} dias).</>;
}

interface PropriedadesDoCabecalho {
  now: Date;
  identity: IdentidadeDoCasamento;
  wedding: ContextoDaPagina["wedding"];
  contas: ContasDoResumo;
  siteUrl: string;
}

export function CabecalhoDoResumo({ now, identity, wedding, contas, siteUrl }: PropriedadesDoCabecalho) {
  const { weddingDays, deadline, deadlineKey, todayKey } = contas;
  const hoje = colocarEmMaiuscula(new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: FUSO_DE_BRASILIA }).format(now));
  const deadlineLabel = deadlineKey ? rotuloDoDia(deadlineKey, todayKey) : null;
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-tinta md:text-[28px]">Resumo</h1>
        <p className="mt-1.5 max-w-[72ch] text-pretty text-sm text-tinta-suave">
          {hoje}. <FraseDoCasamento identity={identity} city={wedding.city} weddingDays={weddingDays} />
          {deadlineLabel && (
            <>
              {" "}
              <FraseDoPrazo deadline={deadline} deadlineLabel={deadlineLabel} />
            </>
          )}
        </p>
      </div>
      {identity.slug && (
        <Link href={siteUrl} target="_blank" rel="noopener" className={`${estiloDoBotaoSecundario} max-md:hidden`}>
          Ver o site
          <ExternalLink className="size-[17px]" aria-hidden="true" />
          <span className="sr-only">(abre em outra aba)</span>
        </Link>
      )}
    </div>
  );
}
