// Os horários do cronograma na tela: janelas abertas, remoção e o PDF para os fornecedores.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { excluirEventoDaLinhaDoTempo } from "@/actions/timeline-actions";
import { useEstadoSincronizado } from "@/hooks/use-synced-state";
import { gerarPdfDaLinhaDoTempo } from "@/lib/generate-timeline-pdf";
import type { EventoDaLinhaDoTempo } from "./tipos";

export function useCronograma(eventosIniciais: EventoDaLinhaDoTempo[], coupleNames: string) {
  const router = useRouter();
  const [events, setEvents] = useEstadoSincronizado<EventoDaLinhaDoTempo[]>(eventosIniciais);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [editando, setEditando] = useState<EventoDaLinhaDoTempo | null>(null);
  const [paraExcluir, setParaExcluir] = useState<EventoDaLinhaDoTempo | null>(null);

  const abrirFormulario = (evento: EventoDaLinhaDoTempo | null) => {
    setEditando(evento);
    setFormularioAberto(true);
  };

  async function excluir(alvo: EventoDaLinhaDoTempo) {
    const toastId = toast.loading("Removendo o horário...");
    const res = await excluirEventoDaLinhaDoTempo(alvo.id);
    if (!res.success) return void toast.error(res.error || "Não deu para remover agora. Tente de novo.", { id: toastId });
    setEvents((prev) => prev.filter((e) => e.id !== alvo.id));
    toast.success("Horário removido.", { id: toastId });
    router.refresh();
  }

  function exportarPdf() {
    if (events.length === 0) return void toast.error("Cadastre ao menos um horário para gerar o PDF.");
    if (gerarPdfDaLinhaDoTempo(events, coupleNames)) toast.success("PDF do cronograma gerado.");
  }

  return {
    events, ordenados: [...events].sort((a, b) => a.time.localeCompare(b.time)),
    formularioAberto, editando, paraExcluir, setParaExcluir, abrirFormulario, fecharFormulario: () => setFormularioAberto(false),
    excluir, exportarPdf, atualizarTela: () => router.refresh(),
  };
}
