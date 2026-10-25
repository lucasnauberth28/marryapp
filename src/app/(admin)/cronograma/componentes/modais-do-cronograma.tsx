import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { FormularioDoEvento } from "./formulario-do-evento";
import type { EventoDaLinhaDoTempo } from "./tipos";

interface PropriedadesDosModais {
  formularioAberto: boolean;
  aoFecharFormulario: () => void;
  editando: EventoDaLinhaDoTempo | null;
  quantidade: number;
  aoSalvar: () => void;
  aoPedirExclusao: (e: EventoDaLinhaDoTempo) => void;
  paraExcluir: EventoDaLinhaDoTempo | null;
  aoCancelarExclusao: () => void;
  aoExcluir: (e: EventoDaLinhaDoTempo) => void;
}

/** A janela de adicionar/editar um horário e a confirmação de excluir. */
export function ModaisDoCronograma(p: PropriedadesDosModais) {
  return (
    <>
      <ModalPersonalizado isOpen={p.formularioAberto} onClose={p.aoFecharFormulario} title={p.editando ? "Editar horário" : "Novo horário"} size="sm" className="max-h-[92vh] overflow-y-auto">
        <FormularioDoEvento event={p.editando} count={p.quantidade} onClose={p.aoFecharFormulario} onSaved={p.aoSalvar} onDelete={p.aoPedirExclusao} />
      </ModalPersonalizado>
      <ModalDeConfirmacao
        isOpen={!!p.paraExcluir}
        onClose={p.aoCancelarExclusao}
        onConfirm={() => {
          const alvo = p.paraExcluir;
          p.aoCancelarExclusao();
          if (alvo) p.aoExcluir(alvo);
        }}
        title="Excluir horário"
        description={p.paraExcluir ? `Remover "${p.paraExcluir.title}" do cronograma? Não dá para desfazer.` : ""}
        confirmText="Excluir"
      />
    </>
  );
}
