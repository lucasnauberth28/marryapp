import { cn } from "@/lib/utils";
import { Botao } from "@/components/ui/button";
import { ESTILO_DO_BOTAO, rotuloDoDesconto, situacaoDe, type LinhaDeCupom } from "./tipos";
import type { EstadoDosCupons } from "./use-cupons";

interface Propriedades {
  coupons: LinhaDeCupom[];
  estado: EstadoDosCupons;
  planLabel: (id: string) => string;
}

function AcoesDoCupom({ c, estado }: { c: LinhaDeCupom; estado: EstadoDosCupons }) {
  const { deleting, setDeleting, isPending, remove, open } = estado;
  if (deleting === c.id) {
    return (
      <span role="group" aria-label={`Confirmar exclusão do cupom ${c.code}`} className="inline-flex items-center gap-1">
        <Botao type="button" size="sm" onClick={() => remove(c)} loading={isPending} className="bg-perigo text-on-ameixa hover:bg-perigo/90">
          Excluir
        </Botao>
        <Botao type="button" variant="quiet" size="sm" onClick={() => setDeleting(null)} disabled={isPending}>
          Voltar
        </Botao>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" onClick={() => open(c)} className={cn(ESTILO_DO_BOTAO, "px-3 text-sm text-ameixa hover:bg-ameixa-suave")}>
        Editar<span className="sr-only"> o cupom {c.code}</span>
      </button>
      <button type="button" onClick={() => setDeleting(c.id)} className={cn(ESTILO_DO_BOTAO, "px-3 text-sm text-tinta-suave hover:bg-perigo-suave hover:text-perigo")}>
        Excluir<span className="sr-only"> o cupom {c.code}</span>
      </button>
    </span>
  );
}

function EtiquetaDaSituacaoDoCupom({ c }: { c: LinhaDeCupom }) {
  const status = situacaoDe(c);
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold leading-4", status.tone)}>{status.label}</span>;
}

const usos = (c: LinhaDeCupom) => `${c.redemptions}${c.maxRedemptions !== null ? ` de ${c.maxRedemptions}` : ""}`;

const CABECALHOS = ["Código", "Desconto", "Planos", "Usos", "Validade", "Status"];

export function TabelaDeCupons({ coupons, estado, planLabel }: Propriedades) {
  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-linha bg-papel md:block">
      <table className="w-full min-w-[760px] border-collapse text-[15px]">
        <caption className="sr-only">Cupons de desconto</caption>
        <thead>
          <tr className="text-left text-[13px] text-tinta-suave">
            {CABECALHOS.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>
            ))}
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id} className={cn("border-t border-linha", estado.editing === c.id && "bg-ameixa-suave")}>
              <td className="px-4 py-3.5 font-mono font-semibold text-tinta">{c.code}</td>
              <td className="px-4 py-3.5 text-tinta">{rotuloDoDesconto(c)}</td>
              <td className="px-4 py-3.5 text-sm text-tinta-suave">{c.planIds.length === 0 ? "Todos" : c.planIds.map(planLabel).join(", ")}</td>
              <td className="px-4 py-3.5 tabular-nums text-tinta">{usos(c)}</td>
              <td className="px-4 py-3.5 text-sm text-tinta-suave">{c.expiresLabel ?? "Não vence"}</td>
              <td className="px-4 py-3.5">
                <EtiquetaDaSituacaoDoCupom c={c} />
              </td>
              <td className="px-4 py-2 text-right whitespace-nowrap">
                <AcoesDoCupom c={c} estado={estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CartoesDeCupons({ coupons, estado, planLabel }: Propriedades) {
  return (
    <ul className="flex flex-col gap-3 md:hidden" aria-label="Cupons de desconto">
      {coupons.map((c) => (
        <li key={c.id} className={cn("flex flex-col gap-2 rounded-2xl border border-linha bg-papel p-4", estado.editing === c.id && "bg-ameixa-suave")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="font-mono text-tinta">{c.code}</strong>
            <EtiquetaDaSituacaoDoCupom c={c} />
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-tinta-suave">Desconto</dt>
            <dd className="text-tinta">{rotuloDoDesconto(c)}</dd>
            <dt className="text-tinta-suave">Planos</dt>
            <dd className="text-tinta">{c.planIds.length === 0 ? "Todos" : c.planIds.map(planLabel).join(", ")}</dd>
            <dt className="text-tinta-suave">Usos</dt>
            <dd className="text-tinta">{usos(c)}</dd>
            <dt className="text-tinta-suave">Validade</dt>
            <dd className="text-tinta">{c.expiresLabel ?? "Não vence"}</dd>
          </dl>
          <div className="-ml-3 flex flex-wrap">
            <AcoesDoCupom c={c} estado={estado} />
          </div>
        </li>
      ))}
    </ul>
  );
}
