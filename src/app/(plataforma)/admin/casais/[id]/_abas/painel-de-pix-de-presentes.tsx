import { PaymentMethod, PaymentStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { formatarDataEHora } from "@/lib/platform/format";
import { AcoesDoPixDePresente } from "../_components/gift-pix-actions";

/** Pix de presentes esperando a equipe olhar o extrato. Some quando não há nenhum. */
export async function PainelDePixDePresentes({ weddingId }: { weddingId: string }) {
  const pendentes = await prisma.transaction.findMany({
    where: { weddingId, paymentMethod: PaymentMethod.PIX, status: PaymentStatus.PENDING },
    orderBy: { createdAt: "asc" },
    take: 30,
    select: { id: true, amount: true, createdAt: true, gatewayId: true, guestName: true, guest: { select: { name: true } }, gift: { select: { title: true } } },
  });
  if (pendentes.length === 0) return null;
  return (
    <Painel title="Pix de presentes em confirmação" aside={<EtiquetaDeSituacao tone="aviso">{pendentes.length} esperando</EtiquetaDeSituacao>}>
      <p className="mb-4 text-sm leading-5 text-tinta-suave">
        Confira no extrato da conta do Aceito se o valor caiu. Pix do Mercado Pago se confirma sozinho; os marcados como estáticos dependem desta conferência.
      </p>
      <ul className="flex flex-col divide-y divide-linha">
        {pendentes.map((t) => {
          const quem = t.guest?.name ?? t.guestName ?? "Convidado";
          return (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold">
                  {formatarReais(t.amount)} · {t.gift.title}
                </p>
                <p className="text-sm text-tinta-suave">
                  {quem} · {formatarDataEHora(t.createdAt)} · {t.gatewayId ? "Mercado Pago" : "Pix estático"}
                </p>
              </div>
              <AcoesDoPixDePresente weddingId={weddingId} transactionId={t.id} quem={quem} />
            </li>
          );
        })}
      </ul>
    </Painel>
  );
}
