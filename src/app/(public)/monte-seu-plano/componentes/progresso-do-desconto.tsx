import { cn } from "@/lib/utils";

const DEGRAUS = [
  { itens: 3, percent: 15 },
  { itens: 5, percent: 25 },
];

/** Barra com os dois degraus de desconto (3 e 5 recursos pagos) e o que falta para o próximo. */
export function ProgressoDoDesconto({ pagos }: { pagos: number }) {
  const proximo = DEGRAUS.find((d) => pagos < d.itens);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < pagos ? "bg-ameixa" : "bg-linha")} />
        ))}
      </div>
      <p className="text-sm text-tinta-suave">
        {proximo
          ? `${proximo.itens - pagos === 1 ? "Mais 1 recurso" : `Mais ${proximo.itens - pagos} recursos`} e o desconto sobe para ${proximo.percent}%.`
          : "Desconto máximo de 25% aplicado."}
      </p>
    </div>
  );
}
