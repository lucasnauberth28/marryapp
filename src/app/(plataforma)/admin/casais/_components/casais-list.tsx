"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Flag, Megaphone } from "lucide-react";
import { definirMarcaDosCasamentos } from "@/actions/casais-admin/acompanhar";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { BotaoDeExportar } from "@/components/plataforma/export-button";
import { cn } from "@/lib/utils";
import { CartaoDoCelular, TabelaDoComputador, type LinhaDaListaDeCasais } from "./casais-linhas";
import { useAcaoDoCasal } from "./use-casal-action";

export type { LinhaDaListaDeCasais };

function BarraDeSelecao({ chosen, anyUnflagged, pending, error, aoMarcar, aoLimpar }: { chosen: string[]; anyUnflagged: boolean; pending: boolean; error: string | null; aoMarcar: () => void; aoLimpar: () => void }) {
  return (
    <div role="region" aria-label="Ações para os casais selecionados" className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-ameixa/30 bg-ameixa-suave px-4 py-3">
      <p className="font-semibold text-ameixa" aria-live="polite">
        {chosen.length === 1 ? "1 casal selecionado" : `${chosen.length} casais selecionados`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/admin/comunicados?casais=${chosen.join(",")}`} className={cn(estiloDoBotao.secondary, estiloDoBotao.sm, "gap-1.5")}>
          <Megaphone className="size-4" aria-hidden="true" /> Enviar comunicado
        </Link>
        <BotaoDeExportar href={`/api/admin/casais.csv?ids=${chosen.join(",")}`} fallbackName="casais.csv" size="sm" className="gap-1.5">
          <Download className="size-4" aria-hidden="true" /> Exportar seleção
        </BotaoDeExportar>
        <Botao type="button" variant="outline" size="sm" onClick={aoMarcar} loading={pending} className="gap-1.5">
          <Flag className="size-4" aria-hidden="true" /> {anyUnflagged ? "Marcar para acompanhar" : "Deixar de acompanhar"}
        </Botao>
        <button type="button" onClick={aoLimpar} className={cn(estiloDoBotao.quiet, estiloDoBotao.sm)}>
          Limpar seleção
        </button>
      </div>
      {error && (
        <p role="alert" className="w-full text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Lista de casais com seleção em massa: Enviar comunicado, Exportar seleção, Marcar para acompanhar, Limpar seleção.
 * No computador é tabela; no celular, uma lista de cartões (sem rolagem lateral).
 */
export function ListaDeCasais({ rows }: { rows: LinhaDaListaDeCasais[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const { pending, error, run } = useAcaoDoCasal();
  const toggle = (id: string, on: boolean) => setSelected((cur) => (on ? [...new Set([...cur, id])] : cur.filter((x) => x !== id)));
  const chosen = selected.filter((id) => rows.some((r) => r.id === id));
  const anyUnflagged = rows.some((r) => chosen.includes(r.id) && !r.flagged);
  const flag = () => run(() => definirMarcaDosCasamentos({ weddingIds: chosen, flagged: anyUnflagged }), () => setSelected([]));

  return (
    <div className="flex flex-col gap-4">
      {chosen.length > 0 && <BarraDeSelecao chosen={chosen} anyUnflagged={anyUnflagged} pending={pending} error={error} aoMarcar={flag} aoLimpar={() => setSelected([])} />}
      <TabelaDoComputador rows={rows} chosen={chosen} aoAlternar={toggle} aoSelecionarTodos={(on) => setSelected(on ? rows.map((r) => r.id) : [])} />
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <CartaoDoCelular key={row.id} row={row} marcada={chosen.includes(row.id)} aoAlternar={toggle} />
        ))}
      </ul>
    </div>
  );
}
