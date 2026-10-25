"use client";

import { useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CustomModal } from "@/components/ui/custom-modal";
import { Button } from "@/components/ui/button";
import { QrFrame } from "@/components/ui/qr-frame";
import { CORES_DO_QR } from "@/lib/qr-colors";
import { LoadingRegion, SkeletonImage } from "@/components/skeletons";
import { reconnectWhatsapp } from "@/actions/admin-saude-actions";

/** "Reconectar": gera o QR Code do WhatsApp para parear de novo. Depois de ler, a página precisa ser atualizada. */
export function ReconnectWhatsapp() {
  const [pending, startTransition] = useTransition();
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function start() {
    setError(null);
    setQr(null);
    setOpen(true);
    startTransition(async () => {
      try {
        const res = await reconnectWhatsapp();
        if (res.success) setQr(res.qrCode);
        else setError(res.error);
      } catch {
        setError("Não foi possível concluir agora. Tente de novo.");
      }
    });
  }

  return (
    <>
      <Button type="button" variant="quiet" size="sm" onClick={start} loading={pending}>
        Reconectar
      </Button>
      <CustomModal isOpen={open} onClose={() => setOpen(false)} title="Reconectar o WhatsApp" description="No celular do número do Aceito: WhatsApp, Aparelhos conectados, Conectar um aparelho. Aponte a câmera para o código.">
        <div className="flex min-h-64 flex-col items-center justify-center gap-3">
          {pending && (
            <LoadingRegion label="o código">
              <SkeletonImage ratio={1} className="size-60 rounded-xl" />
            </LoadingRegion>
          )}
          {error && (
            <p role="alert" className="text-sm font-semibold text-perigo">
              {error}
            </p>
          )}
          {qr &&
            (qr.startsWith("data:image") ? (
              <QrFrame className="p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR Code para conectar o WhatsApp" className="h-60 w-60 object-contain" />
              </QrFrame>
            ) : (
              <QrFrame className="p-3">
                <QRCodeSVG value={qr} size={240} {...CORES_DO_QR} marginSize={2} aria-label="QR Code para conectar o WhatsApp" />
              </QrFrame>
            ))}
          {qr && <p className="text-center text-sm text-tinta-suave">O código vale por pouco tempo. Depois de conectar, atualize esta página.</p>}
        </div>
      </CustomModal>
    </>
  );
}
