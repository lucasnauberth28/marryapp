"use server";

import { logAudit } from "@/lib/audit";
import { requireAuthSession, requirePathPermission, AuthorizationError } from "@/lib/security/auth-guard";
import { hasPathAccess } from "@/lib/auth";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ==========================================
// ROLES (PERFIS)
// ==========================================

export async function getRoles() {
  await requireAuthSession();
  return prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });
}

const RoleSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do perfil.").max(60),
  allowedPaths: z.array(z.string().regex(/^(\*|\/[a-z0-9\-/]*)$/, "Módulo inválido.")).max(50),
});

const PASSWORD_RULE = z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(200);

const UserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  username: z.string().trim().min(3, "Login muito curto.").max(120),
  password: z.string().optional(),
  roleId: z.string().uuid("Perfil inválido."),
});

function isFullAccess(paths: unknown) {
  return Array.isArray(paths) && paths.includes("*");
}

/**
 * Impede escalada de privilégio: só quem tem acesso total pode criar/atribuir perfis com acesso total
 * ou conceder módulos que ele próprio não possui.
 */
function assertCanGrant(sessionPaths: string[], grantedPaths: unknown) {
  if (sessionPaths.includes("*")) return;
  const granted = Array.isArray(grantedPaths) ? (grantedPaths as string[]) : [];
  if (granted.some((p) => !hasPathAccess(sessionPaths, p))) {
    throw new AuthorizationError("Acesso negado: você não pode conceder permissões que não possui.");
  }
}

function prismaErrorCode(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
}

export async function createRole(data: { name: string; allowedPaths: string[] }) {
  const session = await requirePathPermission("/perfis");
  const parsed = RoleSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  assertCanGrant(session.allowedPaths, parsed.data.allowedPaths);

  try {
    const role = await prisma.role.create({ data: parsed.data });
    await logAudit({
      action: "role.create",
      targetType: "role",
      targetId: role.id,
      details: { name: role.name, allowedPaths: parsed.data.allowedPaths },
    });
    revalidatePath("/perfis");
    return { success: true, role };
  } catch (error) {
    if (prismaErrorCode(error) === "P2002") {
      return { success: false, error: "Já existe um perfil com esse nome." };
    }
    return { success: false, error: "Erro ao criar perfil." };
  }
}

export async function updateRole(id: string, data: { name: string; allowedPaths: string[] }) {
  const session = await requirePathPermission("/perfis");
  const parsed = RoleSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const current = await prisma.role.findUnique({ where: { id }, select: { name: true, allowedPaths: true } });
  if (!current) return { success: false, error: "Perfil não encontrado." };
  assertCanGrant(session.allowedPaths, current.allowedPaths);
  assertCanGrant(session.allowedPaths, parsed.data.allowedPaths);

  try {
    const role = await prisma.role.update({ where: { id }, data: parsed.data });
    await logAudit({
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
    return { success: true, role };
  } catch {
    return { success: false, error: "Erro ao atualizar perfil." };
  }
}

export async function deleteRole(id: string) {
  const session = await requirePathPermission("/perfis");
  const current = await prisma.role.findUnique({ where: { id }, select: { name: true, allowedPaths: true } });
  if (!current) return { success: false, error: "Perfil não encontrado." };
  assertCanGrant(session.allowedPaths, current.allowedPaths);

  try {
    await prisma.role.delete({ where: { id } });
    await logAudit({ action: "role.delete", targetType: "role", targetId: id, details: { name: current.name } });
    revalidatePath("/perfis");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao excluir perfil. Pode haver usuários vinculados." };
  }
}

// ==========================================
// USERS (USUÁRIOS)
// ==========================================

export async function getUsers() {
  await requirePathPermission("/usuarios");
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

async function assertRoleAssignable(sessionPaths: string[], roleId: string) {
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { allowedPaths: true } });
  if (!role) return false;
  assertCanGrant(sessionPaths, role.allowedPaths);
  return true;
}

export async function createUser(data: { name: string; username: string; password?: string; roleId: string }) {
  const session = await requirePathPermission("/usuarios");
  const parsed = UserSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
  const password = PASSWORD_RULE.safeParse(parsed.data.password ?? "");
  if (!password.success) return { success: false, error: password.error.issues[0].message };
  if (!(await assertRoleAssignable(session.allowedPaths, parsed.data.roleId))) {
    return { success: false, error: "Perfil não encontrado." };
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
    await logAudit({
      action: "user.create",
      targetType: "user",
      targetId: user.id,
      details: { name: parsed.data.name, username: parsed.data.username, roleId: parsed.data.roleId },
    });
    revalidatePath("/usuarios");
    return { success: true, user: { id: user.id } };
  } catch (error) {
    if (prismaErrorCode(error) === "P2002") {
      return { success: false, error: "Já existe um usuário com este login." };
    }
    return { success: false, error: "Erro ao criar usuário." };
  }
}

export async function updateUser(id: string, data: { name: string; username: string; password?: string; roleId: string }) {
  const session = await requirePathPermission("/usuarios");
  const parsed = UserSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

  const target = await prisma.user.findUnique({
    where: { id },
    select: { roleId: true, username: true, role: { select: { allowedPaths: true } } },
  });
  if (!target) return { success: false, error: "Usuário não encontrado." };
  assertCanGrant(session.allowedPaths, target.role.allowedPaths);
  if (!(await assertRoleAssignable(session.allowedPaths, parsed.data.roleId))) {
    return { success: false, error: "Perfil não encontrado." };
  }

  const updateData: Prisma.UserUncheckedUpdateInput = {
    name: parsed.data.name,
    username: parsed.data.username,
    roleId: parsed.data.roleId,
  };

  if (parsed.data.password && parsed.data.password.trim() !== "") {
    const password = PASSWORD_RULE.safeParse(parsed.data.password);
    if (!password.success) return { success: false, error: password.error.issues[0].message };
    updateData.password = await bcrypt.hash(password.data, 12);
  }

  try {
    await prisma.user.update({ where: { id }, data: updateData, select: { id: true } });
    await logAudit({
      action: "user.update",
      targetType: "user",
      targetId: id,
      details: {
        username: parsed.data.username,
        previousUsername: target.username,
        roleId: parsed.data.roleId,
        previousRoleId: target.roleId,
        passwordChanged: Boolean(updateData.password),
      },
    });
    revalidatePath("/usuarios");
    return { success: true };
  } catch (error) {
    if (prismaErrorCode(error) === "P2002") {
      return { success: false, error: "Já existe um usuário com este login." };
    }
    return { success: false, error: "Erro ao atualizar usuário." };
  }
}

export async function deleteUser(id: string) {
  const session = await requirePathPermission("/usuarios");
  if (session.userId === id) {
    return { success: false, error: "Você não pode excluir o próprio usuário." };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { name: true, username: true, role: { select: { name: true, allowedPaths: true } } },
  });
  if (!target) return { success: false, error: "Usuário não encontrado." };
  assertCanGrant(session.allowedPaths, target.role.allowedPaths);

  try {
    await prisma.user.delete({ where: { id }, select: { id: true } });
    await logAudit({
      action: "user.delete",
      targetType: "user",
      targetId: id,
      details: { name: target.name, username: target.username, role: target.role.name },
    });
    revalidatePath("/usuarios");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao excluir usuário." };
  }
}
