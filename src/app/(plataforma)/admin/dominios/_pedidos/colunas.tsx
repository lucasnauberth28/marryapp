import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { ROTULO_DA_SITUACAO, type NomeDaSituacaoDoPedidoDeDominio } from "@/lib/domain-order";
import { formatarData, diaRelativo } from "@/lib/platform/format";
import type { listarPedidosDeDominio } from "@/lib/platform/queries/dominios";
import { etiquetaDaSituacao } from "./etiquetas";

type PedidoDaLista = Awaited<ReturnType<typeof listarPedidosDeDominio>>["rows"][number];

function CelulaDoVencimento({ r, now }: { r: PedidoDaLista; now: Date }) {
  if (r.expiresAt) {
    const venceLogo = (r.expiresAt.getTime() - now.getTime()) / 86_400_000 <= 60;
    return (
      <>
        <span className="block">{formatarData(r.expiresAt)}</span>
        {venceLogo ? <span className="block text-sm font-semibold text-aviso">{r.expiresAt < now ? "venceu" : `renova ${diaRelativo(r.expiresAt, now)}`}</span> : null}
      </>
    );
  }
  return r.rejectionReason ? <span className="text-sm text-tinta-suave">{r.rejectionReason}</span> : <span className="text-tinta-suave">Sem data</span>;
}

export function colunasDosPedidos(now: Date) {
  return [
    {
      key: "dominio",
      header: "Domínio e casal",
      primary: true,
      cell: (r: PedidoDaLista) => (
        <>
          <span className="block break-all font-mono text-sm">{r.domain}</span>
          <span className="block text-sm font-normal text-tinta-suave">{r.coupleNames}</span>
        </>
      ),
    },
    {
      key: "titular",
      header: "Titular",
      cell: (r: PedidoDaLista) => (
        <>
          <span className="block">{r.holderName}</span>
          <span className="block text-sm text-tinta-suave">{r.holderDocument}</span>
        </>
      ),
    },
    {
      key: "situacao",
      header: "Situação",
      cell: (r: PedidoDaLista) => {
        const chip = etiquetaDaSituacao(r.status);
        return (
          <EtiquetaDeSituacao tone={chip.tone} icon={chip.icon}>
            {ROTULO_DA_SITUACAO[r.status as NomeDaSituacaoDoPedidoDeDominio] ?? r.status}
          </EtiquetaDeSituacao>
        );
      },
    },
    { key: "vence", header: "Vence", cell: (r: PedidoDaLista) => <CelulaDoVencimento r={r} now={now} /> },
  ];
}
