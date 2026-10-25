// Copiar o link do convite e anotar os envios feitos nesta visita (a lista e o número refletem na hora).
import { useState } from "react";
import { toast } from "sonner";
import { marcarConviteComoCompartilhado } from "@/actions/invite-share-actions";
import type { LinhaDeConvite, PropriedadesDoBlocoDeConvites } from "./tipos";

/** Copia o texto; sem a API do navegador, cai no campo selecionado. */
async function copiarTexto(text: string, field: HTMLInputElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      field?.select();
      return document.execCommand("copy");
    } catch {
      return false;
    }
  }
}

export function useEnvioDeConvites({ siteUrl, invitesTotal, sentCount, toInvite, reminders }: Pick<PropriedadesDoBlocoDeConvites, "siteUrl" | "invitesTotal" | "sentCount" | "toInvite" | "reminders">, campo: React.RefObject<HTMLInputElement | null>) {
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());
  // Só os envios de convite entram na conta (lembrete não conta como convite enviado)
  const invitable = new Set([...toInvite.rows.map((r) => r.id), ...(reminders?.rows.filter((r) => r.kind === "invite").map((r) => r.id) ?? [])]);
  const sentNow = Math.min(invitesTotal, sentCount + [...done].filter((id) => invitable.has(id)).length);

  async function copiar() {
    if (!(await copiarTexto(siteUrl, campo.current))) return void toast.error("Não deu para copiar. Selecione o endereço e copie à mão.");
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  /** O WhatsApp abre pelo próprio link (nova aba); aqui só se anota o envio, sem segurar a abertura. */
  function aoAbrirWhatsapp(row: LinhaDeConvite) {
    setDone((prev) => new Set(prev).add(row.id));
    if (row.kind !== "invite") return;
    void marcarConviteComoCompartilhado({ guestId: row.id }).then((res) => {
      if (res.success) return;
      setDone((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      toast.error(res.error);
    });
  }

  return { copied, done, sentNow, remaining: Math.max(0, invitesTotal - sentNow), copiar, aoAbrirWhatsapp };
}

export type EnvioDeConvites = ReturnType<typeof useEnvioDeConvites>;
