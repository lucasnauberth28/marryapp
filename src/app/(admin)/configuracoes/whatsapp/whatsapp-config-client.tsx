"use client";

import { useState, useEffect, useCallback } from "react";
import { getWhatsAppStatus, generateWhatsAppQRCode } from "@/actions/evolution-actions";
import { Button } from "@/components/ui/button";
import { RefreshCw, QrCode, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function WhatsAppConfigClient() {
  const [status, setStatus] = useState<string>("LOADING");
  const [message, setMessage] = useState<string>("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatusAndQRCode = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setLoading(true);
    try {
      const res = await getWhatsAppStatus();
      
      if (res.state === "open" || res.state === "CONNECTED") {
        setStatus("CONNECTED");
        setQrCode(null);
        setMessage("");
      } else {
        // Se estiver desconectado ou conectando, tenta buscar o QR Code automaticamente
        const qrRes = await generateWhatsAppQRCode();
        if (qrRes.success && qrRes.qrCode) {
          setQrCode(qrRes.qrCode);
          setStatus("QR_CODE_READY");
          setMessage("");
        } else {
          setStatus(res.state || "DISCONNECTED");
          if (qrRes.error) setMessage(qrRes.error);
        }
      }
    } catch (err) {
      setStatus("ERROR");
      setMessage("Erro inesperado ao consultar Evolution API.");
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
        setMessage(res.error || "Erro ao gerar QR Code");
      }
    } catch (err) {
      setMessage("Erro inesperado ao solicitar QR Code.");
    } finally {
      setLoading(false);
    }
  };

  // Carregamento inicial
  useEffect(() => {
    checkStatusAndQRCode();
  }, [checkStatusAndQRCode]);

  // Polling a cada 5 segundos enquanto o QR Code estiver visível para detectar quando o usuário escanear
  useEffect(() => {
    if (status !== "QR_CODE_READY") return;

    const interval = setInterval(async () => {
      try {
        const res = await getWhatsAppStatus();
        if (res.state === "open" || res.state === "CONNECTED") {
          setStatus("CONNECTED");
          setQrCode(null);
          setMessage("");
        }
      } catch (err) {
        // Silencioso no polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-zinc-900">Status da Conexão</h2>
        <Button variant="outline" size="sm" onClick={() => checkStatusAndQRCode(true)} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {loading && !qrCode && status === "LOADING" ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 text-zinc-400"
          >
            <Loader2 className="w-10 h-10 animate-spin text-zinc-500 mb-3" />
            <p className="text-sm font-medium text-zinc-600">Verificando status com Evolution API...</p>
          </motion.div>
        ) : status === "open" || status === "CONNECTED" ? (
          <motion.div 
            key="connected"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 bg-green-50 border border-green-200 rounded-lg text-green-700"
          >
            <CheckCircle2 className="w-16 h-16 mb-4 text-green-500" />
            <h3 className="text-xl font-bold mb-2">WhatsApp Conectado!</h3>
            <p className="text-center text-green-600 max-w-md">
              Seu celular está corretamente pareado com a Evolution API. O disparo automático de mensagens e lembretes funcionará perfeitamente.
            </p>
          </motion.div>
        ) : qrCode ? (
          <motion.div 
            key="qrcode"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-8 border border-zinc-200 rounded-lg bg-zinc-50/50"
          >
            <h3 className="text-xl font-bold mb-2 text-zinc-900">Escaneie o QR Code</h3>
            <p className="text-center text-zinc-500 mb-6 max-w-md text-sm">
              Abra o WhatsApp no seu celular, acesse <strong>Aparelhos Conectados</strong> e aponte a câmera para o código abaixo.
            </p>
            
            <div className="bg-white p-4 rounded-xl border-4 border-zinc-100 shadow-lg relative">
              <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
            </div>

            <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              <span>Aguardando leitura pelo aplicativo do WhatsApp...</span>
            </div>

            <Button className="mt-6" variant="outline" onClick={() => checkStatusAndQRCode(true)} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Já escaneei (Verificar Status)
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            key="disconnected"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            <XCircle className="w-16 h-16 mb-4 text-red-500" />
            <h3 className="text-xl font-bold mb-2">WhatsApp Desconectado</h3>
            <p className="text-center text-red-600 max-w-md mb-6">
              {message || "O sistema não conseguiu se conectar à Evolution API ou o aparelho foi desconectado."}
            </p>
            <Button onClick={requestQRCode} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
              Gerar QR Code para Reconectar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
