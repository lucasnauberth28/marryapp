import { useId } from "react";
import { Camera, QrCode, Search } from "lucide-react";
import { EsqueletoDeLinhas } from "@/components/painel/skeleton-parts";
import { EtiquetaDeSituacao } from "@/components/painel/status-chip";
import { estiloDaEntradaDoPainel, estiloDoBotao, estiloDoCartao } from "@/components/painel/styles";
import type { InformacoesDoConvidadoNaEntrada } from "../lookup-actions";
import type { BuscaPorNome } from "./use-busca-por-nome";

function Resultados({ busca, aoEscolher }: { busca: BuscaPorNome; aoEscolher: (g: InformacoesDoConvidadoNaEntrada) => void }) {
  const { matches, searching } = busca;
  if (searching && !matches) {
    return (
      <div role="status" aria-busy="true">
        <span className="sr-only">Buscando convidados...</span>
        <EsqueletoDeLinhas rows={2} lines={2} leading="none" className="rounded-xl border border-linha px-4" />
      </div>
    );
  }
  if (!matches) return null;
  return (
    <ul aria-busy={searching || undefined} className={`flex flex-col divide-y divide-linha rounded-xl border border-linha transition-opacity ${searching ? "opacity-60" : ""}`}>
      {matches.length === 0 && <li className="px-4 py-4 text-sm text-tinta-suave">Ninguém com esse nome na lista.</li>}
      {matches.map((g) => (
        <li key={g.id}>
          <button type="button" onClick={() => aoEscolher(g)} className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 px-4 py-2 text-left hover:bg-ameixa-suave/40">
            <span className="min-w-0">
              <span className="block truncate font-semibold text-tinta">{g.name}</span>
              <span className="block text-sm text-tinta-suave">
                {g.people} {g.people === 1 ? "pessoa" : "pessoas"} · {g.table ?? "sem mesa"}
              </span>
            </span>
            {g.alreadyIn && <EtiquetaDeSituacao tone="aviso">Já entrou</EtiquetaDeSituacao>}
          </button>
        </li>
      ))}
    </ul>
  );
}

interface PropriedadesDoPronto {
  busca: BuscaPorNome;
  aoLer: () => void;
  aoEscolher: (g: InformacoesDoConvidadoNaEntrada) => void;
}

export function ProntoParaLer({ busca, aoLer, aoEscolher }: PropriedadesDoPronto) {
  const searchId = useId();
  return (
    <>
      <section className={`${estiloDoCartao} flex flex-col items-center gap-4 p-8 text-center`}>
        <span className="grid size-20 place-items-center rounded-full bg-ameixa-suave text-ameixa">
          <Camera className="size-9" aria-hidden="true" />
        </span>
        <h2 className="font-display text-[26px] font-medium leading-8 text-tinta">Pronto para ler</h2>
        <p className="text-tinta-suave">Peça o código QR que o convidado recebeu ao confirmar presença e aproxime da câmera.</p>
        <button type="button" onClick={aoLer} className={`${estiloDoBotao.primary} ${estiloDoBotao.block} sm:w-auto`}>
          <QrCode className="size-5" aria-hidden="true" />
          Ler código QR do convidado
        </button>
      </section>
      <section className={`${estiloDoCartao} flex flex-col gap-3 p-4`}>
        <label htmlFor={searchId} className="text-sm font-semibold text-tinta">
          Sem o código QR? Busque pelo nome
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
          <input id={searchId} type="search" autoComplete="off" value={busca.query} onChange={(e) => void busca.buscar(e.target.value)} placeholder="Digite o nome do convidado" className={`${estiloDaEntradaDoPainel} pl-10`} />
        </div>
        <Resultados busca={busca} aoEscolher={aoEscolher} />
      </section>
    </>
  );
}
