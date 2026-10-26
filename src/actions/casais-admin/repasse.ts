"use server";

// Administração do casal: registrar um repasse manual dos presentes (a transferência é feita fora, no banco da equipe).
import { z } from "zod";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { obterLivroDeRepasses } from "@/lib/repasse/payout-ledger-server";
import { avisarRepasseEnviado } from "@/lib/repasse/payout-notify";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type ResultadoDaAcaoDoCasal, atualizarPaginas, falhar, idDoCasamentoValido } from "@/actions/casais-admin/comum";

const EsquemaDoRepasse = z.object({
  weddingId: idDoCasamentoValido,
  amountCents: z.number({ message: "Informe o valor." }).int("Informe o valor em reais e centavos.").positive("O valor precisa ser maior que zero.").max(100_000_000, "Valor alto demais."),
  reference: z.string().trim().max(120, "A referência pode ter até 120 letras.").optional(),
});

class RepasseRecusado extends Error {}

/**
 * Registra que a equipe repassou `amountCents` ao casal. Só com destino cadastrado e confirmado pelo casal, e nunca
 * acima do que falta repassar. A conta é refeita dentro da transação (Serializable): dois registros ao mesmo tempo não passam do saldo.
 */
export async function registrarRepasseDoCasamento(input: unknown): Promise<ResultadoDaAcaoDoCasal> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const data = EsquemaDoRepasse.parse(input);

    const limit = await conferirLimiteDeUso({ key: `ADMIN_PAYOUT:${admin.userId}`, limit: 20, windowMs: 10 * 60 * 1000 });
    if (!limit.success) return { success: false, error: ERROS.muitasTentativas };

    const registrado = await prisma
      .$transaction(
        async (tx) => {
          const conta = await tx.weddingPayoutAccount.findUnique({ where: { weddingId: data.weddingId }, select: { verifiedAt: true } });
          if (!conta) throw new RepasseRecusado("O casal ainda não cadastrou onde receber.");
          if (!conta.verifiedAt) throw new RepasseRecusado("O casal ainda não confirmou os dados de recebimento.");
          const { posicao } = await obterLivroDeRepasses(data.weddingId, tx);
          if (data.amountCents > posicao.dueCents) throw new RepasseRecusado(`O valor passa do que falta repassar (${formatarReais(posicao.dueCents)}).`);
          return tx.weddingPayout.create({
            data: { weddingId: data.weddingId, amountCents: data.amountCents, reference: data.reference || null, registeredBy: admin.name ?? "Administração" },
            select: { id: true },
          });
        },
        { isolationLevel: "Serializable" },
      )
      .catch((error) => (error instanceof RepasseRecusado ? error : Promise.reject(error)));
    if (registrado instanceof RepasseRecusado) return { success: false, error: registrado.message };

    await registrarAuditoria({ action: "wedding.payout_register", targetType: "wedding", targetId: data.weddingId, details: { payoutId: registrado.id, amountCents: data.amountCents, reference: data.reference || null } });
    avisarRepasseEnviado({ weddingId: data.weddingId, payoutId: registrado.id, amountCents: data.amountCents });
    atualizarPaginas(data.weddingId);
    return { success: true, message: `Repasse de ${formatarReais(data.amountCents)} registrado.` };
  } catch (error) {
    return falhar(error, "registerWeddingPayout");
  }
}
