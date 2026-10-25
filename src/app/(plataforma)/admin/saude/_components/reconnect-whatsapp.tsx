"use client";

import { useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { Botao } from "@/components/ui/button";
import { MolduraDoQr } from "@/components/ui/qr-frame";
import { CORES_DO_QR } from "@/lib/qr-colors";
import { RegiaoDeCarregamento, EsqueletoDeImagem } from "@/components/skeletons";
import { reconectarWhatsapp } from "@/actions/admin-saude-actions";

/** "Reconectar": gera o QR Code do WhatsApp para parear de novo. Depois de ler, a página precisa ser atualizada. */
export function ReconectarWhatsapp() {
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
        const res = await reconectarWhatsapp();
        if (res.success) setQr(res.qrCode);
        else setError(res.error);
      } catch {
        setError("Não foi possível concluir agora. Tente de novo.");
      }
    });
  }

  return (
    <>
      <Botao type="button" variant="quiet" size="sm" onClick={start} loading={pending}>
        Reconectar
      </Botao>
      <ModalPersonalizado isOpen={open} onClose={() => setOpen(false)} title="Reconectar o WhatsApp" description="No celular do número do Aceito: WhatsApp, Aparelhos conectados, Conectar um aparelho. Aponte a câmera para o código.">
        <div className="flex min-h-64 flex-col items-center justify-center gap-3">
          {pending && (
            <RegiaoDeCarregamento label="o código">
              <EsqueletoDeImagem ratio={1} className="size-60 rounded-xl" />
            </RegiaoDeCarregamento>
          )}
          {error && (
            <p role="alert" className="text-sm font-semibold text-perigo">
              {error}
            </p>
          )}
          {qr &&
            (qr.startsWith("data:image") ? (
              <MolduraDoQr className="p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR Code para conectar o WhatsApp" className="h-60 w-60 object-contain" />
              </MolduraDoQr>
            ) : (
              <MolduraDoQr className="p-3">
                <QRCodeSVG value={qr} size={240} {...CORES_DO_QR} marginSize={2} aria-label="QR Code para conectar o WhatsApp" />
              </MolduraDoQr>
            ))}
          {qr && <p className="text-center text-sm text-tinta-suave">O código vale por pouco tempo. Depois de conectar, atualize esta página.</p>}
        </div>
      </ModalPersonalizado>
    </>
  );
}
