import { Clock, ReceiptText, RotateCcw } from "lucide-react";
import type { ItemDeAtencao } from "@/components/plataforma/attention-list";
import { formatarData, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import type { obterPixParaConferir } from "@/lib/platform/queries/receita/resumo";
import type { obterReembolsosPendentes } from "@/lib/platform/queries/receita/pendencias";

interface Entrada {
  pix: Awaited<ReturnType<typeof obterPixParaConferir>>;
  refunds: Awaited<ReturnType<typeof obterReembolsosPendentes>>;
  invoiceCount: number;
  now: Date;
}

/** O que a administração precisa resolver em dinheiro: Pix a conferir, reembolsos e notas pendentes. */
export function itensParaResolver({ pix, refunds, invoiceCount, now }: Entrada): ItemDeAtencao[] {
  const itens: ItemDeAtencao[] = [];
  if (pix.count > 0)
    itens.push({
      id: "pix",
      icon: Clock,
      tone: "aviso",
      title: pluralizar(pix.count, "Pix para conferir", "Pix para conferir"),
      detail: `${formatarReais(pix.totalCents)} no total.${pix.oldestAt ? ` O mais antigo é ${haQuantoTempo(pix.oldestAt, now)}.` : ""}`,
      actionLabel: "Conferir",
      href: "/admin/planos/assinaturas?status=a-conferir",
    });
  if (refunds.count > 0)
    itens.push({
      id: "reembolso",
      icon: RotateCcw,
      tone: "aviso",
      title: pluralizar(refunds.count, "reembolso para decidir", "reembolsos para decidir"),
      detail: `${formatarReais(refunds.totalCents)} no total.${refunds.nextDueAt ? ` Responder até ${formatarData(refunds.nextDueAt)}.` : ""}`,
      actionLabel: "Analisar",
      href: "/admin/planos?aba=reembolsos",
    });
  if (invoiceCount > 0)
    itens.push({
      id: "notas",
      icon: ReceiptText,
      tone: "aviso",
      title: pluralizar(invoiceCount, "nota fiscal pendente", "notas fiscais pendentes"),
      detail: "Pagamentos aprovados sem nota emitida.",
      actionLabel: "Ver notas",
      href: "/admin/planos?aba=contador",
    });
  return itens;
}
