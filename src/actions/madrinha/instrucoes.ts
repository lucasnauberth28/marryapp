"use server";

// Administração da Liz: versões das instruções (salvar rascunho, publicar e reverter).
import { z } from "zod";
import prisma from "@/lib/prisma";
import { ehViolacaoDeUnicidade } from "@/lib/prisma-erros";
import { registrarAuditoria } from "@/lib/audit";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { entradaDasInstrucoes, proximaVersao } from "@/lib/platform/madrinha";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type Falha, type Sucesso, atualizarPaginas } from "@/actions/madrinha/comum";

/** Cria a versão seguinte com o conteúdo dado (rascunho). Repete se duas pessoas salvarem ao mesmo tempo. */
async function criarVersao(content: string, changeNote: string, author: { userId: string; name: string | null }) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const versions = await prisma.madrinhaInstructionVersion.findMany({ select: { version: true } });
    const version = proximaVersao(versions.map((v) => v.version));
    try {
      return await prisma.madrinhaInstructionVersion.create({
        data: { version, content, changeNote, status: "DRAFT", createdById: author.userId, createdByName: author.name ?? "Administrador" },
        select: { id: true, version: true },
      });
    } catch (error) {
      if (!ehViolacaoDeUnicidade(error)) throw error;
    }
  }
  throw new Error("Não foi possível numerar a versão.");
}

export async function salvarVersaoDasInstrucoes(input: unknown): Promise<(Sucesso & { version: number }) | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const parsed = entradaDasInstrucoes.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "content")] ??= issue.message;
      return { success: false, error: ERROS.camposInvalidos, fieldErrors };
    }
    const latest = await prisma.madrinhaInstructionVersion.findFirst({ orderBy: { version: "desc" }, select: { content: true } });
    if (latest && latest.content.trim() === parsed.data.content) {
      return { success: false, error: "O texto é igual ao da última versão. Mude alguma coisa antes de salvar.", fieldErrors: { content: "Nada mudou neste texto." } };
    }
    const created = await criarVersao(parsed.data.content, parsed.data.changeNote, admin);
    await registrarAuditoria({
      action: "madrinha.instructions_save",
      targetType: "madrinha_instructions",
      targetId: created.id,
      details: { version: created.version, changeNote: parsed.data.changeNote, length: parsed.data.content.length },
    });
    atualizarPaginas();
    return { success: true, message: `Versão ${created.version} salva como rascunho.`, version: created.version };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "saveInstructionVersion");
  }
}

/** Publica uma versão: ela vira a única publicada e a anterior passa a "arquivada". */
export async function publicarVersaoDasInstrucoes(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
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
    atualizarPaginas();
    return { success: true, message: `Versão ${target.version} publicada. A Liz só a usará quando for ativada.` };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "publishInstructionVersion");
  }
}

/** Reverter = criar uma versão nova (rascunho) com o texto de uma antiga. Nada do histórico é apagado. */
export async function reverterVersaoDasInstrucoes(input: unknown): Promise<(Sucesso & { version: number }) | Falha> {
  try {
    const admin = await exigirAdminDaPlataforma();
    const { id } = z.object({ id: z.string().uuid() }).parse(input);
    const source = await prisma.madrinhaInstructionVersion.findUnique({ where: { id }, select: { id: true, version: true, content: true } });
    if (!source) return { success: false, error: "Versão não encontrada." };
    const created = await criarVersao(source.content, `Voltou ao texto da versão ${source.version}`, admin);
    await registrarAuditoria({
      action: "madrinha.instructions_revert",
      targetType: "madrinha_instructions",
      targetId: created.id,
      details: { fromVersion: source.version, newVersion: created.version },
    });
    atualizarPaginas();
    return { success: true, message: `Criamos a versão ${created.version} com o texto da versão ${source.version}. Publique quando quiser.`, version: created.version };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "revertInstructionVersion");
  }
}
