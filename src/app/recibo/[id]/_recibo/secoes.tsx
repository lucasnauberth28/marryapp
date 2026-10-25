import { Logotipo } from "@/components/brand/logo";
import { formatarDataBrasiliaLonga } from "@/lib/formatacao/data";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { cn } from "@/lib/utils";
import type { LinhaDoRecibo, PagamentoDoRecibo } from "./dados";

const TITULO_DA_SECAO = "text-xs font-semibold uppercase tracking-[0.08em] text-tinta-suave";

export function CabecalhoDoRecibo({ id }: { id: string }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-linha pb-6">
      <div className="flex flex-col gap-2">
        <Logotipo height={28} priority />
        <p className="text-sm text-tinta-suave">Aceito · meuaceito.com.br</p>
      </div>
      <div className="text-right">
        <h1 id="recibo-titulo" className="font-display text-[32px] leading-[38px]">
          Recibo
        </h1>
        <p className="font-mono text-sm text-tinta-suave">Nº {id.slice(0, 8).toUpperCase()}</p>
      </div>
    </header>
  );
}

export function SecaoDeLinhas({ id, titulo, linhas }: { id: string; titulo: string; linhas: LinhaDoRecibo[] }) {
  return (
    <section aria-labelledby={`${id}-titulo`} className="flex flex-col gap-3">
      <h2 id={`${id}-titulo`} className={TITULO_DA_SECAO}>
        {titulo}
      </h2>
      <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-[180px_1fr]">
        {linhas.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-tinta-suave">{row.label}</dt>
            <dd className={cn("break-words", row.mono && "break-all font-mono text-sm")}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const LinhaDeValor = ({ rotulo, valor }: { rotulo: string; valor: number }) => (
  <div className="flex justify-between gap-4">
    <dt>{rotulo}</dt>
    <dd className="tabular-nums">{formatarReais(valor)}</dd>
  </div>
);

export function SecaoDeValores({ sub }: { sub: PagamentoDoRecibo }) {
  const discount = sub.discount ?? 0;
  const credit = sub.credit ?? 0;
  return (
    <section aria-labelledby="valores-titulo" className="flex flex-col gap-3">
      <h2 id="valores-titulo" className={TITULO_DA_SECAO}>
        Valores
      </h2>
      <dl className="flex flex-col gap-2 text-[15px]">
        <LinhaDeValor rotulo="Valor do plano" valor={sub.amount + discount + credit} />
        {discount > 0 ? <LinhaDeValor rotulo={`Desconto do cupom${sub.couponCode ? ` ${sub.couponCode}` : ""}`} valor={-discount} /> : null}
        {credit > 0 ? <LinhaDeValor rotulo="Crédito do plano anterior" valor={-credit} /> : null}
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-linha pt-3">
          <dt className="font-semibold">Total pago</dt>
          <dd className="font-num text-[28px] leading-8 tabular-nums">{formatarReais(sub.amount)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function RodapeDoRecibo() {
  return (
    <footer className="flex flex-col gap-1 border-t border-linha pt-5 text-sm text-tinta-suave">
      <p>
        <strong className="font-semibold text-tinta">Este documento é um recibo de pagamento, não é nota fiscal.</strong> Ele comprova o Pix recebido pelo Aceito.
      </p>
      <p>Emitido em {formatarDataBrasiliaLonga(new Date())}.</p>
    </footer>
  );
}
