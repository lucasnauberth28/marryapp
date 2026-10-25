import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { estiloDoBotao, estiloDoBotaoDePerigo, estiloDaCaixaDeErro } from "@/components/painel/styles";
import type { ConvidadoLocal } from "@/types/local";
import { DadosDoConvidado, GrupoELugares, RespostaDoConvidado } from "./campos-do-convidado";
import { useCamposDoConvidado, type CamposDoConvidado } from "./use-campos-do-convidado";
import { useEnvioDoConvidado } from "./use-envio-do-convidado";

interface PropriedadesDoModalDoConvidado {
  isOpen: boolean;
  onClose: () => void;
  guest?: ConvidadoLocal | null;
  allGuests?: ConvidadoLocal[];
  /** Quando informado, a edição mostra o botão de excluir (útil no celular, sem a lixeira da linha). */
  onDelete?: (guest: ConvidadoLocal) => void;
}

interface PropriedadesDosBotoes {
  form: CamposDoConvidado;
  pendente: boolean;
  guest?: ConvidadoLocal | null;
  onClose: () => void;
  onDelete?: (guest: ConvidadoLocal) => void;
}

function BotoesDoFormulario({ form, pendente, guest, onClose, onDelete }: PropriedadesDosBotoes) {
  return (
    <div className="flex flex-col gap-2 border-t border-linha pt-4">
      <BotaoComCarregamento type="submit" loading={pendente && !form.addAnother} disabled={pendente} onClick={() => form.setAddAnother(false)} className={`${estiloDoBotao.primary} ${estiloDoBotao.block}`}>
        {form.isEditing ? "Salvar alterações" : "Salvar convidado"}
      </BotaoComCarregamento>
      {form.isEditing ? (
        <>
          <button type="button" onClick={onClose} disabled={pendente} className={`${estiloDoBotao.quiet} ${estiloDoBotao.block}`}>
            Cancelar
          </button>
          {onDelete && guest && (
            <button type="button" onClick={() => onDelete(guest)} disabled={pendente} className={`${estiloDoBotaoDePerigo} w-full`}>
              Excluir convidado
            </button>
          )}
        </>
      ) : (
        <BotaoComCarregamento type="submit" loading={pendente && form.addAnother} disabled={pendente} onClick={() => form.setAddAnother(true)} className={`${estiloDoBotao.quiet} ${estiloDoBotao.block}`}>
          Salvar e adicionar outro
        </BotaoComCarregamento>
      )}
    </div>
  );
}

export function ModalDoConvidado({ isOpen, onClose, guest, allGuests = [], onDelete }: PropriedadesDoModalDoConvidado) {
  const form = useCamposDoConvidado({ isOpen, guest, allGuests });
  const envio = useEnvioDoConvidado(guest, form, onClose);
  return (
    <ModalPersonalizado
      isOpen={isOpen}
      onClose={onClose}
      title={form.isEditing ? "Editar convidado" : "Adicionar convidado"}
      description={form.isEditing ? "Atualizem as informações deste convidado." : "Só o nome é obrigatório. O resto dá para completar depois."}
      size="md"
      className="max-h-[92vh] overflow-y-auto"
    >
      <form key={form.formKey} action={envio.enviar} className="flex flex-col gap-5">
        <DadosDoConvidado guest={guest} />
        <GrupoELugares form={form} />
        {form.isEditing && <RespostaDoConvidado guest={guest} form={form} />}
        {form.error && (
          <p role="alert" className={estiloDaCaixaDeErro}>
            {form.error}
          </p>
        )}
        <BotoesDoFormulario form={form} pendente={envio.isPending} guest={guest} onClose={onClose} onDelete={onDelete} />
      </form>
    </ModalPersonalizado>
  );
}
