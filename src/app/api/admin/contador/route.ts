import { NextResponse, type NextRequest } from "next/server";
import { PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { protecaoDaApiDeAdminDaPlataforma } from "@/lib/security/platform-admin";
import { csvLine } from "@/lib/platform/csv";
import { accountantMonth, monthRange, paymentMethodOf } from "@/lib/platform/payments";

const MAX_ROWS = 10_000;

/**
 * Planilha do mês para o contador: ?mes=AAAA-MM. Pagamentos de plano aprovados (e os estornados) pela data do pagamento.
 * Nunca traz CPF, CNPJ, e-mail nem a taxa do Mercado Pago (a assinatura não guarda taxa).
 */
export async function GET(request: NextRequest) {
  const { ctx, response } = await protecaoDaApiDeAdminDaPlataforma();
  if (response) return response;

  const month = accountantMonth(request.nextUrl.searchParams.get("mes") ?? undefined, new Date());
  const { start, end } = monthRange(month);
  const rows = await prisma.subscription.findMany({
    where: { status: { in: [PaymentStatus.APPROVED, PaymentStatus.REFUNDED] }, amount: { gt: 0 }, paidAt: { gte: start, lt: end } },
    orderBy: { paidAt: "asc" },
    take: MAX_ROWS,
    select: {
      planName: true,
      planType: true,
      amount: true,
      discount: true,
      couponCode: true,
      status: true,
      gatewayId: true,
      paidAt: true,
      invoiceIssuedAt: true,
      invoiceNumber: true,
      user: { select: { name: true, partnerVendor: { select: { companyName: true } } } },
    },
  });

  const reais = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
  const day = (d: Date | null) => (d ? new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 10) : "");
  const lines = [
    csvLine(["Data do pagamento", "Quem pagou", "Tipo de conta", "Plano", "Valor (R$)", "Cupom", "Forma de pagamento", "Situação", "Nota emitida em", "Número da nota"]),
    ...rows.map((r) =>
      csvLine([
        day(r.paidAt),
        r.user?.partnerVendor?.companyName ?? r.user?.name ?? "Conta excluída",
        r.planType === "VENDOR" ? "Fornecedor" : "Casal",
        r.planName,
        reais(r.amount),
        r.couponCode ?? "",
        paymentMethodOf(r.gatewayId),
        r.status === PaymentStatus.REFUNDED ? "Estornado" : "Pago",
        day(r.invoiceIssuedAt),
        r.invoiceNumber ?? "",
      ]),
    ),
  ];

  await registrarAuditoria({ action: "export.csv", targetType: "contador", details: { month, rows: rows.length, by: ctx.userId } });
  return new NextResponse(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="contador-${month}.csv"`,
      "cache-control": "no-store",
    },
  });
}
