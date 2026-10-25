"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { platformAdminFailure, requirePlatformAdmin } from "@/lib/security/platform-admin";
import { savePlatformSetting } from "@/lib/platform/settings";
import {
  articleInput,
  instructionsInput,
  nextVersion,
  parseIntField,
  parsePlanLimits,
  parseReaisToCents,
  type FieldErrors,
  type PlanLimitsForm,
} from "@/lib/platform/madrinha";
import { searchWeddingsForMadrinha, type WeddingHit } from "@/lib/platform/queries/madrinha";

import { ERROS } from "@/lib/mensagens-de-erro";
/**
 * Configuração da Liz (a IA ainda não está conectada: nada aqui chama a API nem simula uso).
 * Toda função começa pelo guard da administração e grava no AuditLog. Não existe ação que ligue o
 * interruptor geral nem que pause para todos: enquanto não houver conexão, isso não pode ser feito daqui.
 */

type Fail = { success: false; error: string; fieldErrors?: Record<string, string> };
type Ok = { success: true; message: string };

const REVALIDATE = ["/admin/madrinha", "/admin/madrinha/controles"] as const;
const refresh = () => REVALIDATE.forEach((p) => revalidatePath(p));

const planLimitsShape = z.object({ perDay: z.string().max(12), perMonth: z.string().max(12), costCap: z.string().max(16), warnPercent: z.string().max(4), autoBlock: z.boolean() });

/** Falha de campo: devolve as mensagens por nome de campo (com prefixo opcional) e uma mensagem geral. */
function fieldFail(errors: Record<string, string | undefined>, prefix = ""): Fail {
  const fieldErrors: Record<string, string> = {};
  for (const [key, message] of Object.entries(errors)) if (message) fieldErrors[`${prefix}${key}`] = message;
  return { success: false, error: ERROS.camposInvalidos, fieldErrors };
}

export async function saveMadrinhaLimits(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const data = z.object({ subscription: planLimitsShape, trial: planLimitsShape }).parse(input);
    const sub = parsePlanLimits(data.subscription as PlanLimitsForm);
    const trial = parsePlanLimits(data.trial as PlanLimitsForm);
    if (!sub.ok || !trial.ok) {
      return fieldFail({
        ...Object.fromEntries(Object.entries(sub.ok ? {} : sub.errors).map(([k, v]) => [`subscription.${k}`, v])),
        ...Object.fromEntries(Object.entries(trial.ok ? {} : trial.errors).map(([k, v]) => [`trial.${k}`, v])),
      });
    }
    await savePlatformSetting("madrinha.limits", { subscription: sub.value, trial: trial.value });
    refresh();
    return { success: true, message: "Limites salvos. Valem quando a Liz for ativada." };
  } catch (error) {
    return platformAdminFailure(error, "saveMadrinhaLimits");
  }
}

export async function saveMadrinhaGlobalCap(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const data = z.object({ monthlyCostCap: z.string().max(16), warnPercent: z.string().max(4), pauseAtCap: z.boolean() }).parse(input);
    const cap = parseReaisToCents(data.monthlyCostCap);
    const warn = parseIntField(data.warnPercent);
    const errors: FieldErrors<"monthlyCostCap" | "warnPercent"> = {};
    if (cap === null || cap > 100_000_00) errors.monthlyCostCap = "Use um valor em reais, como 300,00.";
    if (warn === null || warn > 100) errors.warnPercent = "Use de 0 a 100.";
    if (cap === null || warn === null || Object.keys(errors).length) return fieldFail(errors);
    await savePlatformSetting("madrinha.globalCap", { monthlyCostCapCents: cap, warnPercent: warn, pauseAtCap: data.pauseAtCap });
    refresh();
    return { success: true, message: "Teto mensal salvo." };
  } catch (error) {
    return platformAdminFailure(error, "saveMadrinhaGlobalCap");
  }
}

export async function saveMadrinhaAbuse(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const data = z
      .object({ perHour: z.string().max(12), blockHours: z.string().max(6), blockOffTopic: z.boolean(), offTopicBeforeBlock: z.string().max(6) })
      .parse(input);
    const perHour = parseIntField(data.perHour);
    const blockHours = parseIntField(data.blockHours);
    const before = parseIntField(data.offTopicBeforeBlock);
    const errors: FieldErrors<"perHour" | "blockHours" | "offTopicBeforeBlock"> = {};
    if (perHour === null || perHour > 1_000) errors.perHour = "Use um número inteiro, até 1.000.";
    if (blockHours === null || blockHours < 1 || blockHours > 720) errors.blockHours = "Use de 1 a 720 horas.";
    if (before === null || before < 1 || before > 100) errors.offTopicBeforeBlock = "Use de 1 a 100 recusas.";
    if (perHour === null || blockHours === null || before === null || Object.keys(errors).length) return fieldFail(errors);
    await savePlatformSetting("madrinha.abuse", { perHour, blockHours, blockOffTopic: data.blockOffTopic, offTopicBeforeBlock: before });
    refresh();
    return { success: true, message: "Bloqueio por abuso salvo." };
  } catch (error) {
    return platformAdminFailure(error, "saveMadrinhaAbuse");
  }
}

/** "Enviar mensagens sozinha" não existe no formato: a Liz nunca envia sozinha. `.strict()` recusa qualquer campo a mais. */
export async function saveMadrinhaCapabilities(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const data = z
      .object({ draftReminder: z.boolean(), suggestTasks: z.boolean(), buildTimeline: z.boolean(), compareQuotes: z.boolean() })
      .strict()
      .parse(input);
    await savePlatformSetting("madrinha.capabilities", data);
    refresh();
    return { success: true, message: "Salvo." };
  } catch (error) {
    return platformAdminFailure(error, "saveMadrinhaCapabilities");
  }
}

// ---------------------------------------------------------------------------
// Instruções versionadas
// ---------------------------------------------------------------------------

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** Cria a versão seguinte com o conteúdo dado (rascunho). Repete se duas pessoas salvarem ao mesmo tempo. */
async function createVersion(content: string, changeNote: string, author: { userId: string; name: string | null }) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const versions = await prisma.madrinhaInstructionVersion.findMany({ select: { version: true } });
    const version = nextVersion(versions.map((v) => v.version));
    try {
      return await prisma.madrinhaInstructionVersion.create({
        data: { version, content, changeNote, status: "DRAFT", createdById: author.userId, createdByName: author.name ?? "Administrador" },
        select: { id: true, version: true },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new Error("Não foi possível numerar a versão.");
}

export async function saveInstructionVersion(input: unknown): Promise<(Ok & { version: number }) | Fail> {
  try {
    const admin = await requirePlatformAdmin();
    const parsed = instructionsInput.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "content")] ??= issue.message;
      return { success: false, error: ERROS.camposInvalidos, fieldErrors };
    }
    const latest = await prisma.madrinhaInstructionVersion.findFirst({ orderBy: { version: "desc" }, select: { content: true } });
    if (latest && latest.content.trim() === parsed.data.content) {
      return { success: false, error: "O texto é igual ao da última versão. Mude alguma coisa antes de salvar.", fieldErrors: { content: "Nada mudou neste texto." } };
    }
    const created = await createVersion(parsed.data.content, parsed.data.changeNote, admin);
    await registrarAuditoria({
      action: "madrinha.instructions_save",
      targetType: "madrinha_instructions",
      targetId: created.id,
      details: { version: created.version, changeNote: parsed.data.changeNote, length: parsed.data.content.length },
    });
    refresh();
    return { success: true, message: `Versão ${created.version} salva como rascunho.`, version: created.version };
  } catch (error) {
    return platformAdminFailure(error, "saveInstructionVersion");
  }
}

/** Publica uma versão: ela vira a única publicada e a anterior passa a "arquivada". */
export async function publishInstructionVersion(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const { id } = z.object({ id: z.string().uuid() }).parse(input);
    const target = await prisma.madrinhaInstructionVersion.findUnique({ where: { id }, select: { id: true, version: true, status: true } });
    if (!target) return { success: false, error: "Versão não encontrada." };
    if (target.status === "PUBLISHED") return { success: false, error: "Esta versão já está publicada." };
    const now = new Date();
    const previous = await prisma.$transaction(async (tx) => {
      const old = await tx.madrinhaInstructionVersion.findFirst({ where: { status: "PUBLISHED" }, select: { version: true } });
      await tx.madrinhaInstructionVersion.updateMany({ where: { status: "PUBLISHED" }, data: { status: "ARCHIVED" } });
      await tx.madrinhaInstructionVersion.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: now } });
      return old?.version ?? null;
    });
    await registrarAuditoria({
      action: "madrinha.instructions_publish",
      targetType: "madrinha_instructions",
      targetId: id,
      details: { version: target.version, previousPublished: previous },
    });
    refresh();
    return { success: true, message: `Versão ${target.version} publicada. A Liz só a usará quando for ativada.` };
  } catch (error) {
    return platformAdminFailure(error, "publishInstructionVersion");
  }
}

/** Reverter = criar uma versão nova (rascunho) com o texto de uma antiga. Nada do histórico é apagado. */
export async function revertInstructionVersion(input: unknown): Promise<(Ok & { version: number }) | Fail> {
  try {
    const admin = await requirePlatformAdmin();
    const { id } = z.object({ id: z.string().uuid() }).parse(input);
    const source = await prisma.madrinhaInstructionVersion.findUnique({ where: { id }, select: { id: true, version: true, content: true } });
    if (!source) return { success: false, error: "Versão não encontrada." };
    const created = await createVersion(source.content, `Voltou ao texto da versão ${source.version}`, admin);
    await registrarAuditoria({
      action: "madrinha.instructions_revert",
      targetType: "madrinha_instructions",
      targetId: created.id,
      details: { fromVersion: source.version, newVersion: created.version },
    });
    refresh();
    return { success: true, message: `Criamos a versão ${created.version} com o texto da versão ${source.version}. Publique quando quiser.`, version: created.version };
  } catch (error) {
    return platformAdminFailure(error, "revertInstructionVersion");
  }
}

// ---------------------------------------------------------------------------
// Base de conhecimento
// ---------------------------------------------------------------------------

export async function saveKnowledgeArticle(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const raw = z.object({ status: z.enum(["DRAFT", "PUBLISHED"]) }).passthrough().parse(input);
    const parsed = articleInput.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "content")] ??= issue.message;
      return { success: false, error: ERROS.camposInvalidos, fieldErrors };
    }
    const { id, title, content } = parsed.data;
    const publishing = raw.status === "PUBLISHED";
    let articleId = id;
    if (id) {
      const found = await prisma.madrinhaKnowledgeArticle.findUnique({ where: { id }, select: { id: true, publishedAt: true } });
      if (!found) return { success: false, error: "Texto não encontrado." };
      await prisma.madrinhaKnowledgeArticle.update({
        where: { id },
        data: { title, content, status: raw.status, publishedAt: publishing ? (found.publishedAt ?? new Date()) : null },
      });
    } else {
      const created = await prisma.madrinhaKnowledgeArticle.create({
        data: { title, content, status: raw.status, publishedAt: publishing ? new Date() : null },
        select: { id: true },
      });
      articleId = created.id;
    }
    await registrarAuditoria({
      action: id ? "madrinha.article_update" : "madrinha.article_create",
      targetType: "madrinha_article",
      targetId: articleId,
      details: { title, status: raw.status, length: content.length },
    });
    refresh();
    return { success: true, message: publishing ? "Texto publicado." : "Rascunho salvo." };
  } catch (error) {
    return platformAdminFailure(error, "saveKnowledgeArticle");
  }
}

export async function archiveKnowledgeArticle(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const { id } = z.object({ id: z.string().uuid() }).parse(input);
    const found = await prisma.madrinhaKnowledgeArticle.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!found) return { success: false, error: "Texto não encontrado." };
    await prisma.madrinhaKnowledgeArticle.update({ where: { id }, data: { status: "ARCHIVED" } });
    await registrarAuditoria({ action: "madrinha.article_archive", targetType: "madrinha_article", targetId: id, details: { title: found.title } });
    refresh();
    return { success: true, message: "Texto removido da base." };
  } catch (error) {
    return platformAdminFailure(error, "archiveKnowledgeArticle");
  }
}

// ---------------------------------------------------------------------------
// Ajustes por casal
// ---------------------------------------------------------------------------

const weddingId = z.string().uuid();

async function ensureWedding(id: string) {
  return prisma.wedding.findUnique({ where: { id }, select: { id: true, coupleNames: true } });
}

/** Busca de casais para o seletor (consulta limitada). */
export async function searchMadrinhaWeddings(input: unknown): Promise<{ success: true; hits: WeddingHit[] } | Fail> {
  try {
    await requirePlatformAdmin();
    const { q } = z.object({ q: z.string().max(100) }).parse(input);
    return { success: true, hits: await searchWeddingsForMadrinha(q) };
  } catch (error) {
    return platformAdminFailure(error, "searchMadrinhaWeddings");
  }
}

/** "Aplicar ajuste": mensagens a mais neste mês e uma nota (o motivo). Não mexe em ligado/bloqueado. */
export async function applyWeddingAdjustment(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const data = z.object({ weddingId, extraMessages: z.string().max(8), reason: z.string().trim().max(300) }).parse(input);
    const extra = parseIntField(data.extraMessages);
    if (extra === null || extra > 10_000) return fieldFail({ extraMessages: "Use um número inteiro, até 10.000." });
    if (data.reason.length < 3) return fieldFail({ reason: "Conte o motivo do ajuste (fica no registro)." });
    const wedding = await ensureWedding(data.weddingId);
    if (!wedding) return { success: false, error: ERROS.casalNaoEncontrado };
    await prisma.madrinhaWeddingOverride.upsert({
      where: { weddingId: wedding.id },
      create: { weddingId: wedding.id, extraMessages: extra, note: data.reason },
      update: { extraMessages: extra, note: data.reason },
    });
    await registrarAuditoria({
      action: "madrinha.override_adjust",
      targetType: "wedding",
      targetId: wedding.id,
      details: { extraMessages: extra, reason: data.reason },
    });
    refresh();
    return { success: true, message: `Ajuste aplicado para ${wedding.coupleNames}.` };
  } catch (error) {
    return platformAdminFailure(error, "applyWeddingAdjustment");
  }
}
export async function unblockWeddingMadrinha(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const data = z.object({ weddingId }).parse(input);
    const wedding = await ensureWedding(data.weddingId);
    if (!wedding) return { success: false, error: ERROS.casalNaoEncontrado };
    await prisma.madrinhaWeddingOverride.updateMany({ where: { weddingId: wedding.id }, data: { blockedAt: null, blockedReason: null } });
    await registrarAuditoria({ action: "madrinha.override_unblock", targetType: "wedding", targetId: wedding.id });
    refresh();
    return { success: true, message: `${wedding.coupleNames} foi desbloqueado.` };
  } catch (error) {
    return platformAdminFailure(error, "unblockWeddingMadrinha");
  }
}

/** Ligar ou desligar a Liz de um casal (null = segue o padrão do plano). */
export async function setWeddingMadrinhaEnabled(input: unknown): Promise<Ok | Fail> {
  try {
    await requirePlatformAdmin();
    const data = z.object({ weddingId, enabled: z.boolean().nullable() }).parse(input);
    const wedding = await ensureWedding(data.weddingId);
    if (!wedding) return { success: false, error: ERROS.casalNaoEncontrado };
    await prisma.madrinhaWeddingOverride.upsert({
      where: { weddingId: wedding.id },
      create: { weddingId: wedding.id, enabled: data.enabled },
      update: { enabled: data.enabled },
    });
    await registrarAuditoria({ action: "madrinha.override_enabled", targetType: "wedding", targetId: wedding.id, details: { enabled: data.enabled } });
    refresh();
    return { success: true, message: data.enabled === null ? "Voltou ao padrão." : data.enabled ? "Ligada para este casal." : "Desligada para este casal." };
  } catch (error) {
    return platformAdminFailure(error, "setWeddingMadrinhaEnabled");
  }
}
