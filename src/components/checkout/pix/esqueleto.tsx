import { RegiaoDeCarregamento } from "@/components/skeletons";
import { Esqueleto } from "@/components/ui/skeleton";

/** Esqueleto do cartão do Pix (preço, QR, validade, botão de copiar e "Já paguei"): nada pula quando o código chega. */
export function EsqueletoDoPix() {
  return (
    <RegiaoDeCarregamento label="o código do Pix" className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-5 rounded-[16px] border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-1)]">
        <div className="flex w-full items-center justify-between gap-3">
          <Esqueleto className="h-5 w-32 rounded-md" />
          <Esqueleto className="h-9 w-28 rounded-lg" />
        </div>
        <Esqueleto className="size-[218px] rounded-[12px]" />
        <Esqueleto className="h-5 w-32 rounded-md" />
        <Esqueleto className="h-11 w-full rounded-[12px]" />
        <div className="flex w-full flex-col items-center gap-1">
          <Esqueleto className="h-4 w-full rounded-md" />
          <Esqueleto className="h-4 w-2/3 rounded-md" />
        </div>
      </div>
      <Esqueleto className="h-12 w-full rounded-[12px]" />
    </RegiaoDeCarregamento>
  );
}
