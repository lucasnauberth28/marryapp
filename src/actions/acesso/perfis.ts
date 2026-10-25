"use server";

// Acesso: perfis (papéis) e os caminhos que cada um libera.
import { registrarAuditoria } from "@/lib/audit";
import { exigirSessaoAutenticada, exigirPermissaoDoCaminho } from "@/lib/security/auth-guard";
import prisma from "@/lib/prisma";
import { ehViolacaoDeUnicidade } from "@/lib/prisma-erros";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ERROS } from "@/lib/mensagens-de-erro";
import { garantirQuePodeConceder } from "@/actions/acesso/comum";

export async function obterPerfis() {
  await exigirSessaoAutenticada();
  return prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });
}

const EsquemaDoPerfil = z.object({
  name: z.string().trim().min(2, "Informe o nome do perfil.").max(60),
  allowedPaths: z.array(z.string().regex(/^(\*|\/[a-z0-9\-/]*)$/, "Módulo inválido.")).max(50),
});

export async function criarPerfil(data: { name: string; allowedPaths: string[] }) {
  const session = await exigirPermissaoDoCaminho("/perfis");
  const parsed = EsquemaDoPerfil.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  garantirQuePodeConceder(session.allowedPaths, parsed.data.allowedPaths);

  try {
    const role = await prisma.role.create({ data: parsed.data });
    await registrarAuditoria({
      action: "role.create",
      targetType: "role",
      targetId: role.id,
      details: { name: role.name, allowedPaths: parsed.data.allowedPaths },
    });
    revalidatePath("/perfis");
    revalidatePath("/admin/usuarios");
    return { success: true, role };
  } catch (error) {
    if (ehViolacaoDeUnicidade(error)) {
      return { success: false, error: "Já existe um perfil com esse nome." };
    }
    return { success: false, error: "Erro ao criar perfil." };
  }
}

export async function atualizarPerfil(id: string, data: { name: string; allowedPaths: string[] }) {
  const session = await exigirPermissaoDoCaminho("/perfis");
  const parsed = EsquemaDoPerfil.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const current = await prisma.role.findUnique({ where: { id }, select: { name: true, allowedPaths: true } });
  if (!current) return { success: false, error: ERROS.perfilNaoEncontrado };
  garantirQuePodeConceder(session.allowedPaths, current.allowedPaths);
  garantirQuePodeConceder(session.allowedPaths, parsed.data.allowedPaths);

  try {
    const role = await prisma.role.update({ where: { id }, data: parsed.data });
    await registrarAuditoria({
      action: "role.update",
      targetType: "role",
      targetId: id,
      details: {
        name: role.name,
        previousName: current.name,
        previousPaths: Array.isArray(current.allowedPaths) ? (current.allowedPaths as string[]) : [],
        allowedPaths: parsed.data.allowedPaths,
      },
    });
    revalidatePath("/perfis");
    revalidatePath("/admin/usuarios");
    return { success: true, role };
  } catch {
    return { success: false, error: "Erro ao atualizar perfil." };
  }
}

export async function excluirPerfil(id: string) {
  const session = await exigirPermissaoDoCaminho("/perfis");
  const current = await prisma.role.findUnique({ where: { id }, select: { name: true, allowedPaths: true } });
  if (!current) return { success: false, error: ERROS.perfilNaoEncontrado };
  garantirQuePodeConceder(session.allowedPaths, current.allowedPaths);

  try {
    await prisma.role.delete({ where: { id } });
    await registrarAuditoria({ action: "role.delete", targetType: "role", targetId: id, details: { name: current.name } });
    revalidatePath("/perfis");
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao excluir perfil. Pode haver usuários vinculados." };
  }
}
