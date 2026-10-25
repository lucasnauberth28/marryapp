import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Hourglass, Lock } from "lucide-react";
import { AreaDeTexto } from "@/components/ui/textarea";
import { Esqueleto } from "@/components/ui/skeleton";
import { MolduraDoQr } from "@/components/ui/qr-frame";
import { CORES_DO_QR } from "@/lib/qr-colors";
import { estiloDoBotao } from "@/components/landing/styles";
import { cn } from "@/lib/utils";
import { ESTILO_DO_SOBRETITULO, ESTILO_DO_TITULO, type PropriedadesDoPasso } from "./tipos";
import type { PixGerado } from "./use-dados-do-pagamento";

function CodigoCopiavel({ pix }: { pix: PixGerado }) {
  if (pix.payload === "") return <Esqueleto className="h-[62px] w-full rounded-[12px] sm:h-[54px]" />;
  return (
    <div className="flex w-full items-center gap-2 rounded-[12px] border border-linha-forte py-2 pl-3 pr-2">
      <code className="min-w-0 flex-1 truncate text-left font-mono text-sm">{pix.payload}</code>
      <button type="button" onClick={pix.copiar} aria-label={pix.copied ? "Código copiado" : "Copiar código Pix"} className={cn(estiloDoBotao.primary, estiloDoBotao.sm, "shrink-0")}>
        {pix.copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
        {pix.copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

function CartaoDoPix({ pix }: { pix: PixGerado }) {
  const gerando = pix.payload === "";
  return (
    <section aria-label="Pix" aria-busy={gerando || undefined} className="flex flex-col items-center gap-3 rounded-[16px] border border-linha bg-papel p-6 text-center shadow-[var(--shadow-aceito-1)]">
      <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-aviso-suave px-3 text-sm font-semibold text-aviso">
        <Hourglass aria-hidden="true" className="size-4" strokeWidth={2} />
        {gerando ? "Gerando o código" : "Aguardando pagamento"}
      </span>
      {gerando ? <span role="status" className="sr-only">Gerando o código do Pix...</span> : null}
      <MolduraDoQr className="p-3">
        {gerando ? <Esqueleto className="size-[200px] rounded-lg" /> : <QRCodeSVG value={pix.payload} size={200} {...CORES_DO_QR} marginSize={2} role="img" aria-label="QR Code do Pix" />}
      </MolduraDoQr>
      <p className="text-sm text-tinta-suave">No celular, copie o código e cole no app do seu banco, na opção Pix copia e cola. No computador, escaneie o QR Code com o celular.</p>
      <CodigoCopiavel pix={pix} />
      <p className="min-h-5 text-sm font-semibold text-sucesso" role="status" aria-live="polite">
        {pix.copied ? "Agora é só colar no app do seu banco." : ""}
      </p>
      {pix.copyFailed && (
        <AreaDeTexto
          id="checkout-pix-codigo"
          label="Código Pix"
          hint="Não deu para copiar sozinho. Selecione o código e copie."
          fieldClassName="w-full text-left"
          readOnly
          value={pix.payload}
          rows={4}
          onFocus={(e) => e.currentTarget.select()}
          inputClassName="resize-none font-mono text-xs"
        />
      )}
    </section>
  );
}

function AvisoDepoisDePagar({ pix, aoAvisar }: { pix: PixGerado; aoAvisar: () => void }) {
  if (pix.payload === "") {
    return (
      <div aria-hidden="true" className="flex flex-col gap-2">
        <Esqueleto className="h-4 w-full rounded-md" />
        <Esqueleto className="h-4 w-2/3 rounded-md" />
      </div>
    );
  }
  if (pix.estatico) {
    return (
      <div className="flex flex-col gap-3 rounded-[16px] border border-linha bg-areia p-4 text-sm text-tinta">
        <div>
          <p className="font-semibold">Depois de pagar, é só avisar aqui.</p>
          <p className="mt-1 text-tinta-suave">Os noivos conferem o Pix no extrato e confirmam o presente. Não precisa esperar nesta tela.</p>
        </div>
        <button type="button" onClick={aoAvisar} className={cn(estiloDoBotao.primary, estiloDoBotao.block, "min-h-12")}>
          Já fiz o Pix
        </button>
      </div>
    );
  }
  return (
    <p className="flex gap-2 text-sm text-tinta-suave">
      <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.6} />
      Quando o pagamento cair, esta tela muda sozinha e os noivos são avisados.
    </p>
  );
}

interface Propriedades extends PropriedadesDoPasso {
  pix: PixGerado;
  aoAvisar: () => void;
  aoVoltar: () => void;
}

export function PassoDoPix({ titulo, pix, aoAvisar, aoVoltar }: Propriedades) {
  return (
    <div className="step-in flex flex-col gap-4 pt-2">
      <div className="flex flex-col gap-2">
        <p className={ESTILO_DO_SOBRETITULO}>Passo 3 de 3</p>
        <h2 ref={titulo} tabIndex={-1} className={ESTILO_DO_TITULO}>
          Faça o Pix
        </h2>
      </div>
      <CartaoDoPix pix={pix} />
      <AvisoDepoisDePagar pix={pix} aoAvisar={aoAvisar} />
      <button type="button" onClick={aoVoltar} disabled={pix.payload === ""} className={cn(estiloDoBotao.quiet, "self-start")}>
        Voltar
      </button>
    </div>
  );
}
