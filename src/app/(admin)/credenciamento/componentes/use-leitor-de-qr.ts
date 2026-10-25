// A câmera que lê o código QR do convite. Desliga ao sair da tela.
import { useEffect, useRef, useState, type RefObject } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

const MENSAGEM_SEM_CAMERA = "Não deu para abrir a câmera. Libere o acesso à câmera no navegador ou busque pelo nome.";
const CONSTRAINTS: MediaStreamConstraints = { video: { facingMode: { ideal: "environment" } } };

/** Pede a permissão da câmera antes de ligar o leitor; recusar não impede a tentativa. */
async function pedirPermissaoDaCamera() {
  if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
    stream.getTracks().forEach((track) => track.stop());
  } catch (permErr) {
    console.warn("Media devices permission request:", permErr);
  }
}

export function useLeitorDeQr(video: RefObject<HTMLVideoElement | null>, aoLer: (texto: string) => void, aoFalhar: (mensagem: string) => void) {
  // A câmera demora a abrir (pede permissão e liga o leitor): até o vídeo tocar, o quadro mostra um esqueleto
  const [cameraReady, setCameraReady] = useState(false);
  const controls = useRef<IScannerControls | null>(null);

  const parar = () => {
    controls.current?.stop();
    controls.current = null;
  };
  useEffect(() => parar, []);

  const iniciar = async () => {
    setCameraReady(false);
    try {
      await pedirPermissaoDaCamera();
      // Espera o vídeo entrar na tela antes de ligar o leitor
      await new Promise((resolve) => requestAnimationFrame(resolve));
      controls.current = await new BrowserQRCodeReader().decodeFromConstraints(CONSTRAINTS, video.current!, async (res, _error, ctrl) => {
        if (!res) return;
        ctrl.stop();
        controls.current = null;
        aoLer(res.getText());
      });
    } catch (err) {
      console.error(err);
      aoFalhar(MENSAGEM_SEM_CAMERA);
    }
  };

  return { cameraReady, setCameraReady, iniciar, parar };
}
