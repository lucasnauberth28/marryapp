"use server";

import { exigirCasamento, exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";
import { garantirSaldoDaCarteira } from "@/lib/casamento/wedding-data";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { EsquemaDoCartao, MAXIMO_DE_CARTOES_POR_CASAMENTO } from "@/lib/financas/cartoes";

import { ERROS } from "@/lib/mensagens-de-erro";
export async function obterDadosDaCarteira() {
  const { weddingId } = await exigirCasamentoParaLeitura();
  const wallet = await garantirSaldoDaCarteira(weddingId);

  const cards = await prisma.creditCard.findMany({
    where: { weddingId },
    orderBy: { createdAt: "desc" },
  });

  return {
    balance: wallet.balance,
    cards,
  };
}
type ResultadoDoCartao = { success: true } | { success: false; error: string };

const atualizarTelas = () => revalidatePath("/financas");

/** Cadastra um cartão do casamento (até 10). `input` vem da tela e é validado aqui de novo. */
export async function criarCartaoDeCredito(input: unknown): Promise<ResultadoDoCartao> {
  const { weddingId } = await exigirCasamento("/financas");
  const parsed = EsquemaDoCartao.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? ERROS.camposInvalidos };
  const { limitCents, ...dados } = parsed.data;

  try {
    if ((await prisma.creditCard.count({ where: { weddingId } })) >= MAXIMO_DE_CARTOES_POR_CASAMENTO) {
      return { success: false, error: `Dá para cadastrar até ${MAXIMO_DE_CARTOES_POR_CASAMENTO} cartões. Exclua algum que não usa mais.` };
    }
    await prisma.creditCard.create({ data: { ...dados, limit: limitCents, weddingId }, select: { id: true } });
    atualizarTelas();
    return { success: true };
  } catch (error) {
    console.error("[createCreditCard]", error);
    return { success: false, error: "Não deu para cadastrar o cartão. Tente de novo." };
  }
}

export async function atualizarCartaoDeCredito(id: unknown, input: unknown): Promise<ResultadoDoCartao> {
  const { weddingId } = await exigirCasamento("/financas");
  if (typeof id !== "string") return { success: false, error: ERROS.cartaoNaoEncontrado };
  const parsed = EsquemaDoCartao.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? ERROS.camposInvalidos };
  const { limitCents, ...dados } = parsed.data;

  try {
    // O filtro por casamento é a posse: um id de outro casal não casa com nada
    const result = await prisma.creditCard.updateMany({ where: { id, weddingId }, data: { ...dados, limit: limitCents } });
    if (result.count === 0) return { success: false, error: ERROS.cartaoNaoEncontrado };
    atualizarTelas();
    return { success: true };
  } catch (error) {
    console.error("[updateCreditCard]", error);
    return { success: false, error: "Não deu para salvar o cartão. Tente de novo." };
  }
}

export async function excluirCartaoDeCredito(id: unknown): Promise<ResultadoDoCartao> {
  const { weddingId } = await exigirCasamento("/financas");
  if (typeof id !== "string") return { success: false, error: ERROS.cartaoNaoEncontrado };
  try {
    const result = await prisma.creditCard.deleteMany({ where: { id, weddingId } });
    if (result.count === 0) return { success: false, error: ERROS.cartaoNaoEncontrado };
    atualizarTelas();
    return { success: true };
  } catch (error) {
    console.error("[deleteCreditCard]", error);
    return { success: false, error: "Não deu para excluir o cartão. Tente de novo." };
  }
}
