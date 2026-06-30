"use client";

import { useState, useEffect } from "react";
import { getWhatsAppStatus, generateWhatsAppQRCode } from "@/actions/evolution-actions";
import { Button } from "@/components/ui/button";
import { RefreshCw, QrCode, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function WhatsAppConfigClient() {
  const [status, setStatus] = useState<string>("LOADING");
  const [message, setMessage] = useState<string>("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    setQrCode(null);
    try {
      const res = await getWhatsAppStatus();
      setStatus(res.state);
      if (res.message) setMessage(res.message);
    } catch (err) {
      setStatus("ERROR");
    } finally {
      setLoading(false);
    }
  };

  const requestQRCode = async () => {
    setLoading(true);
    try {
      const res = await generateWhatsAppQRCode();
      if (res.success && res.qrCode) {
        setQrCode(res.qrCode);
        setStatus("QR_CODE_READY");
      } else {
        setMessage(res.error || "Erro ao gerar QR Code");
      }
    } catch (err) {
      setMessage("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-zinc-900">Status da Conexão</h2>
        <Button variant="outline" size="sm" onClick={checkStatus} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {loading && status === "LOADING" ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center p-12 text-zinc-400"
          >
            <RefreshCw className="w-8 h-8 animate-spin" />
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
            className="flex flex-col items-center justify-center p-8 border border-zinc-200 rounded-lg"
          >
            <h3 className="text-xl font-bold mb-4 text-zinc-900">Escaneie o QR Code</h3>
            <p className="text-center text-zinc-500 mb-6 max-w-md">
              Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e aponte a câmera para o código abaixo.
            </p>
            <div className="bg-white p-4 rounded-xl border-4 border-zinc-100 shadow-md">
              <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
            </div>
            <Button className="mt-6" onClick={checkStatus}>
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
            <Button onClick={requestQRCode} className="bg-red-600 hover:bg-red-700 text-white">
              <QrCode className="w-4 h-4 mr-2" />
              Gerar QR Code para Reconectar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
