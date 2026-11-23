"use client";

import { useState } from "react";
import { Copy, Link2, RefreshCw, Link2Off } from "lucide-react";
import { toast } from "sonner";
import { criarLinkDeCompartilhamentoDasMesas, desativarLinkDeCompartilhamentoDasMesas } from "@/actions/mesas/compartilhar";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { estiloDoBotao } from "@/components/landing/styles";
import { cn } from "@/lib/utils";

const CAMINHO_DO_COMPARTILHAMENTO = "/mapa-das-mesas/";

type Resposta = { success: boolean; error?: string; token?: string };

function useCompartilhamento(onChange: (token: string | null) => void) {
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<Resposta>, done: (r: { token?: string }) => void, okMessage: string) {
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

  return {
    busy,
    criar: (mensagem: string) => run(criarLinkDeCompartilhamentoDasMesas, (r) => onChange(r.token ?? null), mensagem),
    desligar: () => run(desativarLinkDeCompartilhamentoDasMesas, () => onChange(null), "Link desligado."),
  };
}

async function copiar(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado.");
  } catch {
    toast.error("Não deu para copiar. Selecione o link e copie.");
  }
}

function LinkAtivo({ url, busy, aoGerarNovo, aoDesligar }: { url: string; busy: boolean; aoGerarNovo: () => void; aoDesligar: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-tinta">
        Link de visualização
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="min-h-11 w-full rounded-xl border border-linha-forte bg-papel px-4 font-mono text-sm font-normal text-tinta" />
      </label>
      <p className="text-sm leading-5 text-tinta-suave">Quem recebe o link procura o próprio nome e vê a mesa e os lugares. Mandem só para quem vai ao casamento. Se o link vazar, gerem um novo: o antigo para de funcionar na hora.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => copiar(url)} className={cn(estiloDoBotao.primary, "min-h-11 gap-2")}>
          <Copy aria-hidden="true" className="size-4" /> Copiar link
        </button>
        <button type="button" disabled={busy} onClick={aoGerarNovo} className={cn(estiloDoBotao.secondary, "min-h-11 gap-2")}>
          <RefreshCw aria-hidden="true" className="size-4" /> Gerar um novo
        </button>
        <button type="button" disabled={busy} onClick={aoDesligar} className={cn(estiloDoBotao.secondary, "min-h-11 gap-2")}>
          <Link2Off aria-hidden="true" className="size-4" /> Desligar
        </button>
      </div>
    </div>
  );
}

function SemLink({ busy, aoCriar }: { busy: boolean; aoCriar: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px] leading-6 text-tinta-suave">Criem um link para os convidados acharem a própria mesa pelo nome. O link é só de leitura: ninguém além de vocês altera as mesas.</p>
      <div>
        <button type="button" disabled={busy} onClick={aoCriar} className={cn(estiloDoBotao.primary, "min-h-11 gap-2")}>
          <Link2 aria-hidden="true" className="size-4" /> Criar link
        </button>
      </div>
    </div>
  );
}

/** Link de visualização das mesas: só leitura, o casal liga, troca ou desliga. */
export function DialogoDeCompartilhamento({ open, onClose, token, onChange }: { open: boolean; onClose: () => void; token: string | null; onChange: (token: string | null) => void }) {
  const c = useCompartilhamento(onChange);
  const url = token && typeof window !== "undefined" ? `${window.location.origin}${CAMINHO_DO_COMPARTILHAMENTO}${token}` : "";

  return (
    <ModalPersonalizado isOpen={open} onClose={onClose} title="Compartilhar as mesas" description="Quem tiver o link acha a própria mesa pelo nome. Só vocês alteram as mesas." size="md">
      {token ? <LinkAtivo url={url} busy={c.busy} aoGerarNovo={() => c.criar("Link novo criado. O anterior não funciona mais.")} aoDesligar={c.desligar} /> : <SemLink busy={c.busy} aoCriar={() => c.criar("Link criado.")} />}
    </ModalPersonalizado>
  );
}
