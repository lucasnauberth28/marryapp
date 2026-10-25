import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { estiloDoBotao, estiloDoCartao } from "@/components/painel/styles";
import type { ConvidadoLocal } from "@/types/local";
import { CartoesDeConvidados } from "./cartoes-de-convidados";
import { FiltrosDaLista } from "./filtros-da-lista";
import { TabelaDeConvidados } from "./tabela-de-convidados";
import type { ListaDeConvidados } from "./use-lista-de-convidados";

interface PropriedadesDaListaDeConvidados {
  lista: ListaDeConvidados;
  podeLembrar: boolean;
  removendoId: string | null;
  aoEditar: (g: ConvidadoLocal) => void;
  aoRemover: (g: ConvidadoLocal) => void;
}

function RodapeDaLista({ lista }: { lista: ListaDeConvidados }) {
  const { mostrados, filtrados, contagens } = lista;
  return (
    <p className="text-sm text-tinta-suave">
      Mostrando {mostrados.length} de {filtrados.length}
      {filtrados.length !== contagens.all && ` (${contagens.all} no total)`}
      {mostrados.length < filtrados.length && (
        <>
          {" · "}
          <button type="button" onClick={lista.carregarMais} className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-ameixa underline underline-offset-2 hover:text-ameixa-hover md:min-h-0">
            Carregar mais
          </button>
        </>
      )}
    </p>
  );
}

/** Filtros, atalho para lembrar quem não respondeu e a lista (tabela no computador, cartões no celular). */
export function ListaDeConvidadosNaTela({ lista, podeLembrar, removendoId, aoEditar, aoRemover }: PropriedadesDaListaDeConvidados) {
  return (
    <>
      <FiltrosDaLista lista={lista} />
      {podeLembrar && lista.filtro === "PENDING" && lista.contagens.PENDING > 0 && (
        <Link href="/mensagens" className={`${estiloDoBotao.secondary} w-full md:w-fit`}>
          <MessageCircle className="size-4" aria-hidden="true" />
          Abrir mensagens para os {lista.contagens.PENDING} sem resposta
        </Link>
      )}
      {lista.filtrados.length === 0 ? (
        <div className={`${estiloDoCartao} px-6 py-12 text-center text-tinta-suave`}>Nenhum convidado encontrado. Tentem outro nome, filtro ou grupo.</div>
      ) : (
        <>
          <TabelaDeConvidados convidados={lista.mostrados} removendoId={removendoId} aoEditar={aoEditar} aoRemover={aoRemover} />
          <CartoesDeConvidados convidados={lista.mostrados} removendoId={removendoId} aoEditar={aoEditar} />
          <RodapeDaLista lista={lista} />
        </>
      )}
    </>
  );
}
