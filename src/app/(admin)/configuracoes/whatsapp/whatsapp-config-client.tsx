"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { obterSituacaoDoWhatsapp } from "@/actions/evolution-actions";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { EsqueletoDoBlocoDeSituacao } from "@/components/painel/skeleton-parts";
import { motion, AnimatePresence } from "framer-motion";

export function WhatsAppConfigClient() {
  const [status, setStatus] = useState<string>("LOADING");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Só consulta o estado: a conexão é do Aceito (compartilhada) e quem reconecta é a administração da plataforma
  const checkStatus = useCallback(async (isManualRefresh = false, toastId?: string | number) => {
    try {
      const statusRes = await obterSituacaoDoWhatsapp();
      if (statusRes.state === "open" || statusRes.state === "CONNECTED") {
        setStatus("CONNECTED");
        setMessage("");
        if (isManualRefresh) toast.success("O WhatsApp está conectado e pronto para enviar.", { id: toastId });
      } else {
        setStatus(statusRes.state || "DISCONNECTED");
        setMessage("");
        if (isManualRefresh) toast.error("O envio pelo WhatsApp está indisponível agora.", { id: toastId });
      }
    } catch {
      setStatus("ERROR");
      setMessage("Não deu para consultar a conexão agora. Tente de novo em instantes.");
      if (isManualRefresh) toast.error("Não deu para consultar a conexão agora. Tente de novo em instantes.", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshManually = () => {
    setLoading(true);
    const toastId = toast.loading("Verificando a conexão com o WhatsApp…");
    checkStatus(true, toastId);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial na Evolution API (sistema externo); setState só após o await
    checkStatus();
  }, [checkStatus]);

  return (
    <div className="rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold leading-7 text-tinta">Status da conexão</h2>
        <Button variant="outline" size="sm" onClick={refreshManually} loading={loading}>
          <RefreshCw aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {loading && status === "LOADING" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="status"
          >
            <span className="sr-only">Verificando a conexão…</span>
            <EsqueletoDoBlocoDeSituacao />
          </motion.div>
        ) : status === "open" || status === "CONNECTED" ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl bg-sucesso-suave p-10 text-center text-sucesso"
          >
            <CheckCircle2 className="mb-3 h-12 w-12" aria-hidden="true" />
            <h3 className="font-display text-2xl font-medium">WhatsApp conectado</h3>
            <p className="mt-2 max-w-md text-[15px]">
              O número está conectado. Os convites e lembretes podem ser enviados pelo painel, nos planos que incluem o WhatsApp.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="disconnected"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl bg-perigo-suave p-10 text-center text-perigo"
          >
            <XCircle className="mb-3 h-12 w-12" aria-hidden="true" />
            <h3 className="font-display text-2xl font-medium">WhatsApp desconectado</h3>
            <p className="mb-5 mt-2 max-w-md text-[15px]">
              {message || "O envio pelo WhatsApp está indisponível no momento. Tente de novo mais tarde."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
