import { AlertCircle } from "lucide-react";
import { estiloDoCartao, estiloDoTituloDoCartao } from "@/components/casal/ui";
import { Botao } from "@/components/ui/button";
import { TEXTO_DOS_TERMOS_DE_DOMINIO } from "@/lib/domain-terms";
import { cn } from "@/lib/utils";
import { AceiteDosTermos } from "./aceite-dos-termos";
import { SecaoDoEndereco } from "./secao-do-endereco";
import { SecaoDoTitular } from "./secao-do-titular";
import { usePedidoDeDominio } from "./use-pedido-de-dominio";

interface PropriedadesDoFormularioDoPedido {
  coupleNames: string;
  weddingDate: string | null;
  defaults: { name: string; email: string };
}

export function FormularioDoPedido({ coupleNames, weddingDate, defaults }: PropriedadesDoFormularioDoPedido) {
  const pedido = usePedidoDeDominio(defaults);
  const bloqueado = pedido.check.state === "taken" || pedido.check.state === "releasing";
  return (
    <form onSubmit={pedido.enviar} noValidate className="flex flex-col gap-6">
      <SecaoDoEndereco pedido={pedido} coupleNames={coupleNames} weddingDate={weddingDate} />
      <SecaoDoTitular pedido={pedido} />
      <section aria-labelledby="dominio-condicoes" className={cn(estiloDoCartao, "flex flex-col gap-4 p-5 sm:p-6")}>
        <h2 id="dominio-condicoes" className={estiloDoTituloDoCartao}>
          Condições
        </h2>
        <p className="rounded-xl bg-areia p-4 text-[15px] leading-6 text-tinta">{TEXTO_DOS_TERMOS_DE_DOMINIO}</p>
        <AceiteDosTermos pedido={pedido} />
        {pedido.formError ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {pedido.formError}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-tinta-suave">{bloqueado ? "Escolham outro nome para continuar." : "Depois do pedido, acompanhem cada etapa aqui."}</p>
          <Botao type="submit" size="lg" loading={pedido.pending} disabled={bloqueado} className="w-full sm:w-auto">
            Pedir este endereço
          </Botao>
        </div>
      </section>
    </form>
  );
}
