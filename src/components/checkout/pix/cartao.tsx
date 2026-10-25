import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { MolduraDoQr } from "@/components/ui/qr-frame";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { CORES_DO_QR } from "@/lib/qr-colors";
import { cn } from "@/lib/utils";
import type { CobrancaDoPix } from "./use-cobranca";

interface Propriedades {
  planName: string;
  charge: CobrancaDoPix;
  expired: boolean;
  secondsLeft: number;
  copied: boolean;
  isPending: boolean;
  aoCopiar: () => void;
  aoGerarNovo: () => void;
}

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** O cartão do Pix: preço, QR Code, contagem da validade, copia e cola (ou novo código, se expirou). */
export function CartaoDoPix({ planName, charge, expired, secondsLeft, copied, isPending, aoCopiar, aoGerarNovo }: Propriedades) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
      <div className="flex w-full items-baseline justify-between gap-3">
        <p className="font-semibold text-tinta">{planName}</p>
        <p className="font-num text-3xl text-tinta">{formatarReais(charge.amount)}</p>
      </div>
      <MolduraDoQr className={cn("transition-opacity", expired && "opacity-30")}>
        <QRCodeSVG value={charge.payload} size={184} {...CORES_DO_QR} marginSize={2} aria-label="QR Code do Pix" role="img" />
      </MolduraDoQr>
      <p aria-live="polite" className={cn("text-sm font-semibold tabular-nums", expired ? "text-perigo" : "text-tinta-suave")}>
        {expired ? "O código expirou." : `Válido por ${doisDigitos(Math.floor(secondsLeft / 60))}:${doisDigitos(secondsLeft % 60)}`}
      </p>
      {expired ? (
        <Botao type="button" variant="outline" loading={isPending} onClick={aoGerarNovo} className="w-full rounded-[12px]">
          <RefreshCw aria-hidden="true" className="size-4" /> Gerar novo código
        </Botao>
      ) : (
        <button type="button" onClick={aoCopiar} className={cn(estiloDoBotao.secondary, estiloDoBotao.block)}>
          {copied ? <Check aria-hidden="true" className="size-4 text-sucesso" /> : <Copy aria-hidden="true" className="size-4" />}
          {copied ? "Código copiado" : "Copiar código Pix"}
        </button>
      )}
      <p className="text-center text-sm leading-5 text-tinta-suave">
        Abra o app do banco, escolha Pix copia e cola e cole o código.
        {charge.isDynamic ? " Conferimos o pagamento sozinhos." : null}
      </p>
    </div>
  );
}
