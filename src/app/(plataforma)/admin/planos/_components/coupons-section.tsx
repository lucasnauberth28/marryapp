"use client";

import { Plus, TicketPercent } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormularioDeCupom } from "../_cupons/formulario";
import { CartoesDeCupons, TabelaDeCupons } from "../_cupons/lista";
import { ESTILO_DO_BOTAO, type EscolhaDePlano, type LinhaDeCupom } from "../_cupons/tipos";
import { useCupons } from "../_cupons/use-cupons";

export type { LinhaDeCupom };

export function SecaoDeCupons({ coupons, plans }: { coupons: LinhaDeCupom[]; plans: EscolhaDePlano[] }) {
  const estado = useCupons();
  const planLabel = (id: string) => plans.find((p) => p.id === id)?.label ?? id;

  return (
    <section aria-labelledby="cupons-titulo" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="cupons-titulo" className="text-xl font-semibold text-tinta">
            Cupons
          </h2>
          <p className="text-sm text-tinta-suave">O uso só conta quando o Pix é confirmado. Nenhuma cobrança fica abaixo de R$ 1,00.</p>
        </div>
        {estado.editing === null ? (
          <button type="button" onClick={() => estado.open("new")} className={cn(ESTILO_DO_BOTAO, "bg-ameixa text-on-ameixa hover:bg-ameixa-hover")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo cupom
          </button>
        ) : null}
      </div>

      {estado.editing !== null ? <FormularioDeCupom estado={estado} plans={plans} /> : null}

      {coupons.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-linha bg-linho p-5 text-[15px] text-tinta-suave">
          <TicketPercent className="h-5 w-5 shrink-0" aria-hidden="true" />
          Nenhum cupom ainda. Crie um para oferecer desconto no Pix dos planos.
        </div>
      ) : (
        <>
          <TabelaDeCupons coupons={coupons} estado={estado} planLabel={planLabel} />
          <CartoesDeCupons coupons={coupons} estado={estado} planLabel={planLabel} />
        </>
      )}
    </section>
  );
}
