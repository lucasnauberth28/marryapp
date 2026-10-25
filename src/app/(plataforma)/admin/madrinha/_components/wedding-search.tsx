"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import { RegiaoDeCarregamento } from "@/components/skeletons";
import { Entrada } from "@/components/ui/input";
import { Esqueleto } from "@/components/ui/skeleton";
import { buscarCasamentosDaMadrinha } from "@/actions/admin-madrinha-actions";
import type { ResultadoDeCasamento } from "@/lib/platform/queries/madrinha";
import { cn } from "@/lib/utils";

/**
 * Busca de casal por nome ou endereço do site (consulta curta no servidor, até 8 resultados; espera 300 ms
 * depois de digitar). Quem escolhe recebe o casal inteiro; o id nunca decide permissão, só localiza.
 */
export function BuscaDeCasamento({ selectedId, onPick, label = "Buscar casal" }: { selectedId: string | null; onPick: (hit: ResultadoDeCasamento) => void; label?: string }) {
  const [text, setText] = useState("");
  const [hits, setHits] = useState<ResultadoDeCasamento[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticket = useRef(0);

  function onType(value: string) {
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      ticket.current++; // descarta busca em andamento
      setHits(null);
      setError(null);
      setSearching(false);
      return;
    }
    timer.current = setTimeout(async () => {
      const mine = ++ticket.current;
      setSearching(true);
      try {
        const result = await buscarCasamentosDaMadrinha({ q: value });
        if (mine !== ticket.current) return; // chegou uma busca mais nova
        if (result.success) {
          setHits(result.hits);
          setError(null);
        } else setError(result.error);
      } catch {
        if (mine === ticket.current) setError("Não foi possível buscar agora.");
      } finally {
        if (mine === ticket.current) setSearching(false);
      }
    }, 300);
  }

  return (
    <div className="flex flex-col gap-2">
      <Entrada label={label} icon={Search} value={text} onChange={(e) => onType(e.target.value)} autoComplete="off" hint="Digite pelo menos 2 letras do nome ou do endereço do site." />
      {error && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
      {searching && hits === null && (
        <RegiaoDeCarregamento label="os casais" className="flex flex-col gap-1">
          <Esqueleto className="h-14 rounded-xl" />
          <Esqueleto className="h-14 rounded-xl" />
        </RegiaoDeCarregamento>
      )}
      {hits && hits.length === 0 && !searching && <p className="text-sm text-tinta-suave">Nenhum casal encontrado.</p>}
      {hits && hits.length > 0 && (
        <ul className={cn("flex flex-col gap-1 transition-opacity", searching && "opacity-60")} aria-busy={searching || undefined} aria-label="Casais encontrados">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onClick={() => onPick(hit)}
                aria-pressed={selectedId === hit.id}
                className={cn(
                  "flex min-h-11 w-full flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa",
                  selectedId === hit.id ? "border-ameixa bg-ameixa-suave" : "border-linha bg-papel hover:border-linha-forte",
                )}
              >
                <span className="text-[15px] font-semibold leading-5 text-tinta">{hit.coupleNames}</span>
                <span className="text-sm leading-5 text-tinta-suave">{hit.slug}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
