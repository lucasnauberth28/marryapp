"use server";

// Administração da Liz: artigos da base de conhecimento.
import { z } from "zod";
import prisma from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { falhaDeAdminDaPlataforma, exigirAdminDaPlataforma } from "@/lib/security/platform-admin";
import { entradaDoArtigo } from "@/lib/platform/madrinha";
import { ERROS } from "@/lib/mensagens-de-erro";
import { type Falha, type Sucesso, atualizarPaginas } from "@/actions/madrinha/comum";

export async function salvarArtigoDeConhecimento(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const raw = z.object({ status: z.enum(["DRAFT", "PUBLISHED"]) }).passthrough().parse(input);
    const parsed = entradaDoArtigo.safeParse(input);
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
    atualizarPaginas();
    return { success: true, message: publishing ? "Texto publicado." : "Rascunho salvo." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "saveKnowledgeArticle");
  }
}

export async function arquivarArtigoDeConhecimento(input: unknown): Promise<Sucesso | Falha> {
  try {
    await exigirAdminDaPlataforma();
    const { id } = z.object({ id: z.string().uuid() }).parse(input);
    const found = await prisma.madrinhaKnowledgeArticle.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!found) return { success: false, error: "Texto não encontrado." };
    await prisma.madrinhaKnowledgeArticle.update({ where: { id }, data: { status: "ARCHIVED" } });
    await registrarAuditoria({ action: "madrinha.article_archive", targetType: "madrinha_article", targetId: id, details: { title: found.title } });
    atualizarPaginas();
    return { success: true, message: "Texto removido da base." };
  } catch (error) {
    return falhaDeAdminDaPlataforma(error, "archiveKnowledgeArticle");
  }
}
