"use client";
// Aba "Mapa do salão": o salão visto de cima, o link para os convidados acharem a mesa e a impressão para o buffet.
import { useState } from "react";
import { Printer, Share2 } from "lucide-react";
import { MapaDoSalao } from "@/components/mesas/mapa-do-salao";
import { DialogoDeCompartilhamento } from "@/components/mesas/dialogo-de-compartilhamento";
import { estiloDoBotao, estiloDoCartao } from "@/components/painel/styles";
import type { MesaDoMapa } from "@/lib/mesas/mapa";
import { lugaresDe, type MesaComConvidados } from "./tipos";

const paraOMapa = (t: MesaComConvidados): MesaDoMapa => ({ id: t.id, name: t.name, capacity: t.capacity, occupied: t.guests.reduce((s, g) => s + lugaresDe(g), 0) });

function Legenda() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-tinta-suave" aria-label="Legenda">
      <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-ameixa" aria-hidden="true" />Lugar ocupado</li>
      <li className="flex items-center gap-2"><span className="size-3 rounded-full border border-linha-forte bg-papel" aria-hidden="true" />Lugar livre</li>
      <li className="flex items-center gap-2"><span className="size-3 rounded-full border-2 border-sucesso" aria-hidden="true" />Mesa completa</li>
      <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-perigo" aria-hidden="true" />Passou do limite</li>
    </ul>
  );
}

/** Lista por mesa, só para a impressão: o buffet e o cerimonial precisam dos nomes e das restrições. */
function ListaParaImprimir({ mesas }: { mesas: MesaComConvidados[] }) {
  return (
    <div className="hidden print:mt-6 print:grid print:grid-cols-2 print:gap-4">
      {mesas.map((t, i) => (
        <section key={t.id} className="break-inside-avoid text-[12px] leading-5">
          <h3 className="font-semibold">{i + 1}. {t.name} <span className="font-normal">({t.guests.reduce((s, g) => s + lugaresDe(g), 0)} de {t.capacity})</span></h3>
          <ul>
            {t.guests.map((g) => (
              <li key={g.id}>{g.name}{g.allowedCompanions ? ` +${g.allowedCompanions}` : ""}{g.dietaryRestrictions ? ` · ${g.dietaryRestrictions}` : ""}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function MapaDoSalaoAdmin({ mesas, tokenInicial }: { mesas: MesaComConvidados[]; tokenInicial: string | null }) {
  const [token, setToken] = useState(tokenInicial);
  const [compartilhando, setCompartilhando] = useState(false);
  return (
    <section aria-label="Mapa do salão" className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Legenda />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className={estiloDoBotao.secondary} disabled={mesas.length === 0}>
            <Printer className="size-4" aria-hidden="true" /> Imprimir
          </button>
          <button type="button" onClick={() => setCompartilhando(true)} className={estiloDoBotao.primary}>
            <Share2 className="size-4" aria-hidden="true" /> {token ? "Link compartilhado" : "Compartilhar"}
          </button>
        </div>
      </div>
      <div id="area-de-impressao" className={`${estiloDoCartao} p-4 print:border-0 print:p-0 print:shadow-none`}>
        <h2 className="mb-2 hidden font-display text-2xl print:block">Mapa do salão</h2>
        {mesas.length === 0 ? <p className="py-10 text-center text-tinta-suave">Criem as mesas para ver o salão de cima.</p> : <MapaDoSalao mesas={mesas.map(paraOMapa)} className="mx-auto max-w-3xl" />}
        <ListaParaImprimir mesas={mesas} />
      </div>
      <DialogoDeCompartilhamento open={compartilhando} onClose={() => setCompartilhando(false)} token={token} onChange={setToken} />
    </section>
  );
}
