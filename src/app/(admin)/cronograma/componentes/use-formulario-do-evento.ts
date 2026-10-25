// Os campos do horário (novo ou editado) e o envio.
import { useState } from "react";
import { toast } from "sonner";
import { atualizarEventoDaLinhaDoTempo, criarEventoDaLinhaDoTempo } from "@/actions/timeline-actions";
import type { EventoDaLinhaDoTempo } from "./tipos";

export function useFormularioDoEvento(event: EventoDaLinhaDoTempo | null, count: number, onClose: () => void, onSaved: () => void) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [time, setTime] = useState(event?.time ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !time) return setError(!title.trim() ? "Dê um nome ao horário, por exemplo: Cerimônia." : "Escolha a hora.");
    setError(null);
    setBusy(true);
    const toastId = toast.loading(event ? "Salvando o horário..." : "Adicionando o horário...");
    const payload = { title: title.trim(), time, description: description.trim(), icon: event?.icon ?? "Clock", position: event?.position ?? count };
    const res = event ? await atualizarEventoDaLinhaDoTempo(event.id, payload) : await criarEventoDaLinhaDoTempo(payload);
    setBusy(false);
    if (!res.success) {
      toast.error(res.error || "Não deu para salvar. Tente de novo.", { id: toastId });
      return setError(res.error || "Não deu para salvar. Tente de novo.");
    }
    toast.success(event ? "Horário salvo." : "Horário adicionado.", { id: toastId });
    onSaved();
    onClose();
  }

  return { title, setTitle, time, setTime, description, setDescription, busy, error, submit };
}
