import Link from "next/link";
import { Clock, Receipt } from "lucide-react";
import { formatarReaisSemSinal } from "@/lib/resumo/dinheiro";
import { rotuloCurtoDoDia } from "@/lib/resumo/datas";
import type { Orcamento } from "@/lib/resumo/orcamento";
import { BlocoDoPainel, Etiqueta, LinkDeTexto, MedidorDeProgresso, ValorEmDinheiro, classeDaDica, classeDoRotulo, estiloDoBotaoSecundario } from "../ui";

type DespesaProxima = Orcamento["upcoming"][number];

function SemDespesas({ canOpen }: { canOpen: boolean }) {
  return (
    <div className="grid max-w-[60ch] gap-1.5">
      <b className="text-[15px] text-tinta">Nenhuma despesa anotada</b>
      <p className="text-pretty text-tinta-suave">Anotem o que já contrataram (buffet, fotografia, vestido) para saber quanto já pagaram e quanto falta.</p>
      {canOpen && (
        <div className="mt-2">
          <Link href="/financas" className={estiloDoBotaoSecundario}>
            <Receipt className="size-[17px]" aria-hidden="true" />
            Adicionar despesa
          </Link>
        </div>
      )}
    </div>
  );
}

function ResumoDoPago({ budget }: { budget: Orcamento }) {
  return (
    <div className="grid gap-2">
      <span className={classeDoRotulo}>Pago até agora</span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <ValorEmDinheiro cents={budget.paidCents} className="text-[28px] leading-[1.1]" />
        <span className="text-[15px] font-medium text-tinta-suave tabular-nums">de {formatarReaisSemSinal(budget.totalCents)}</span>
      </span>
      <MedidorDeProgresso
        label={`${budget.pct}% das despesas pagas`}
        segments={[
          { value: budget.paidCents, className: "bg-ameixa" },
          { value: budget.leftCents, className: "bg-areia" },
        ]}
      />
      <span className={classeDaDica}>
        <b className="font-semibold tabular-nums text-tinta">{budget.pct}%</b> pago · faltam <b className="font-semibold tabular-nums text-tinta">{formatarReaisSemSinal(budget.leftCents)}</b>
      </span>
    </div>
  );
}

function PrazoDaDespesa({ days }: { days: number }) {
  if (days < 0) return <Etiqueta tone="perigo" icon={Clock}>Atrasada</Etiqueta>;
  if (days > 10) return null;
  return <Etiqueta tone="aviso" icon={Clock}>{days === 0 ? "Vence hoje" : `Vence em ${days} ${days === 1 ? "dia" : "dias"}`}</Etiqueta>;
}

function LinhaDaDespesa({ u }: { u: DespesaProxima }) {
  return (
    <li className="grid min-h-[60px] grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 border-t border-linha py-2 first:border-t-0">
      <span className="grid justify-items-center rounded-[8px] border border-linha bg-areia/40 py-1 leading-[1.15]">
        <b className="text-base font-semibold tabular-nums">{Number(u.dueKey.slice(8, 10))}</b>
        <small className="text-[11.5px] text-tinta-suave">{rotuloCurtoDoDia(u.dueKey).split(" ")[1]}</small>
      </span>
      <div className="grid min-w-0 gap-0.5">
        <b className="truncate font-medium text-tinta">{u.name}</b>
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-tinta-suave">
          {u.detail}
          <PrazoDaDespesa days={u.days} />
        </span>
      </div>
      <span className="whitespace-nowrap text-right font-medium tabular-nums">{formatarReaisSemSinal(u.amount)}</span>
    </li>
  );
}

export function BlocoDoOrcamento({ budget, canOpen, className = "" }: { budget: Orcamento; canOpen: boolean; className?: string }) {
  const hasExpenses = budget.totalCents > 0;
  return (
    <BlocoDoPainel id="orcamento" title="Orçamento" aside={canOpen && hasExpenses ? <LinkDeTexto href="/financas">Ver despesas</LinkDeTexto> : null} className={className}>
      {!hasExpenses ? (
        <SemDespesas canOpen={canOpen} />
      ) : (
        <>
          <ResumoDoPago budget={budget} />
          {budget.upcoming.length > 0 && (
            <div>
              <h3 className={`${classeDoRotulo} mb-1`}>Próximas despesas</h3>
              <ul>
                {budget.upcoming.map((u) => (
                  <LinhaDaDespesa key={u.id} u={u} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </BlocoDoPainel>
  );
}
