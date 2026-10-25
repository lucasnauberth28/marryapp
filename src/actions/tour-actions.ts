"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { obterSessao } from "@/lib/security/auth-guard";
import { obterContextoDoCasamento } from "@/lib/security/wedding-context";
import { obterLinhaDaPessoaDoTour, contaDoTourDe } from "@/lib/tour/panel-tour";
import { tourElegivel, tourPodeGravar, gravacaoDoTour, type DesfechoDoTour } from "@/lib/tour/rules";

import { ERROS } from "@/lib/mensagens-de-erro";
// Passo a passo do painel. Tudo aqui vale só para a pessoa da sessão: nenhum id vem do navegador.
// Não usa requireWedding de propósito: é uma preferência da pessoa, não um dado do casamento (segue
// funcionando com o casamento suspenso ou em manutenção). A administração e quem está "entrando como"
// um casal nunca gravam: a visita é somente leitura e a conta de administração não tem o passo a passo.

export type ResultadoDoTour = { success: true } | { success: false; error: string };

const RECUSADO: ResultadoDoTour = { success: false, error: "O passo a passo não é gravado nesta sessão." };
const EXPIRADO: ResultadoDoTour = { success: false, error: ERROS.sessaoExpirada };

/** Id da pessoa quando ela pode gravar o passo a passo; senão o motivo da recusa. */
async function idDaPessoaComPermissaoDeEscrita(): Promise<{ userId: string } | { refusal: ResultadoDoTour }> {
  const session = await obterSessao();
  if (!session) return { refusal: EXPIRADO };
  const ctx = await obterContextoDoCasamento();
  const row = await obterLinhaDaPessoaDoTour(session.userId);
  if (!row || !ctx) return { refusal: RECUSADO };
  const account = contaDoTourDe({ session, ctx, row });
  if (!tourPodeGravar(account) || !tourElegivel(account)) return { refusal: RECUSADO };
  return { userId: row.id };
}

async function registrarDesfecho(outcome: DesfechoDoTour): Promise<ResultadoDoTour> {
  const who = await idDaPessoaComPermissaoDeEscrita();
  if ("refusal" in who) return who.refusal;
  try {
    await prisma.user.update({ where: { id: who.userId }, data: gravacaoDoTour(outcome, new Date()) });
    return { success: true };
  } catch (error) {
    console.error("[tour]", outcome, error);
    return { success: false, error: "Não deu para guardar. Tente de novo." };
  }
}

/** Chegou ao último passo e concluiu. */
export async function concluirTourDoPainel(): Promise<ResultadoDoTour> {
  return registrarDesfecho("completed");
}

/** Pulou (botão, Esc, "Agora não") ou saiu pelo botão de ir a uma tela. */
export async function pularTourDoPainel(): Promise<ResultadoDoTour> {
  return registrarDesfecho("skipped");
}

/** "Ver o passo a passo de novo": volta ao início; se a pessoa recarregar no meio, as boas-vindas reaparecem. */
export async function reiniciarTourDoPainel(): Promise<ResultadoDoTour> {
  return registrarDesfecho("restart");
}

/** Dispensa a lista "Primeiros passos" do Resumo (só para esta pessoa). */
export async function dispensarPrimeirosPassos(): Promise<ResultadoDoTour> {
  const who = await idDaPessoaComPermissaoDeEscrita();
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
