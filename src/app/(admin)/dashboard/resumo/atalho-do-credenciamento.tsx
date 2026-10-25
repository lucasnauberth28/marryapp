import Link from "next/link";
import { ChevronRight, QrCode } from "lucide-react";

/** Na semana do casamento: atalho para o leitor de código QR na entrada da festa. */
export function AtalhoDoCredenciamento() {
  return (
    <Link href="/credenciamento" className="flex items-center justify-between gap-4 rounded-[12px] border border-ameixa/30 bg-ameixa-suave p-5 text-tinta">
      <span className="flex items-center gap-3">
        <QrCode className="h-6 w-6 text-ameixa" aria-hidden="true" />
        <span>
          <span className="block font-semibold">Registro de entrada dos convidados</span>
          <span className="text-sm text-tinta-suave">Abra o leitor de código QR na entrada da festa.</span>
        </span>
      </span>
      <ChevronRight className="h-5 w-5 text-ameixa" aria-hidden="true" />
    </Link>
  );
}
