"use client";

import { useState } from "react";
import { Copy, Link2, RefreshCw, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { criarLinkDeCompartilhamentoDasMesas3D, desativarLinkDeCompartilhamentoDasMesas3D } from "@/actions/table3d-actions";
import { CustomModal } from "@/components/ui/custom-modal";
import { btn } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

const SHARE_PATH = "/mapa-das-mesas/";

/** Link de visualização das mesas: só leitura, o casal liga, troca ou desliga. */
export function ShareDialog({ open, onClose, token, onChange }: { open: boolean; onClose: () => void; token: string | null; onChange: (token: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const url = token && typeof window !== "undefined" ? `${window.location.origin}${SHARE_PATH}${token}` : "";

  async function run(action: () => Promise<{ success: boolean; error?: string; token?: string }>, done: (r: { token?: string }) => void, okMessage: string) {
    setBusy(true);
    try {
      const res = await action();
      if (!res.success) toast.error(res.error ?? "Não deu certo. Tente de novo.");
      else {
        done(res);
        toast.success(okMessage);
      }
    } catch {
      toast.error("Não conseguimos falar com o servidor. Tente de novo em instantes.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não deu para copiar. Selecione o link e copie.");
    }
  }

  return (
    <CustomModal isOpen={open} onClose={onClose} title="Compartilhar as mesas" description="Quem tiver o link vê o mapa e acha a própria mesa. Só vocês alteram as mesas." size="md">
      {token ? (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-tinta">
            Link de visualização
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-11 w-full rounded-xl border border-linha-forte bg-papel px-4 font-mono text-sm font-normal text-tinta"
            />
          </label>
          <p className="text-sm leading-5 text-tinta-suave">Quem recebe o link vê os nomes dos convidados e as mesas. Mandem só para quem vai ao casamento. Se o link vazar, gerem um novo: o antigo para de funcionar na hora.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className={cn(btn.primary, "min-h-11 gap-2")}>
              <Copy aria-hidden="true" className="size-4" /> Copiar link
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(criarLinkDeCompartilhamentoDasMesas3D, (r) => onChange(r.token ?? null), "Link novo criado. O anterior não funciona mais.")}
              className={cn(btn.secondary, "min-h-11 gap-2")}
            >
              <RefreshCw aria-hidden="true" className="size-4" /> Gerar um novo
            </button>
            <button type="button" disabled={busy} onClick={() => run(desativarLinkDeCompartilhamentoDasMesas3D, () => onChange(null), "Link desligado.")} className={cn(btn.secondary, "min-h-11 gap-2")}>
              <Link2Off aria-hidden="true" className="size-4" /> Desligar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[15px] leading-6 text-tinta-suave">Criem um link para os convidados verem o mapa das mesas em 3D e acharem o próprio lugar. O link é só de leitura: ninguém além de vocês altera as mesas.</p>
          <div>
            <button type="button" disabled={busy} onClick={() => run(criarLinkDeCompartilhamentoDasMesas3D, (r) => onChange(r.token ?? null), "Link criado.")} className={cn(btn.primary, "min-h-11 gap-2")}>
              <Link2 aria-hidden="true" className="size-4" /> Criar link
            </button>
          </div>
        </div>
      )}
    </CustomModal>
  );
}
