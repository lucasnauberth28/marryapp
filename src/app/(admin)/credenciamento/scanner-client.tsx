"use client";

import { useState, useRef, useCallback } from "react";
import { checkInGuest } from "@/actions/guest-actions";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";
import { Camera, StopCircle, CheckCircle2, XCircle, Loader2, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ScannerClient() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const startScanning = async () => {
    setScanning(true);
    setResult(null);
    try {
      const codeReader = new BrowserQRCodeReader();
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      
      // Tenta usar a câmera traseira do celular se disponível
      const selectedDeviceId = videoInputDevices.find(device => device.label.toLowerCase().includes("back"))?.deviceId 
                            || videoInputDevices[0]?.deviceId;

      if (!selectedDeviceId) {
        setResult({ type: "error", message: "Nenhuma câmera encontrada." });
        setScanning(false);
        return;
      }

      const controls = await codeReader.decodeFromVideoDevice(
        selectedDeviceId, 
        videoRef.current!, 
        async (res, error, controls) => {
          if (res) {
            controls.stop();
            controlsRef.current = null;
            setScanning(false);
            handleScannedCode(res.getText());
          }
        }
      );
      
      controlsRef.current = controls;
    } catch (err) {
      console.error(err);
      setResult({ type: "error", message: "Permissão de câmera negada ou erro no leitor." });
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setScanning(false);
  };

  const handleScannedCode = async (text: string) => {
    if (!text.startsWith("GUEST:")) {
      setResult({ type: "error", message: "QR Code Inválido. Não pertence ao MarryApp." });
      return;
    }

    const guestId = text.replace("GUEST:", "");
    setLoading(true);
    
    try {
      const res = await checkInGuest(guestId);
      if (res.success) {
        setResult({ type: "success", message: `Check-in realizado: ${res.guestName}!` });
      } else {
        setResult({ type: "error", message: res.error || "Erro ao realizar check-in." });
      }
    } catch (err) {
      setResult({ type: "error", message: "Erro de rede ao validar QR Code." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 text-zinc-400"
          >
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-emerald-500" />
            <p>Validando ingresso...</p>
          </motion.div>
        )}

        {!loading && scanning && (
          <motion.div 
            key="scanner"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full"
          >
            <div className="relative w-full max-w-sm rounded-xl overflow-hidden border-4 border-zinc-200 shadow-lg">
              <video ref={videoRef} className="w-full object-cover" />
              {/* Moldura do Scanner */}
              <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none">
                <div className="w-full h-full border-2 border-emerald-400 opacity-50 relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400" />
                </div>
              </div>
            </div>
            
            <Button onClick={stopScanning} variant="destructive" className="mt-6 w-full max-w-sm">
              <StopCircle className="w-4 h-4 mr-2" /> Cancelar Leitura
            </Button>
          </motion.div>
        )}

        {!loading && !scanning && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center max-w-md w-full"
          >
            {result && (
              <div className={`w-full p-6 mb-8 rounded-xl border ${result.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {result.type === 'success' ? <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" /> : <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />}
                <p className="font-semibold text-lg">{result.message}</p>
              </div>
            )}

            <div className="bg-zinc-50 p-8 rounded-full mb-6 text-zinc-400 border border-zinc-100">
              <Camera className="w-16 h-16" />
            </div>
            <h3 className="text-xl font-bold mb-2">Pronto para Ler</h3>
            <p className="text-zinc-500 mb-8">
              Aproxime o QR Code do convite da câmera.
            </p>

            <Button onClick={startScanning} className="w-full max-w-sm bg-zinc-900 hover:bg-zinc-800 h-14 text-lg">
              <QrCode className="w-5 h-5 mr-2" />
              Iniciar Leitura de QR Code
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
