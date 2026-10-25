"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { ErroDeAutorizacao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { exigirCasamento, type ContextoDoCasamento } from "@/lib/security/wedding-context";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { cifrarSegredoDoRepasse, cifraDoRepasseEstaConfigurada, versaoAtualDaChaveDoRepasse, ErroDeCifraDoRepasse } from "@/lib/security/payout-crypto";
import { registrarAuditoria } from "@/lib/audit";
import { contextoDaCifraDoRepasse, validarEntradaDeRepasse } from "@/lib/repasse/payout-input";
import { obterVisaoDaContaDeRepasse, type VisaoDaContaDeRepasse } from "@/lib/repasse/payout-account-view";
import { avisarMudancaNoRepasse } from "@/lib/repasse/payout-notify";

// Dados de recebimento do casal (onde o Aceito deve repassar os presentes). Regras de todas as actions daqui:
//  - o casamento vem SEMPRE da sessão (requireWedding), nunca do navegador;
//  - só a própria pessoa do casal escreve: "entrar como" da administração e a conta de emergência são recusados;
//  - salvar, confirmar e remover pedem a senha atual (reautenticação), com limite de tentativas por pessoa;
//  - nada bancário entra em log, AuditLog, e-mail, aviso ou mensagem de erro;
//  - a resposta devolve só a máscara (PayoutAccountView), nunca o dado nem o texto cifrado.

type Falha = { success: false; error: string };
export type RespostaDoRepasse = { success: true; account: VisaoDaContaDeRepasse | null } | Falha;

const UM_MINUTO_EM_MS = 60 * 1000;
const SEM_PERMISSAO_DE_ESCRITA = "Só quem é do casal pode cadastrar ou alterar os dados de recebimento.";
const ERRO_GENERICO = "Não deu para salvar agora. Tente de novo em instantes.";

const EsquemaDaSenha = z.string().min(1, "Informe sua senha para confirmar.").max(200, "Senha longa demais.");

/** Sessão que escreve, pessoa real do casamento e senha conferida. Devolve o contexto ou o motivo da recusa. */
async function autorizarEscrita(password: unknown, action: string): Promise<{ ctx: ContextoDoCasamento; userId: string; name: string } | Falha> {
  let ctx: ContextoDoCasamento;
  try {
    ctx = await exigirCasamento("/configuracoes");
  } catch (error) {
    if (error instanceof ErroDeAutorizacao) return { success: false, error: error.message };
    throw error;
  }

  // Administração vendo o casal (entrar como, conta de emergência, perfil "*" sem casamento): nunca escreve aqui.
  if (ctx.impersonation || ctx.viaAdmin || ctx.session.userId === ID_DO_SUPER_ADMIN) return { success: false, error: SEM_PERMISSAO_DE_ESCRITA };

  const pw = EsquemaDaSenha.safeParse(password);
  if (!pw.success) return { success: false, error: pw.error.issues[0]?.message ?? "Informe sua senha para confirmar." };

  const limit = await conferirLimiteDeUso({ key: `PAYOUT_ACCOUNT:${ctx.session.userId}`, limit: 6, windowMs: 15 * UM_MINUTO_EM_MS });
  if (!limit.success) return { success: false, error: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo." };

  // O weddingId da conta precisa ser o da sessão (defesa em profundidade contra IDOR).
  const user = await prisma.user.findFirst({
    where: { id: ctx.session.userId, weddingId: ctx.weddingId },
    select: { id: true, name: true, password: true },
  });
  if (!user) return { success: false, error: SEM_PERMISSAO_DE_ESCRITA };

  if (!(await bcrypt.compare(pw.data, user.password))) {
    await registrarAuditoria({ action: `${action}_denied`, targetType: "Wedding", targetId: ctx.weddingId, details: { reason: "wrong_password" } });
    return { success: false, error: "A senha não confere." };
  }
  return { ctx, userId: user.id, name: user.name };
}
type RepasseValido = Extract<ReturnType<typeof validarEntradaDeRepasse>, { ok: true }>["value"];

/** As colunas do banco: documento, chave Pix e conta cifrados (cada um com o seu contexto), "sem confirmação" de novo. */
function colunasDoRepasse(data: RepasseValido, weddingId: string, userId: string) {
  return {
    type: data.type,
    holderName: data.holderName,
    holderDocumentKind: data.holderDocumentKind,
    holderDocumentEnc: cifrarSegredoDoRepasse(data.documentSecret, contextoDaCifraDoRepasse(weddingId, "document")),
    holderDocumentLast4: data.documentLast4,
    pixKeyType: data.pixKeyType,
    pixKeyEnc: data.pixKeySecret ? cifrarSegredoDoRepasse(data.pixKeySecret, contextoDaCifraDoRepasse(weddingId, "pix")) : null,
    bankAccountEnc: data.bankSecret ? cifrarSegredoDoRepasse(data.bankSecret, contextoDaCifraDoRepasse(weddingId, "bank")) : null,
    keyHint: data.keyHint,
    encKeyVersion: versaoAtualDaChaveDoRepasse(),
    verifiedAt: null,
    registeredByUserId: userId,
  };
}

/**
 * Cadastra ou troca os dados de recebimento. Pede a senha atual. Trocar deixa os dados "sem confirmação" de novo,
 * grava no AuditLog (sem o dado) e avisa as pessoas do casamento.
 */
export async function salvarContaDeRepasse(input: unknown): Promise<RespostaDoRepasse> {
  const { password, ...fields } = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  const valid = validarEntradaDeRepasse(fields);
  if (!valid.ok) return { success: false, error: valid.error };
  if (!cifraDoRepasseEstaConfigurada()) {
    return { success: false, error: "O cadastro dos dados de recebimento ainda não foi liberado. A equipe do Aceito está terminando a configuração de segurança." };
  }

  const auth = await autorizarEscrita(password, "payout.account_save");
  if ("success" in auth) return auth;
  const { ctx, userId, name } = auth;
  const { weddingId } = ctx;
  const data = valid.value;

  try {
    const columns = colunasDoRepasse(data, weddingId, userId);

    const previous = await prisma.weddingPayoutAccount.findUnique({ where: { weddingId }, select: { id: true, type: true } });
    const saved = await prisma.weddingPayoutAccount.upsert({
      where: { weddingId },
      update: columns,
      create: { weddingId, ...columns },
      select: { id: true },
    });

    const change = previous ? "updated" : "created";
    await registrarAuditoria({
      action: previous ? "payout.account_update" : "payout.account_create",
      targetType: "WeddingPayoutAccount",
      targetId: saved.id,
      // Só o tipo: nunca máscara, documento, chave ou conta.
      details: { weddingId, type: data.type, previousType: previous?.type ?? null },
    });
    avisarMudancaNoRepasse({ weddingId, actorName: name, change, at: new Date() });
    revalidatePath("/configuracoes/recebimento");
    return { success: true, account: await obterVisaoDaContaDeRepasse(weddingId) };
  } catch (error) {
    // Só o tipo do erro: a mensagem do banco ou da cifra pode conter pedaços do dado.
    console.error("[payout] falha ao salvar", error instanceof ErroDeCifraDoRepasse ? error.code : error instanceof Error ? error.name : "erro");
    return { success: false, error: ERRO_GENERICO };
  }
}

/** O casal confirma que os dados cadastrados estão certos (pede a senha). Sem isso, o repasse não é liberado. */
export async function confirmarContaDeRepasse(input: unknown): Promise<RespostaDoRepasse> {
  const auth = await autorizarEscrita((input as { password?: unknown } | null)?.password, "payout.account_verify");
  if ("success" in auth) return auth;
  const { weddingId } = auth.ctx;

  try {
    const done = await prisma.weddingPayoutAccount.updateMany({
      where: { weddingId, verifiedAt: null },
      data: { verifiedAt: new Date(), registeredByUserId: auth.userId },
    });
    if (done.count === 0) {
      const current = await obterVisaoDaContaDeRepasse(weddingId);
      return current ? { success: true, account: current } : { success: false, error: "Ainda não há dados de recebimento cadastrados." };
    }
    const row = await prisma.weddingPayoutAccount.findUnique({ where: { weddingId }, select: { id: true, type: true } });
    await registrarAuditoria({ action: "payout.account_verify", targetType: "WeddingPayoutAccount", targetId: row?.id, details: { weddingId, type: row?.type ?? null } });
    revalidatePath("/configuracoes/recebimento");
    return { success: true, account: await obterVisaoDaContaDeRepasse(weddingId) };
  } catch (error) {
    console.error("[payout] falha ao confirmar", error instanceof Error ? error.name : "erro");
    return { success: false, error: ERRO_GENERICO };
  }
}

/** Remove os dados de recebimento (pede a senha). Direito do casal: apaga as colunas cifradas junto. */
export async function removerContaDeRepasse(input: unknown): Promise<RespostaDoRepasse> {
  const auth = await autorizarEscrita((input as { password?: unknown } | null)?.password, "payout.account_delete");
  if ("success" in auth) return auth;
  const { weddingId } = auth.ctx;

  try {
    const row = await prisma.weddingPayoutAccount.findUnique({ where: { weddingId }, select: { id: true, type: true } });
    if (!row) return { success: true, account: null };
    await prisma.weddingPayoutAccount.deleteMany({ where: { id: row.id, weddingId } });
    await registrarAuditoria({ action: "payout.account_delete", targetType: "WeddingPayoutAccount", targetId: row.id, details: { weddingId, type: row.type } });
    avisarMudancaNoRepasse({ weddingId, actorName: auth.name, change: "removed", at: new Date() });
    revalidatePath("/configuracoes/recebimento");
    return { success: true, account: null };
  } catch (error) {
    console.error("[payout] falha ao remover", error instanceof Error ? error.name : "erro");
    return { success: false, error: ERRO_GENERICO };
  }
}
