"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getWhatsAppStatus, generateWhatsAppQRCode } from "@/actions/evolution-actions";
import { Button } from "@/components/ui/button";
import { RefreshCw, QrCode, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

/** Mensagens técnicas do servidor viram texto claro (sem mostrar endereço nem chave). */
function friendly(error: string | undefined | null): string {
  if (!error) return "";
  if (error.startsWith("Serviço não configurado")) return "A conexão do WhatsApp ainda não foi ativada neste ambiente.";
  return error;
}

export function WhatsAppConfigClient() {
  const [status, setStatus] = useState<string>("LOADING");
  const [message, setMessage] = useState<string>("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Consulta a Evolution API; o primeiro setState só acontece depois do await
  const checkStatusAndQRCode = useCallback(async (isManualRefresh = false, toastId?: string | number) => {
    try {
      const statusRes = await getWhatsAppStatus();

      if (statusRes.state === "open" || statusRes.state === "CONNECTED") {
        setStatus("CONNECTED");
        setQrCode(null);
        setMessage("");
        if (isManualRefresh) {
          toast.success("O WhatsApp está conectado e pronto para enviar.", { id: toastId });
        }
      } else {
        const qrRes = await generateWhatsAppQRCode();
        if (qrRes.success && qrRes.qrCode) {
          setQrCode(qrRes.qrCode);
          setStatus("QR_CODE_READY");
          setMessage("");
          if (isManualRefresh) {
            toast.info("Novo QR Code gerado. Aponte a câmera do WhatsApp para ele.", { id: toastId });
          }
        } else {
          setStatus(statusRes.state || "DISCONNECTED");
          if (qrRes.error) setMessage(friendly(qrRes.error));
          if (isManualRefresh) {
            toast.error(friendly(qrRes.error) || "O WhatsApp está desconectado.", { id: toastId });
          }
        }
      }
    } catch {
      setStatus("ERROR");
      setMessage("Não deu para consultar a conexão agora. Tente de novo em instantes.");
      if (isManualRefresh) {
        toast.error("Não deu para consultar a conexão agora. Tente de novo em instantes.", { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const requestQRCode = async () => {
    setLoading(true);
    setQrCode(null);
    try {
      const res = await generateWhatsAppQRCode();
      if (res.success && res.qrCode) {
        setQrCode(res.qrCode);
        setStatus("QR_CODE_READY");
        setMessage("");
      } else {
        setMessage(friendly(res.error) || "Não deu para gerar o QR Code. Tente de novo.");
      }
    } catch {
      setMessage("Não deu para gerar o QR Code agora. Tente de novo em instantes.");
    } finally {
      setLoading(false);
    }
  };

  const refreshManually = () => {
    setLoading(true);
    const toastId = toast.loading("Verificando a conexão com o WhatsApp…");
    checkStatusAndQRCode(true, toastId);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial na Evolution API (sistema externo); setState só após o await
    checkStatusAndQRCode();
  }, [checkStatusAndQRCode]);

  useEffect(() => {
    if (status !== "QR_CODE_READY" && !qrCode) return;

    const interval = setInterval(async () => {
      try {
        const res = await getWhatsAppStatus();
        if (res.state === "open" || res.state === "CONNECTED") {
          setStatus("CONNECTED");
          setQrCode(null);
          setMessage("");
        }
      } catch {
        // Silencioso no polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, qrCode]);

  return (
    <div className="rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold leading-7 text-tinta">Status da conexão</h2>
        <Button variant="outline" size="sm" onClick={refreshManually} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {loading && !qrCode && status === "LOADING" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="status"
            className="flex flex-col items-center justify-center p-12 text-tinta-suave"
          >
            <Loader2 className="mb-3 h-8 w-8 animate-spin" aria-hidden="true" />
            <p className="text-[15px]">Verificando a conexão…</p>
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
              O número está pareado. Os convites e lembretes podem ser enviados pelo painel.
            </p>
          </motion.div>
        ) : qrCode ? (
          <motion.div
            key="qrcode"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-xl bg-areia p-6 text-center md:p-8"
          >
            <h3 className="font-display text-2xl font-medium text-tinta">Escaneie o QR Code</h3>
            <p className="mb-5 mt-2 max-w-md text-[15px] text-tinta-suave">
              Abra o WhatsApp no celular, entre em <strong className="text-tinta">Aparelhos conectados</strong> e aponte a câmera para o código.
            </p>

            <div className="rounded-2xl border border-linha bg-papel p-4">
              {qrCode.startsWith("data:image") ? (
                // eslint-disable-next-line @next/next/no-img-element -- QR Code gerado em data URI pela API
                <img src={qrCode} alt="QR Code para conectar o WhatsApp" className="h-60 w-60 object-contain md:h-64 md:w-64" />
              ) : (
                <QRCodeSVG value={qrCode} size={240} aria-label="QR Code para conectar o WhatsApp" />
              )}
            </div>

            <p className="mt-4 flex items-center gap-2 text-sm text-tinta-suave" role="status">
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              Esperando a leitura pelo aplicativo…
            </p>

            <Button className="mt-5" onClick={refreshManually} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
              Já escaneei, verificar
            </Button>
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
              {message || "Não conseguimos conectar ao WhatsApp, ou o aparelho foi desconectado."}
            </p>
            <Button onClick={requestQRCode} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <QrCode aria-hidden="true" />}
              Gerar QR Code para reconectar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
