import { Clock } from "lucide-react";
import { chaveDoDiaDe, formatarReaisSemSinal, rotuloCurtoDoDia, type LinhaDePresente } from "@/lib/dashboard-summary";
import { Etiqueta } from "../../ui";
import { BotaoDeConferir, SeloDoPix } from "./botao-de-conferir";

const CABECALHOS = [
  ["Convidado", "text-left"],
  ["Valor e taxa", "text-right"],
  ["Vocês recebem", "text-right"],
  ["Situação", "text-right"],
] as const;

function SituacaoDoPresente({ l, canConfer }: { l: LinhaDePresente; canConfer: boolean }) {
  if (!l.toCheck) {
    return (
      <span className="inline-flex items-center gap-2 text-[13px] text-tinta-suave">
        <SeloDoPix />
        Conferido
      </span>
    );
  }
  if (canConfer) return <BotaoDeConferir transactionId={l.tx.id} giftId={l.tx.giftId} who={l.tx.who} />;
  return <span className="text-[13px] text-tinta-suave">A conferir</span>;
}

function LinhaDaTabela({ l, canConfer }: { l: LinhaDePresente; canConfer: boolean }) {
  return (
    <tr className="border-t border-linha first:border-t-0 max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-3 max-md:gap-y-0.5 max-md:px-3.5 max-md:py-3">
      <td className="h-14 px-3 align-middle max-md:col-start-1 max-md:row-start-1 max-md:h-auto max-md:p-0">
        <div className="grid">
          <b className="font-semibold text-tinta">{l.tx.who}</b>
          <small className="flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-tinta-suave tabular-nums">
            {rotuloCurtoDoDia(chaveDoDiaDe(l.tx.createdAt))} · {l.tx.method === "PIX" ? "Pix" : "Cartão"}
            {l.toCheck && (
              <Etiqueta tone="aviso" icon={Clock}>
                A conferir
              </Etiqueta>
            )}
          </small>
        </div>
      </td>
      <td className="px-3 text-right align-middle tabular-nums max-md:col-start-2 max-md:row-start-1 max-md:p-0">
        <div className="grid">
          <span className="whitespace-nowrap">{formatarReaisSemSinal(l.grossCents)}</span>
          <small className="whitespace-nowrap text-[12.5px] text-tinta-suave">taxa {formatarReaisSemSinal(l.feeCents)}</small>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 text-right align-middle tabular-nums max-md:col-start-2 max-md:row-start-2 max-md:p-0 max-md:text-[13px]">
        <span className="hidden text-tinta-suave max-md:inline">recebem </span>
        {formatarReaisSemSinal(l.netCents)}
      </td>
      <td className="whitespace-nowrap px-3 text-right align-middle max-md:col-start-1 max-md:row-start-2 max-md:p-0 max-md:text-left">
        <SituacaoDoPresente l={l} canConfer={canConfer} />
      </td>
    </tr>
  );
}

export function TabelaDePresentes({ lines, canConfer }: { lines: LinhaDePresente[]; canConfer: boolean }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-linha">
      <table className="w-full border-collapse text-sm max-md:block">
        <caption className="px-3.5 pb-1 pt-3 text-left text-sm font-semibold max-md:block">
          Últimos presentes <span className="ml-1.5 text-[13px] font-normal text-tinta-suave">valor, taxa e quanto vocês recebem</span>
        </caption>
        <thead className="max-md:sr-only">
          <tr>
            {CABECALHOS.map(([titulo, alinhamento]) => (
              <th key={titulo} scope="col" className={`whitespace-nowrap border-b border-linha px-3 py-2 ${alinhamento} text-[12.5px] font-medium text-tinta-suave`}>{titulo}</th>
            ))}
          </tr>
        </thead>
        <tbody className="max-md:block">
          {lines.map((l) => (
            <LinhaDaTabela key={l.tx.id} l={l} canConfer={canConfer} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
