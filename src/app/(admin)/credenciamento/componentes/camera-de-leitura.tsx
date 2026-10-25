import type { RefObject } from "react";
import { X } from "lucide-react";
import { Esqueleto } from "@/components/ui/skeleton";

interface PropriedadesDaCamera {
  video: RefObject<HTMLVideoElement | null>;
  pronta: boolean;
  aoTocar: () => void;
  aoCancelar: () => void;
}

export function CameraDeLeitura({ video, pronta, aoTocar, aoCancelar }: PropriedadesDaCamera) {
  return (
    <div data-liz-hide className="flex flex-col overflow-hidden rounded-2xl bg-[#1b1620]">
      <div className="relative flex min-h-80 items-center justify-center">
        <video ref={video} onPlaying={aoTocar} className="absolute inset-0 size-full object-cover" playsInline autoPlay muted aria-label="Câmera para ler o código QR" />
        {!pronta && (
          <div role="status" className="absolute inset-0">
            <span className="sr-only">Abrindo a câmera...</span>
            <Esqueleto className="size-full rounded-none bg-[#2a2330]" />
          </div>
        )}
        <div aria-hidden="true" className="relative size-56 rounded-3xl border-[3px] border-[#ffffff] shadow-[0_0_0_999px_rgba(27,22,32,0.45)]">
          <div className="absolute inset-x-4 top-1/2 h-0.5 bg-petala" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 px-4 py-5">
        <p className="text-base text-[#ffffff]">Aponte para o código QR do convidado</p>
        <button type="button" onClick={aoCancelar} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#ffffff] px-4 font-semibold text-[#ffffff] hover:bg-[#fff]/10">
          <X className="size-4" aria-hidden="true" />
          Cancelar leitura
        </button>
      </div>
    </div>
  );
}
