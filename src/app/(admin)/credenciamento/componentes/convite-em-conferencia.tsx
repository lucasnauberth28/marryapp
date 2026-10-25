import { Esqueleto } from "@/components/ui/skeleton";
import { estiloDoCartao } from "@/components/painel/styles";

/** Esqueleto do convite lido: selo, situação, nome, pessoas e mesa, botões. */
export function ConviteEmConferencia() {
  return (
    <section role="status" aria-busy="true" className={`${estiloDoCartao} flex flex-col items-center gap-4 p-6 text-center`}>
      <span className="sr-only">Conferindo o convite...</span>
      <Esqueleto className="size-24 rounded-full" />
      <Esqueleto className="h-7 w-36 rounded-lg" />
      <Esqueleto className="h-10 w-56 max-w-full rounded-lg" />
      <div aria-hidden="true" className="grid w-full grid-cols-2 gap-3 rounded-2xl border border-linha p-4">
        <Esqueleto className="h-[60px] rounded-lg" />
        <Esqueleto className="h-[60px] rounded-lg" />
      </div>
      <Esqueleto className="h-11 w-full rounded-xl" />
      <Esqueleto className="h-11 w-full rounded-xl" />
    </section>
  );
}
