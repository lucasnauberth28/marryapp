import { useId } from "react";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { estiloDaCaixaDeErro, estiloDoBotao, estiloDoBotaoDePerigo } from "@/components/painel/styles";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import type { EventoDaLinhaDoTempo } from "./tipos";
import { useFormularioDoEvento } from "./use-formulario-do-evento";

interface PropriedadesDoFormulario {
  event: EventoDaLinhaDoTempo | null;
  count: number;
  onClose: () => void;
  onSaved: () => void;
  onDelete: (e: EventoDaLinhaDoTempo) => void;
}

export function FormularioDoEvento({ event, count, onClose, onSaved, onDelete }: PropriedadesDoFormulario) {
  const ids = { title: useId(), time: useId(), description: useId() };
  const f = useFormularioDoEvento(event, count, onClose, onSaved);
  const { busy, error } = f;
  return (
    <form onSubmit={f.submit} className="flex flex-col gap-5">
      <Entrada id={ids.title} label="O que acontece" value={f.title} onChange={(e) => f.setTitle(e.target.value)} placeholder="Ex.: Cerimônia, coquetel, valsa" disabled={busy} error={error && !f.title.trim() ? error : undefined} />
      <Entrada id={ids.time} type="time" label="Horário" fieldClassName="sm:max-w-44" value={f.time} onChange={(e) => f.setTime(e.target.value)} disabled={busy} error={error && f.title.trim() && !f.time ? error : undefined} />
      <AreaDeTexto id={ids.description} label="Local ou detalhes" optional hint="Quem vê o site também lê este texto." value={f.description} onChange={(e) => f.setDescription(e.target.value)} rows={3} disabled={busy} />
      {error && f.title.trim() && f.time && (
        <p role="alert" className={estiloDaCaixaDeErro}>
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 border-t border-linha pt-4">
        <BotaoComCarregamento type="submit" loading={busy} className={`${estiloDoBotao.primary} ${estiloDoBotao.block}`}>
          {event ? "Salvar alterações" : "Adicionar horário"}
        </BotaoComCarregamento>
        <button type="button" onClick={onClose} disabled={busy} className={`${estiloDoBotao.quiet} ${estiloDoBotao.block}`}>
          Cancelar
        </button>
        {event && (
          <button type="button" onClick={() => onDelete(event)} disabled={busy} className={`${estiloDoBotaoDePerigo} w-full`}>
            Excluir horário
          </button>
        )}
      </div>
    </form>
  );
}
