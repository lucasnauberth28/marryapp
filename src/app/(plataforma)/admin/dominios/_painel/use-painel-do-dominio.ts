// O estado do painel do pedido: qual ação está rodando, o erro, o documento revelado e o DNS devolvido pela Vercel.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { revelarDocumentoDoTitularDoDominio, type ResultadoDaAcaoDeAdmin, type ResultadoDaAcaoDeConectarDominio } from "@/actions/domain-admin-actions";
import type { ResultadoDaConexao } from "@/lib/vercel-domains-core";

export type PainelAberto = "registered" | "reject" | "online" | null;

export function usePainelDoDominio(orderId: string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [panel, setPanel] = useState<PainelAberto>(null);
  const [connection, setConnection] = useState<ResultadoDaConexao | null>(null);
  const [fullDocument, setFullDocument] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Qual ação está rodando: só o botão clicado mostra o spinner, os outros ficam desabilitados
  const [running, setRunning] = useState<string | null>(null);

  function run(key: string, action: () => Promise<ResultadoDaAcaoDeAdmin | ResultadoDaAcaoDeConectarDominio>, afterOk?: () => void) {
    setError(null);
    setRunning(key);
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        if (result.message) toast.success(result.message);
        if ("connection" in result) setConnection(result.connection);
        afterOk?.();
        router.refresh();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  function revealDocument() {
    setRunning("reveal");
    startTransition(async () => {
      const res = await revelarDocumentoDoTitularDoDominio(orderId);
      if (res.success) setFullDocument(res.document);
      else toast.error(res.error);
    });
  }

  /** Verdadeiro só para o botão da ação que está rodando (ele mostra o spinner). */
  const carregando = (key: string) => pending && running === key;

  return { pending, panel, setPanel, connection, fullDocument, error, run, revealDocument, carregando };
}

export type PainelDoDominioEstado = ReturnType<typeof usePainelDoDominio>;
