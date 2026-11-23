"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { MapaDoSalao } from "@/components/mesas/mapa-do-salao";
import { acharConvidados, type MesaDoMapa } from "@/lib/mesas/mapa";

interface Propriedades {
  coupleNames: string;
  mesas: MesaDoMapa[];
  convidados: { id: string; name: string; tableId: string }[];
}

function ResultadoDaBusca({ nome, mesa, numero }: { nome: string; mesa: string; numero: number }) {
  return (
    <p role="status" className="rounded-2xl bg-ameixa-suave p-5 text-tinta">
      <span className="block text-sm text-tinta-suave">{nome}</span>
      <span className="font-display text-3xl">Mesa {mesa}</span>
      <span className="block text-sm text-tinta-suave">Mesa {numero} no mapa do salão</span>
    </p>
  );
}

/** Busca por nome: mostra a mesa de quem combina e a destaca no mapa do salão. */
export function AcheSuaMesa({ coupleNames, mesas, convidados }: Propriedades) {
  const [busca, setBusca] = useState("");
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const achados = acharConvidados(convidados, busca);
  const guest = convidados.find((c) => c.id === escolhido) ?? (achados.length === 1 ? achados[0] : null);
  const mesaDoConvidado = guest ? mesas.find((m) => m.id === guest.tableId) : null;
  const numero = mesaDoConvidado ? mesas.indexOf(mesaDoConvidado) + 1 : 0;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave">{coupleNames}</p>
        <h1 className="font-display text-[32px] font-medium leading-10 text-tinta">Ache a sua mesa</h1>
      </header>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-tinta">
        Digite o seu nome
        <span className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setEscolhido(null);
            }}
            autoComplete="off"
            className="min-h-12 w-full rounded-xl border border-linha-forte bg-papel pl-12 pr-4 text-base font-normal text-tinta"
          />
        </span>
      </label>
      {busca.trim().length >= 2 && achados.length === 0 ? <p role="status" className="text-tinta-suave">Não achamos esse nome. Confira a escrita ou fale com os noivos.</p> : null}
      {achados.length > 1 && !guest ? (
        <ul className="flex flex-col divide-y divide-linha rounded-2xl border border-linha" aria-label="Nomes encontrados">
          {achados.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => setEscolhido(c.id)} className="min-h-12 w-full cursor-pointer px-4 text-left text-tinta hover:bg-ameixa-suave">
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {guest && mesaDoConvidado ? <ResultadoDaBusca nome={guest.name} mesa={mesaDoConvidado.name} numero={numero} /> : null}
      {mesas.length > 0 ? <MapaDoSalao mesas={mesas} destaqueId={mesaDoConvidado?.id ?? null} /> : null}
    </div>
  );
}
