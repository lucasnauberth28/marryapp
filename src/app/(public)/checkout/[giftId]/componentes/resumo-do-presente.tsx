import { ImagemDaPessoa } from "@/components/ui/user-image";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { PresenteLocal as Gift } from "@/types/local";

export function ResumoDoPresente({ gift, coupleNames }: { gift: Gift; coupleNames: string }) {
  return (
    <>
      <div className="flex items-center gap-3 rounded-[16px] border border-linha bg-papel p-3 shadow-[var(--shadow-aceito-1)]">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-[12px] bg-areia">
          {gift.imageUrl ? <ImagemDaPessoa src={gift.imageUrl} alt="" sizes="56px" className="object-cover" /> : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <strong className="font-semibold leading-6">{gift.title}</strong>
          <span className="truncate text-sm leading-5 text-tinta-suave">Para {coupleNames}</span>
        </div>
        <span className="font-num text-2xl leading-8 tabular-nums">{formatarReais(gift.amount)}</span>
      </div>
      <p className="text-sm leading-5 text-tinta-suave">Este presente representa um valor em dinheiro para o casal.</p>
    </>
  );
}
