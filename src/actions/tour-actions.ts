"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/security/auth-guard";
import { getWeddingContext } from "@/lib/security/wedding-context";
import { getTourUserRow, tourAccountOf } from "@/lib/tour/panel-tour";
import { tourEligible, tourMayWrite, tourWrite, type TourOutcome } from "@/lib/tour/rules";

import { ERROS } from "@/lib/mensagens-de-erro";
// Passo a passo do painel. Tudo aqui vale só para a pessoa da sessão: nenhum id vem do navegador.
// Não usa requireWedding de propósito: é uma preferência da pessoa, não um dado do casamento (segue
// funcionando com o casamento suspenso ou em manutenção). A administração e quem está "entrando como"
// um casal nunca gravam: a visita é somente leitura e a conta de administração não tem o passo a passo.

export type TourResult = { success: true } | { success: false; error: string };

const REFUSED: TourResult = { success: false, error: "O passo a passo não é gravado nesta sessão." };
const EXPIRED: TourResult = { success: false, error: ERROS.sessaoExpirada };

/** Id da pessoa quando ela pode gravar o passo a passo; senão o motivo da recusa. */
async function writableUserId(): Promise<{ userId: string } | { refusal: TourResult }> {
  const session = await getSession();
  if (!session) return { refusal: EXPIRED };
  const ctx = await getWeddingContext();
  const row = await getTourUserRow(session.userId);
  if (!row || !ctx) return { refusal: REFUSED };
  const account = tourAccountOf({ session, ctx, row });
  if (!tourMayWrite(account) || !tourEligible(account)) return { refusal: REFUSED };
  return { userId: row.id };
}

async function record(outcome: TourOutcome): Promise<TourResult> {
  const who = await writableUserId();
  if ("refusal" in who) return who.refusal;
  try {
    await prisma.user.update({ where: { id: who.userId }, data: tourWrite(outcome, new Date()) });
    return { success: true };
  } catch (error) {
    console.error("[tour]", outcome, error);
    return { success: false, error: "Não deu para guardar. Tente de novo." };
  }
}

/** Chegou ao último passo e concluiu. */
export async function completePanelTour(): Promise<TourResult> {
  return record("completed");
}

/** Pulou (botão, Esc, "Agora não") ou saiu pelo botão de ir a uma tela. */
export async function skipPanelTour(): Promise<TourResult> {
  return record("skipped");
}

/** "Ver o passo a passo de novo": volta ao início; se a pessoa recarregar no meio, as boas-vindas reaparecem. */
export async function restartPanelTour(): Promise<TourResult> {
  return record("restart");
}

/** Dispensa a lista "Primeiros passos" do Resumo (só para esta pessoa). */
export async function dismissFirstSteps(): Promise<TourResult> {
  const who = await writableUserId();
  if ("refusal" in who) return who.refusal;
  try {
    await prisma.user.update({ where: { id: who.userId }, data: { panelChecklistDismissedAt: new Date() } });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[tour] dismissFirstSteps", error);
    return { success: false, error: "Não deu para dispensar a lista. Tente de novo." };
  }
}
