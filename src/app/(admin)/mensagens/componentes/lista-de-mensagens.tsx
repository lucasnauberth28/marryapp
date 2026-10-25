// "Suas mensagens": um cartão por mensagem salva, com os botões de enviar e editar.
import { Pencil, Plus, Send } from "lucide-react";
import { EtiquetaDeSituacao } from "@/components/painel/status-chip";
import { estiloDaDicaDoPainel, estiloDoBotao, estiloDoCartao } from "@/components/painel/styles";
import type { ModeloDeMensagem } from "./tipos";
import { rotuloDoTipo } from "./utilitarios";

interface ListaDeMensagensProps {
  modelos: ModeloDeMensagem[];
  nomeDeExemplo: string;
  aoCriar: () => void;
  aoEnviar: (m: ModeloDeMensagem) => void;
  aoEditar: (m: ModeloDeMensagem) => void;
}

function CartaoDaMensagem({ modelo, nomeDeExemplo, aoEnviar, aoEditar }: { modelo: ModeloDeMensagem; nomeDeExemplo: string; aoEnviar: () => void; aoEditar: () => void }) {
  return (
    <li className={`${estiloDoCartao} flex min-w-0 flex-col gap-3 p-5`}>
      <div className="flex flex-col gap-1.5">
        <EtiquetaDeSituacao tone="neutro" className="self-start">{rotuloDoTipo(modelo.type)}</EtiquetaDeSituacao>
        <h3 className="line-clamp-2 text-lg font-semibold leading-7 text-tinta">{modelo.name}</h3>
      </div>
      <p className="line-clamp-4 whitespace-pre-line text-[15px] leading-6 text-tinta-suave">{modelo.content.replace(/\{nome\}/gi, nomeDeExemplo)}</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={aoEnviar} className={estiloDoBotao.primary}>
          <Send className="size-4" aria-hidden="true" />
          Enviar
        </button>
        <button type="button" onClick={aoEditar} className={estiloDoBotao.secondary}>
          <Pencil className="size-4" aria-hidden="true" />
          Editar
        </button>
      </div>
    </li>
  );
}

export function ListaDeMensagens({ modelos, nomeDeExemplo, aoCriar, aoEnviar, aoEditar }: ListaDeMensagensProps) {
  return (
    <section aria-labelledby="suas-mensagens" className="flex flex-col gap-4">
      <div>
        <h2 id="suas-mensagens" className="font-display text-2xl leading-8 text-tinta">Suas mensagens</h2>
        <p className={`${estiloDaDicaDoPainel} mt-1`}>Escolham uma mensagem para enviar a quem quiserem, ou editem o texto.</p>
      </div>
      {modelos.length === 0 ? (
        <div className={`${estiloDoCartao} flex flex-col items-start gap-3 p-6`}>
          <p className="text-[15px] leading-6 text-tinta-suave">Vocês ainda não escreveram nenhuma mensagem.</p>
          <button type="button" onClick={aoCriar} className={estiloDoBotao.primary}>
            <Plus className="size-4" aria-hidden="true" />
            Escrever a primeira mensagem
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modelos.map((m) => <CartaoDaMensagem key={m.id} modelo={m} nomeDeExemplo={nomeDeExemplo} aoEnviar={() => aoEnviar(m)} aoEditar={() => aoEditar(m)} />)}
        </ul>
      )}
    </section>
  );
}
