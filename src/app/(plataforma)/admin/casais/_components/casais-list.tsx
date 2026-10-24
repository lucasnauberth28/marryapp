"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Flag, Megaphone } from "lucide-react";
import { setWeddingsFlag } from "@/actions/admin-casais-actions";
import { btn } from "@/components/landing/styles";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExportButton } from "@/components/plataforma/export-button";
import { InitialsAvatar } from "@/components/plataforma/initials-avatar";
import { PlanChip } from "@/components/plataforma/status-chip";
import { th } from "@/components/casal/ui";
import { formatBRL, formatDate, formatInt, formatPercent, timeAgo } from "@/lib/platform/format";
import type { CasalSituation } from "@/lib/platform/casal-status";
import { cn } from "@/lib/utils";
import { SituationChip } from "./situation-chip";
import { useCasalAction } from "./use-casal-action";

/** Linha da lista já em texto simples (datas em ISO), para atravessar do servidor ao navegador. */
export interface CasalListRow {
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
  situation: CasalSituation;
}

const when = (row: CasalListRow) => (row.lastActiveAt ? timeAgo(new Date(row.lastActiveAt)) : "sem registro");

function GuestsCell({ row }: { row: CasalListRow }) {
  if (row.guests === 0) return <span className="text-tinta-suave">Lista vazia</span>;
  const pct = formatPercent(row.confirmed, row.guests);
  return (
    <span className="flex flex-col leading-5">
      <span>{formatInt(row.guests)}</span>
      <span className="text-sm text-tinta-suave">{pct} confirmaram</span>
    </span>
  );
}

function CoupleCell({ row }: { row: CasalListRow }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <InitialsAvatar name={row.coupleNames} />
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

/**
 * Lista de casais com seleção em massa: Enviar comunicado, Exportar seleção, Marcar para acompanhar, Limpar seleção.
 * No computador é tabela; no celular, uma lista de cartões (sem rolagem lateral).
 */
export function CasaisList({ rows }: { rows: CasalListRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const { pending, error, run } = useCasalAction();

  const toggle = (id: string, on: boolean) => setSelected((cur) => (on ? [...new Set([...cur, id])] : cur.filter((x) => x !== id)));
  const allOn = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const chosen = selected.filter((id) => rows.some((r) => r.id === id));
  const anyUnflagged = rows.some((r) => chosen.includes(r.id) && !r.flagged);

  const flag = () => run(() => setWeddingsFlag({ weddingIds: chosen, flagged: anyUnflagged }), () => setSelected([]));

  return (
    <div className="flex flex-col gap-4">
      {chosen.length > 0 && (
        <div role="region" aria-label="Ações para os casais selecionados" className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-ameixa/30 bg-ameixa-suave px-4 py-3">
          <p className="font-semibold text-ameixa" aria-live="polite">
            {chosen.length === 1 ? "1 casal selecionado" : `${chosen.length} casais selecionados`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/comunicados?casais=${chosen.join(",")}`} className={cn(btn.secondary, btn.sm, "gap-1.5")}>
              <Megaphone className="size-4" aria-hidden="true" /> Enviar comunicado
            </Link>
            <ExportButton href={`/api/admin/casais.csv?ids=${chosen.join(",")}`} fallbackName="casais.csv" size="sm" className="gap-1.5">
              <Download className="size-4" aria-hidden="true" /> Exportar seleção
            </ExportButton>
            <Button type="button" variant="outline" size="sm" onClick={flag} loading={pending} className="gap-1.5">
              <Flag className="size-4" aria-hidden="true" /> {anyUnflagged ? "Marcar para acompanhar" : "Deixar de acompanhar"}
            </Button>
            <button type="button" onClick={() => setSelected([])} className={cn(btn.quiet, btn.sm)}>
              Limpar seleção
            </button>
          </div>
          {error && (
            <p role="alert" className="w-full text-sm font-semibold text-perigo">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Computador */}
      <div className="hidden overflow-x-auto rounded-2xl border border-linha bg-papel shadow-[var(--shadow-aceito-1)] md:block">
        <table className="w-full border-collapse text-left text-[15px] leading-5">
          <caption className="sr-only">Casais</caption>
          <thead>
            <tr className="border-b border-linha">
              <th scope="col" className={cn(th, "w-12 pr-0")}>
                <Checkbox checked={allOn} onCheckedChange={(v) => setSelected(v === true ? rows.map((r) => r.id) : [])} aria-label="Selecionar todos desta página" />
              </th>
              {["Casal", "Casamento", "Plano", "Convidados", "Presentes", "Última atividade", "Situação"].map((h) => (
                <th key={h} scope="col" className={cn(th, "normal-case tracking-normal text-[13px]")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={cn("border-b border-linha last:border-b-0 hover:bg-linho", chosen.includes(row.id) && "bg-ameixa-suave/60")}>
                <td className="py-3 pl-6 pr-0 align-middle">
                  <Checkbox checked={chosen.includes(row.id)} onCheckedChange={(v) => toggle(row.id, v === true)} aria-label={`Selecionar ${row.coupleNames}`} />
                </td>
                <td className="max-w-[300px] px-3 py-3 align-middle">
                  <Link href={`/admin/casais/${row.id}`} className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa">
                    <CoupleCell row={row} />
                  </Link>
                </td>
                <td className="px-3 py-3 align-middle">
                  <span className="flex flex-col leading-5">
                    <span>{row.weddingDate ? formatDate(new Date(row.weddingDate)) : <span className="text-tinta-suave">Sem data</span>}</span>
                    {row.city && <span className="text-sm text-tinta-suave">{row.city}</span>}
                  </span>
                </td>
                <td className="px-3 py-3 align-middle">
                  <PlanChip plan={row.planId} />
                </td>
                <td className="px-3 py-3 align-middle">
                  <GuestsCell row={row} />
                </td>
                <td className="px-3 py-3 align-middle tabular-nums">{formatBRL(row.giftsCents)}</td>
                <td className="px-3 py-3 align-middle text-tinta-suave">{when(row)}</td>
                <td className="py-3 pl-3 pr-6 align-middle">
                  <SituationChip situation={row.situation} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className={cn("rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)]", chosen.includes(row.id) && "border-ameixa bg-ameixa-suave/60")}>
            <div className="flex items-start gap-3">
              <Checkbox className="mt-3" checked={chosen.includes(row.id)} onCheckedChange={(v) => toggle(row.id, v === true)} aria-label={`Selecionar ${row.coupleNames}`} />
              <Link href={`/admin/casais/${row.id}`} className="min-w-0 flex-1 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa">
                <CoupleCell row={row} />
              </Link>
            </div>
            <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm leading-5">
              <dt className="text-tinta-suave">Casamento</dt>
              <dd>{row.weddingDate ? formatDate(new Date(row.weddingDate)) : "Sem data"}{row.city ? ` · ${row.city}` : ""}</dd>
              <dt className="text-tinta-suave">Plano</dt>
              <dd>
                <PlanChip plan={row.planId} />
              </dd>
              <dt className="text-tinta-suave">Convidados</dt>
              <dd>{row.guests === 0 ? "Lista vazia" : `${formatInt(row.guests)} · ${formatPercent(row.confirmed, row.guests)} confirmaram`}</dd>
              <dt className="text-tinta-suave">Presentes</dt>
              <dd className="tabular-nums">{formatBRL(row.giftsCents)}</dd>
              <dt className="text-tinta-suave">Atividade</dt>
              <dd>{when(row)}</dd>
              <dt className="sr-only">Situação</dt>
              <dd className="col-span-2">
                <SituationChip situation={row.situation} />
              </dd>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
