import type { AssinaturaDoPainel } from "./tipos";

export function DadosDaAssinatura({ s }: { s: AssinaturaDoPainel }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
      <dt className="text-tinta-suave">Valor</dt>
      <dd className="font-semibold tabular-nums text-tinta">{s.amount}</dd>
      <dt className="text-tinta-suave">Identificador</dt>
      <dd className="break-all font-mono text-sm text-tinta">{s.gatewayId ?? "—"}</dd>
      <dt className="text-tinta-suave">Gerado em</dt>
      <dd className="text-tinta">{s.createdAt}</dd>
      {s.paidAt ? (
        <>
          <dt className="text-tinta-suave">Pago em</dt>
          <dd className="text-tinta">{s.paidAt}</dd>
        </>
      ) : null}
      {s.periodEnd ? (
        <>
          <dt className="text-tinta-suave">Vale até</dt>
          <dd className="text-tinta">{s.periodEnd}</dd>
        </>
      ) : null}
      <dt className="text-tinta-suave">Forma</dt>
      <dd className="text-tinta">{s.method}</dd>
      <dt className="text-tinta-suave">E-mail</dt>
      <dd className="break-all text-tinta">{s.email}</dd>
    </dl>
  );
}
