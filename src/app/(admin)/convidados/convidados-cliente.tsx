"use client";
// A página de convidados: lista com filtros, cadastro, importação de planilha e remoção.
import { useState } from "react";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import type { ConvidadoLocal } from "@/types/local";
import { AcoesDoCabecalho } from "./componentes/acoes-do-cabecalho";
import { BotaoFlutuanteDeAdicionar } from "./componentes/botao-flutuante-de-adicionar";
import { EstadoVazioDosConvidados } from "./componentes/estado-vazio";
import { ModalDeImportacaoDeConvidados } from "./componentes/importacao/modal-de-importacao";
import { ListaDeConvidadosNaTela } from "./componentes/lista-de-convidados";
import { ModalDoConvidado } from "./componentes/cadastro/modal-do-convidado";
import type { FiltroDaLista, LinhaDoConvidado } from "./componentes/tipos";
import { useListaDeConvidados } from "./componentes/use-lista-de-convidados";
import { useRemocaoDeConvidado } from "./componentes/use-remocao-de-convidado";

interface PropriedadesDosConvidadosCliente {
  initialGuests: LinhaDoConvidado[];
  /** Prazo para confirmar já formatado (ex.: "15 de março de 2027"), quando o casal definiu. */
  deadlineLabel: string | null;
  /** O plano do casal inclui o WhatsApp: só então o atalho para lembrar quem não respondeu aparece. */
  canRemind: boolean;
  /** Filtro de resposta que a lista abre já aplicado (padrão: todos). */
  initialFilter?: FiltroDaLista;
}

export function ConvidadosCliente({ initialGuests, deadlineLabel, canRemind, initialFilter = "all" }: PropriedadesDosConvidadosCliente) {
  const [cadastroAberto, setCadastroAberto] = useState(false);
  const [editando, setEditando] = useState<ConvidadoLocal | null>(null);
  const [importacaoAberta, setImportacaoAberta] = useState(false);
  const lista = useListaDeConvidados(initialGuests, initialFilter);
  const remocao = useRemocaoDeConvidado();

  const abrirCadastro = (convidado: ConvidadoLocal | null) => {
    setEditando(convidado);
    setCadastroAberto(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDaPagina
        eyebrow="Convidados"
        title="Lista de convidados"
        description={deadlineLabel ? `Prazo de confirmação definido por vocês: ${deadlineLabel}.` : "Quem vocês convidam, quantos lugares cada um tem e quem já respondeu."}
        actions={<AcoesDoCabecalho temConvidados={initialGuests.length > 0} aoImportar={() => setImportacaoAberta(true)} aoAdicionar={() => abrirCadastro(null)} />}
      />
      {initialGuests.length === 0 ? (
        <EstadoVazioDosConvidados aoAdicionar={() => abrirCadastro(null)} aoImportar={() => setImportacaoAberta(true)} />
      ) : (
        <ListaDeConvidadosNaTela lista={lista} podeLembrar={canRemind} removendoId={remocao.removendoId} aoEditar={abrirCadastro} aoRemover={remocao.pedir} />
      )}

      <BotaoFlutuanteDeAdicionar aoClicar={() => abrirCadastro(null)} />
      <ModalDeImportacaoDeConvidados isOpen={importacaoAberta} onClose={() => setImportacaoAberta(false)} existing={initialGuests.map((g) => ({ name: g.name, phone: g.phone ?? null }))} />
      <ModalDoConvidado
        isOpen={cadastroAberto}
        onClose={() => setCadastroAberto(false)}
        guest={editando}
        allGuests={initialGuests}
        onDelete={(g) => {
          setCadastroAberto(false);
          remocao.pedir(g);
        }}
      />
      <ModalDeConfirmacao
        isOpen={remocao.confirmando}
        onClose={() => remocao.setConfirmando(false)}
        onConfirm={remocao.confirmar}
        title="Remover convidado"
        description={remocao.paraRemover ? `Remover ${remocao.paraRemover.name} da lista? Não dá para desfazer.` : ""}
        confirmText="Remover"
      />
    </div>
  );
}
