// O estado do painel do pedido: qual painel está aberto, o documento revelado e o DNS devolvido pela Vercel.
import { useState } from "react";
import { toast } from "sonner";
import { revelarDocumentoDoTitularDoDominio } from "@/actions/dominio-admin/conexao";
import type { ResultadoDaAcaoDeAdmin, ResultadoDaAcaoDeConectarDominio } from "@/actions/dominio-admin/comum";
import type { ResultadoDaConexao } from "@/lib/vercel-domains-core";
import { useAcaoDoPainel } from "../../_sistema/use-acao-do-painel";

export type PainelAberto = "registered" | "reject" | "online" | null;

export function usePainelDoDominio(orderId: string) {
  const acao = useAcaoDoPainel();
  const [panel, setPanel] = useState<PainelAberto>(null);
  const [connection, setConnection] = useState<ResultadoDaConexao | null>(null);
  const [fullDocument, setFullDocument] = useState<string | null>(null);

  function run(key: string, action: () => Promise<ResultadoDaAcaoDeAdmin | ResultadoDaAcaoDeConectarDominio>, afterOk?: () => void) {
    acao.run(key, action, (result) => {
      if ("connection" in result) setConnection(result.connection);
      afterOk?.();
    });
  }

  function revealDocument() {
    acao.runCustom("reveal", async () => {
      const res = await revelarDocumentoDoTitularDoDominio(orderId);
      if (res.success) setFullDocument(res.document);
      else toast.error(res.error);
    });
  }

  return { pending: acao.pending, error: acao.error, carregando: acao.carregando, panel, setPanel, connection, fullDocument, run, revealDocument };
}

export type PainelDoDominioEstado = ReturnType<typeof usePainelDoDominio>;
