"use server";

// Acesso: pessoas da equipe e o perfil de cada uma.
import { registrarAuditoria } from "@/lib/audit";
import { exigirPermissaoDoCaminho } from "@/lib/security/auth-guard";
import prisma from "@/lib/prisma";
import { ehViolacaoDeUnicidade } from "@/lib/prisma-erros";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { ERROS } from "@/lib/mensagens-de-erro";
import { garantirQuePodeConceder } from "@/actions/acesso/comum";

const REGRA_DA_SENHA = z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(200);

const EsquemaDaPessoa = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  username: z.string().trim().min(3, "Login muito curto.").max(120),
  password: z.string().optional(),
  roleId: z.string().uuid("Perfil inválido."),
});

/**
 * Impede escalada de privilégio: só quem tem acesso total pode criar/atribuir perfis com acesso total
 * ou conceder módulos que ele próprio não possui.
 */

export async function obterPessoas() {
  await exigirPermissaoDoCaminho("/usuarios");
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    // Nunca selecionar o hash da senha
    select: {
      id: true,
      name: true,
      username: true,
      roleId: true,
      createdAt: true,
      updatedAt: true,
      role: true,
    },
  });
}

async function garantirQueOPerfilPodeSerAtribuido(sessionPaths: string[], roleId: string) {
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { allowedPaths: true } });
  if (!role) return false;
  garantirQuePodeConceder(sessionPaths, role.allowedPaths);
  return true;
}

export async function criarPessoa(data: { name: string; username: string; password?: string; roleId: string }) {
  const session = await exigirPermissaoDoCaminho("/usuarios");
  const parsed = EsquemaDaPessoa.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const password = REGRA_DA_SENHA.safeParse(parsed.data.password ?? "");
  if (!password.success) return { success: false, error: password.error.issues[0].message };
  if (!(await garantirQueOPerfilPodeSerAtribuido(session.allowedPaths, parsed.data.roleId))) {
    return { success: false, error: ERROS.perfilNaoEncontrado };
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        username: parsed.data.username,
        password: await bcrypt.hash(password.data, 12),
        roleId: parsed.data.roleId,
      },
      select: { id: true },
    });
    await registrarAuditoria({
      action: "user.create",
      targetType: "user",
      targetId: user.id,
      details: { name: parsed.data.name, username: parsed.data.username, roleId: parsed.data.roleId },
    });
    revalidatePath("/usuarios");
    revalidatePath("/admin/usuarios");
    return { success: true, user: { id: user.id } };
  } catch (error) {
    if (ehViolacaoDeUnicidade(error)) {
      return { success: false, error: "Já existe um usuário com este login." };
    }
    return { success: false, error: "Erro ao criar usuário." };
  }
}

export async function atualizarPessoa(id: string, data: { name: string; username: string; password?: string; roleId: string }) {
  const session = await exigirPermissaoDoCaminho("/usuarios");
  const parsed = EsquemaDaPessoa.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const target = await prisma.user.findUnique({
    where: { id },
    select: { roleId: true, username: true, role: { select: { allowedPaths: true } } },
  });
  if (!target) return { success: false, error: "Usuário não encontrado." };
  garantirQuePodeConceder(session.allowedPaths, target.role.allowedPaths);
  if (!(await garantirQueOPerfilPodeSerAtribuido(session.allowedPaths, parsed.data.roleId))) {
    return { success: false, error: ERROS.perfilNaoEncontrado };
  }

  const updateData: Prisma.UserUncheckedUpdateInput = {
    name: parsed.data.name,
    username: parsed.data.username,
    roleId: parsed.data.roleId,
  };

  if (parsed.data.password && parsed.data.password.trim() !== "") {
    const password = REGRA_DA_SENHA.safeParse(parsed.data.password);
    if (!password.success) return { success: false, error: password.error.issues[0].message };
    updateData.password = await bcrypt.hash(password.data, 12);
  }

  try {
    await prisma.user.update({ where: { id }, data: updateData, select: { id: true } });
    await registrarAuditoria({
      action: "user.update",
      targetType: "user",
      targetId: id,
      details: { username: parsed.data.username, previousUsername: target.username, roleId: parsed.data.roleId, previousRoleId: target.roleId, passwordChanged: Boolean(updateData.password) },
    });
    revalidatePath("/usuarios");
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error) {
    if (ehViolacaoDeUnicidade(error)) return { success: false, error: "Já existe um usuário com este login." };
    return { success: false, error: "Erro ao atualizar usuário." };
  }
}

export async function excluirPessoa(id: string) {
  const session = await exigirPermissaoDoCaminho("/usuarios");
  if (session.userId === id) {
    return { success: false, error: "Você não pode excluir o próprio usuário." };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { name: true, username: true, role: { select: { name: true, allowedPaths: true } } },
  });
  if (!target) return { success: false, error: "Usuário não encontrado." };
  garantirQuePodeConceder(session.allowedPaths, target.role.allowedPaths);

  try {
    await prisma.user.delete({ where: { id }, select: { id: true } });
    await registrarAuditoria({
      action: "user.delete",
      targetType: "user",
      targetId: id,
      details: { name: target.name, username: target.username, role: target.role.name },
    });
    revalidatePath("/usuarios");
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao excluir usuário." };
  }
}
