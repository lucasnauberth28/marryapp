import Link from "next/link";
import { ArrowLeft, CalendarDays, Lock, MapPin } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { LINK_DO_PLANO, LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL } from "../../../../_lib/planos-do-fornecedor";
import { ESTILO_DO_BOTAO_PRIMARIO, ESTILO_DO_CARTAO, ESTILO_DO_SOBRETITULO } from "./estilos";

interface PropriedadesDoPedidoBloqueado {
  firstName: string;
  date: string | null;
  location: string | null;
  arrived: string;
}

export function VoltarAosPedidos() {
  return (
    <Link href="/fornecedor" className="-ml-3 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-3 text-[15px] font-semibold text-tinta-suave transition-colors hover:bg-areia hover:text-tinta">
      <ArrowLeft aria-hidden="true" className="size-4" />
      Todos os pedidos
    </Link>
  );
}

/** Pedido além do limite do Plano Start: só primeiro nome, data e cidade. */
export function PedidoBloqueado({ firstName, date, location, arrived }: PropriedadesDoPedidoBloqueado) {
  return (
    <div className="flex flex-col gap-6">
      <Aparicao variant="fade" className="flex flex-col gap-4">
        <VoltarAosPedidos />
        <div className="flex min-w-0 flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-areia px-2.5 py-1 text-[13px] leading-4 font-semibold text-tinta">
            <Lock aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
            Bloqueado <span className="font-medium">· {arrived}</span>
          </span>
          <h1 className="font-display text-[34px] leading-10 font-medium break-words md:text-[44px] md:leading-[50px]">{firstName}</h1>
        </div>
      </Aparicao>
      <Aparicao variant="up" delay={80}>
        <section aria-labelledby="bloqueado-titulo" className={cn(ESTILO_DO_CARTAO, "flex max-w-2xl flex-col gap-4")}>
          <h2 id="bloqueado-titulo" className="text-lg font-semibold">
            Pedido bloqueado pelo Plano Start
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-0.5">
              <dt className={cn(ESTILO_DO_SOBRETITULO, "flex items-center gap-1.5")}>
                <CalendarDays aria-hidden="true" className="size-3.5" />
                Data
              </dt>
              <dd className="text-base font-semibold sm:text-[17px]">{date ?? "A definir"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className={cn(ESTILO_DO_SOBRETITULO, "flex items-center gap-1.5")}>
                <MapPin aria-hidden="true" className="size-3.5" />
                Cidade
              </dt>
              <dd className="text-base font-semibold sm:text-[17px]">{location ?? "Não informada"}</dd>
            </div>
          </dl>
          <p className="text-tinta-suave">
            Este casal pediu orçamento depois dos {LIMITE_MENSAL_DE_PEDIDOS_DO_PLANO_INICIAL} pedidos do mês do Plano Start. Assine o Pro para ver o nome completo, o WhatsApp, o e-mail e a mensagem, e para responder ao pedido.
          </p>
          <Link href={LINK_DO_PLANO} className={cn(ESTILO_DO_BOTAO_PRIMARIO, "w-full sm:w-fit")}>
            <Lock aria-hidden="true" className="size-[18px]" />
            Desbloquear com o Pro
          </Link>
        </section>
      </Aparicao>
    </div>
  );
}
