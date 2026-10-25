import Link from "next/link";
import { Flag } from "lucide-react";
import { CaixaDeSelecao } from "@/components/ui/checkbox";
import { AvatarComIniciais } from "@/components/plataforma/initials-avatar";
import { EtiquetaDePlano } from "@/components/plataforma/status-chip";
import { estiloDoTituloDaColunaDoCasal } from "@/components/casal/ui";
import { formatarData, formatarInteiro, formatarPercentual, haQuantoTempo } from "@/lib/platform/format";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { SituacaoDoCasal } from "@/lib/platform/casal-status";
import { cn } from "@/lib/utils";
import { EtiquetaDeSituacaoDoCasal } from "./situation-chip";

/** Linha da lista já em texto simples (datas em ISO), para atravessar do servidor ao navegador. */
export interface LinhaDaListaDeCasais {
  id: string;
  coupleNames: string;
  ownerEmail: string | null;
  weddingDate: string | null;
  city: string | null;
  planId: string | null;
  guests: number;
  confirmed: number;
  giftsCents: number;
  lastActiveAt: string | null;
  flagged: boolean;
  situation: SituacaoDoCasal;
}

const quandoAconteceu = (row: LinhaDaListaDeCasais) => (row.lastActiveAt ? haQuantoTempo(new Date(row.lastActiveAt)) : "sem registro");

function CelulaDeConvidados({ row }: { row: LinhaDaListaDeCasais }) {
  if (row.guests === 0) return <span className="text-tinta-suave">Lista vazia</span>;
  const pct = formatarPercentual(row.confirmed, row.guests);
  return (
    <span className="flex flex-col leading-5">
      <span>{formatarInteiro(row.guests)}</span>
      <span className="text-sm text-tinta-suave">{pct} confirmaram</span>
    </span>
  );
}

function CelulaDoCasal({ row }: { row: LinhaDaListaDeCasais }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <AvatarComIniciais name={row.coupleNames} />
      <span className="flex min-w-0 flex-col leading-5">
        <span className="flex items-center gap-1.5 font-semibold text-tinta">
          <span className="truncate">{row.coupleNames}</span>
          {row.flagged && (
            <span title="Marcado para acompanhar" className="shrink-0 text-aviso">
              <Flag className="size-4" aria-hidden="true" />
              <span className="sr-only">Marcado para acompanhar</span>
            </span>
          )}
        </span>
        <span className="truncate text-sm font-normal text-tinta-suave">{row.ownerEmail ?? "sem e-mail"}</span>
      </span>
    </span>
  );
}

export interface PropriedadesDaSelecao {
  rows: LinhaDaListaDeCasais[];
  chosen: string[];
  aoAlternar: (id: string, on: boolean) => void;
}

const LINK_DO_CASAL = "rounded-lg focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa";
const CABECALHOS = ["Casal", "Casamento", "Plano", "Convidados", "Presentes", "Última atividade", "Situação"];

function LinhaDaTabela({ row, marcada, aoAlternar }: { row: LinhaDaListaDeCasais; marcada: boolean; aoAlternar: (id: string, on: boolean) => void }) {
  return (
    <tr className={cn("border-b border-linha last:border-b-0 hover:bg-linho", marcada && "bg-ameixa-suave/60")}>
      <td className="py-3 pl-6 pr-0 align-middle">
        <CaixaDeSelecao checked={marcada} onCheckedChange={(v) => aoAlternar(row.id, v === true)} aria-label={`Selecionar ${row.coupleNames}`} />
      </td>
      <td className="max-w-[300px] px-3 py-3 align-middle">
        <Link href={`/admin/casais/${row.id}`} className={cn("block", LINK_DO_CASAL)}>
          <CelulaDoCasal row={row} />
        </Link>
      </td>
      <td className="px-3 py-3 align-middle">
        <span className="flex flex-col leading-5">
          <span>{row.weddingDate ? formatarData(new Date(row.weddingDate)) : <span className="text-tinta-suave">Sem data</span>}</span>
          {row.city && <span className="text-sm text-tinta-suave">{row.city}</span>}
        </span>
      </td>
      <td className="px-3 py-3 align-middle">
        <EtiquetaDePlano plan={row.planId} />
      </td>
      <td className="px-3 py-3 align-middle">
        <CelulaDeConvidados row={row} />
      </td>
      <td className="px-3 py-3 align-middle tabular-nums">{formatarReais(row.giftsCents)}</td>
      <td className="px-3 py-3 align-middle text-tinta-suave">{quandoAconteceu(row)}</td>
      <td className="py-3 pl-3 pr-6 align-middle">
        <EtiquetaDeSituacaoDoCasal situation={row.situation} />
      </td>
    </tr>
  );
}

export function TabelaDoComputador({ rows, chosen, aoAlternar, aoSelecionarTodos }: PropriedadesDaSelecao & { aoSelecionarTodos: (on: boolean) => void }) {
  const allOn = rows.length > 0 && rows.every((r) => chosen.includes(r.id));
  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)] md:block">
      <table className="w-full border-collapse text-left text-[15px] leading-5">
        <caption className="sr-only">Casais</caption>
        <thead>
          <tr className="border-b border-linha">
            <th scope="col" className={cn(estiloDoTituloDaColunaDoCasal, "w-12 pr-0")}>
              <CaixaDeSelecao checked={allOn} onCheckedChange={(v) => aoSelecionarTodos(v === true)} aria-label="Selecionar todos desta página" />
            </th>
            {CABECALHOS.map((h) => (
              <th key={h} scope="col" className={cn(estiloDoTituloDaColunaDoCasal, "normal-case tracking-normal text-[13px]")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <LinhaDaTabela key={row.id} row={row} marcada={chosen.includes(row.id)} aoAlternar={aoAlternar} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CartaoDoCelular({ row, marcada, aoAlternar }: { row: LinhaDaListaDeCasais; marcada: boolean; aoAlternar: (id: string, on: boolean) => void }) {
  return (
    <li className={cn("rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)]", marcada && "border-ameixa bg-ameixa-suave/60")}>
      <div className="flex items-start gap-3">
        <CaixaDeSelecao className="mt-3" checked={marcada} onCheckedChange={(v) => aoAlternar(row.id, v === true)} aria-label={`Selecionar ${row.coupleNames}`} />
        <Link href={`/admin/casais/${row.id}`} className={cn("min-w-0 flex-1", LINK_DO_CASAL)}>
          <CelulaDoCasal row={row} />
        </Link>
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm leading-5">
        <dt className="text-tinta-suave">Casamento</dt>
        <dd>{row.weddingDate ? formatarData(new Date(row.weddingDate)) : "Sem data"}{row.city ? ` · ${row.city}` : ""}</dd>
        <dt className="text-tinta-suave">Plano</dt>
        <dd>
          <EtiquetaDePlano plan={row.planId} />
        </dd>
        <dt className="text-tinta-suave">Convidados</dt>
        <dd>{row.guests === 0 ? "Lista vazia" : `${formatarInteiro(row.guests)} · ${formatarPercentual(row.confirmed, row.guests)} confirmaram`}</dd>
        <dt className="text-tinta-suave">Presentes</dt>
        <dd className="tabular-nums">{formatarReais(row.giftsCents)}</dd>
        <dt className="text-tinta-suave">Atividade</dt>
        <dd>{quandoAconteceu(row)}</dd>
        <dt className="sr-only">Situação</dt>
        <dd className="col-span-2">
          <EtiquetaDeSituacaoDoCasal situation={row.situation} />
        </dd>
      </dl>
    </li>
  );
}
