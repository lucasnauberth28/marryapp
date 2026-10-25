import Link from "next/link";
import { PaymentStatus } from "@prisma/client";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { LinkPendente } from "@/components/plataforma/pending";
import { formatarDiaEMes, haQuantoTempo } from "@/lib/platform/format";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { ehPixEstatico, formaDoPagamentoDe, situacaoDoPagamentoDe } from "@/lib/platform/payments";
import { cn } from "@/lib/utils";
import type { LinhaDeAssinatura, TelaDeAssinaturas } from "./dados";

function CelulaDaConta({ r }: { r: LinhaDeAssinatura }) {
  return (
    <>
      <span className="block">{r.user?.name ?? "Conta excluída"}</span>
      <span className="block text-sm font-normal text-tinta-suave">
        {r.planType === "VENDOR" ? "Fornecedor" : "Casal"}
        {r.planType === "VENDOR" && r.user?.partnerVendor?.companyName ? ` · ${r.user.partnerVendor.companyName}` : ""}
      </span>
    </>
  );
}

function CelulaDeAcao({ r, tela }: { r: LinhaDeAssinatura; tela: TelaDeAssinaturas }) {
  const checkable = r.status === PaymentStatus.PENDING && ehPixEstatico(r.gatewayId);
  const who = r.user?.name ?? "conta excluída";
  return (
    <span className="inline-flex flex-wrap justify-end gap-1">
      {r.status === PaymentStatus.APPROVED ? (
        <Link href={`/recibo/${r.id}`} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ameixa hover:bg-ameixa-suave">
          Recibo<span className="sr-only"> do pagamento de {who}</span>
        </Link>
      ) : null}
      <LinkPendente
        href={tela.hrefFor(tela.filter, r.id, tela.window.page)}
        scroll={false}
        aria-current={r.id === tela.selectedId ? "true" : undefined}
        className={cn("inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold", checkable ? "border border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave" : "text-ameixa hover:bg-ameixa-suave")}
      >
        {checkable ? "Conferir" : "Detalhes"}
        <span className="sr-only"> o pagamento de {who}</span>
      </LinkPendente>
    </span>
  );
}

export function colunasDeAssinaturas(tela: TelaDeAssinaturas, now: Date) {
  return [
    { key: "conta", header: "Conta", primary: true, cell: (r: LinhaDeAssinatura) => <CelulaDaConta r={r} /> },
    { key: "plano", header: "Plano", cell: (r: LinhaDeAssinatura) => tela.planLabel(r.planId, r.planName) },
    { key: "valor", header: "Valor", align: "right" as const, cell: (r: LinhaDeAssinatura) => formatarReais(r.amount) },
    {
      key: "status",
      header: "Status",
      cell: (r: LinhaDeAssinatura) => {
        const status = situacaoDoPagamentoDe(r, now);
        return <EtiquetaDeSituacao tone={status.tone}>{status.label}</EtiquetaDeSituacao>;
      },
    },
    {
      key: "quando",
      header: "Quando",
      cell: (r: LinhaDeAssinatura) => (
        <span className="text-sm text-tinta-suave">
          {haQuantoTempo(r.paidAt ?? r.createdAt, now)} · {r.status === PaymentStatus.APPROVED && r.periodEnd ? `vale até ${formatarDiaEMes(r.periodEnd)}` : formaDoPagamentoDe(r.gatewayId)}
        </span>
      ),
    },
    { key: "acao", header: <span className="sr-only">Ação</span>, mobileLabel: false as const, align: "right" as const, cell: (r: LinhaDeAssinatura) => <CelulaDeAcao r={r} tela={tela} /> },
  ];
}
