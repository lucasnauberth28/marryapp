// "Para quem vai?": os grupos prontos, a opção de escolher pessoas uma a uma e a lista com busca.
import { useId } from "react";
import { Search } from "lucide-react";
import type { Guest } from "@prisma/client";
import { EtiquetaDeConfirmacao, EtiquetaDeSituacao } from "@/components/painel/status-chip";
import { estiloDaDicaDoPainel, estiloDaEntradaDoPainel } from "@/components/painel/styles";
import { formatarTelefone } from "@/lib/formatacao/telefone";
import { cn } from "@/lib/utils";
import { PUBLICOS } from "./tipos";
import type { EnvioDaMensagem } from "./use-envio-da-mensagem";
import { temTelefone } from "./utilitarios";

const CLASSE_DA_OPCAO = "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-ameixa";

function OpcaoDePublico({ ativa, aoEscolher, titulo, ajuda, contagem, esmaecida }: { ativa: boolean; aoEscolher: () => void; titulo: string; ajuda: string; contagem: number | null; esmaecida?: boolean }) {
  return (
    <label className={cn(CLASSE_DA_OPCAO, ativa ? "border-ameixa bg-ameixa-suave" : "border-linha bg-papel hover:border-ameixa", esmaecida && "opacity-60")}>
      <input type="radio" name="para-quem" checked={ativa} onChange={aoEscolher} className="size-5 shrink-0 accent-[var(--color-ameixa)]" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-tinta">{titulo}</span>
        <span className="block text-sm text-tinta-suave">{ajuda}</span>
      </span>
      {contagem !== null ? <span className="shrink-0 rounded-full bg-areia px-3 py-1 text-sm font-semibold tabular-nums text-tinta">{contagem}</span> : null}
    </label>
  );
}

function LinhaDeConvidado({ convidado, marcado, aoAlternar }: { convidado: Guest; marcado: boolean; aoAlternar: () => void }) {
  const ok = temTelefone(convidado);
  return (
    <li>
      <label className={`flex min-h-14 items-center gap-3 px-3 py-2 ${ok ? "cursor-pointer hover:bg-ameixa-suave/40" : "opacity-60"}`}>
        <input type="checkbox" disabled={!ok} checked={marcado} onChange={aoAlternar} className="size-5 shrink-0 accent-[var(--color-ameixa)]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-tinta">{convidado.name}</span>
          <span className="block text-sm text-tinta-suave">{convidado.phone ? formatarTelefone(convidado.phone) : "Sem telefone"}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
          <EtiquetaDeConfirmacao status={convidado.rsvpStatus} />
          {convidado.hasReceivedMessage ? <EtiquetaDeSituacao tone="neutro">Já recebeu</EtiquetaDeSituacao> : null}
        </span>
      </label>
    </li>
  );
}

function ListaParaEscolher({ envio }: { envio: EnvioDaMensagem }) {
  const idDaBusca = useId();
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
        <input id={idDaBusca} type="search" aria-label="Buscar convidado" value={envio.busca} onChange={(e) => envio.setBusca(e.target.value)} placeholder="Buscar por nome ou telefone" className={`${estiloDaEntradaDoPainel} pl-10`} />
      </div>
      <ul className="max-h-72 divide-y divide-linha overflow-y-auto rounded-xl border border-linha">
        {envio.exibidos.length === 0 ? <li className="px-4 py-6 text-center text-sm text-tinta-suave">Ninguém com esta busca.</li> : null}
        {envio.exibidos.map((g) => <LinhaDeConvidado key={g.id} convidado={g} marcado={envio.escolhidos.includes(g.id)} aoAlternar={() => envio.alternarConvidado(g.id)} />)}
      </ul>
    </div>
  );
}

export function EscolhaDoPublico({ envio }: { envio: EnvioDaMensagem }) {
  const personalizado = envio.publico === "custom";
  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-base font-semibold text-tinta">Para quem vai?</legend>
        {PUBLICOS.map((a) => (
          <OpcaoDePublico key={a.id} ativa={envio.publico === a.id} aoEscolher={() => envio.mudarPublico(a.id)} titulo={a.label} ajuda={a.help} contagem={envio.contagens[a.id]} esmaecida={envio.contagens[a.id] === 0} />
        ))}
        <OpcaoDePublico ativa={personalizado} aoEscolher={() => envio.mudarPublico("custom")} titulo="Escolher pessoas uma a uma" ajuda="Marquem quem recebe, na lista abaixo." contagem={personalizado ? envio.escolhidos.length : null} />
        <p className={estiloDaDicaDoPainel}>Só entra quem tem telefone cadastrado.</p>
      </fieldset>
      {personalizado ? <ListaParaEscolher envio={envio} /> : null}
    </>
  );
}
