import Link from "next/link";
import { Mail } from "lucide-react";

/** Quem ainda não confirmou o e-mail vê um aviso discreto no topo do Resumo, com o caminho para pedir o link. */
export function AvisoDeEmailNaoConfirmado() {
  return (
    <p role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[12px] border border-linha bg-areia px-4 py-3 text-[15px] leading-6 text-tinta">
      <Mail aria-hidden="true" className="size-[18px] shrink-0 text-tinta-suave" strokeWidth={1.6} />
      Falta confirmar seu e-mail. Mandamos um link quando vocês criaram a conta.
      <Link href="/conta#email" className="font-semibold text-ameixa underline decoration-ameixa/30 underline-offset-4 hover:decoration-ameixa">
        Reenviar o link
      </Link>
    </p>
  );
}
