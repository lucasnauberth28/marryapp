"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// ==========================================
// ROLES (PERFIS)
// ==========================================

export async function getRoles() {
  return prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });
}

export async function createRole(data: { name: string; allowedPaths: string[] }) {
  try {
    const role = await prisma.role.create({
      data: {
        name: data.name,
        allowedPaths: data.allowedPaths,
      },
    });
    revalidatePath("/perfis");
    return { success: true, role };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Já existe um perfil com esse nome." };
    }
    return { success: false, error: "Erro ao criar perfil." };
  }
}

export async function updateRole(id: string, data: { name: string; allowedPaths: string[] }) {
  try {
    const role = await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        allowedPaths: data.allowedPaths,
      },
    });
    revalidatePath("/perfis");
    return { success: true, role };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar perfil." };
  }
}

export async function deleteRole(id: string) {
  try {
    await prisma.role.delete({ where: { id } });
    revalidatePath("/perfis");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir perfil. Pode haver usuários vinculados." };
  }
}

// ==========================================
// USERS (USUÁRIOS)
// ==========================================

export async function getUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    include: {
      role: true,
    },
    // Não retornamos a senha por segurança
  });
}

export async function createUser(data: { name: string; username: string; password?: string; roleId: string }) {
  try {
    const hashedPassword = data.password ? bcrypt.hashSync(data.password, 10) : bcrypt.hashSync("123456", 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        password: hashedPassword,
        roleId: data.roleId,
      },
    });
    revalidatePath("/usuarios");
    return { success: true, user: { id: user.id } }; // esconde a senha no retorno
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Já existe um usuário com este login." };
    }
    return { success: false, error: "Erro ao criar usuário." };
  }
}

export async function updateUser(id: string, data: { name: string; username: string; password?: string; roleId: string }) {
  try {
    const updateData: any = {
      name: data.name,
      username: data.username,
      roleId: data.roleId,
    };

    if (data.password && data.password.trim() !== "") {
      updateData.password = bcrypt.hashSync(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    revalidatePath("/usuarios");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "Já existe um usuário com este login." };
    }
    return { success: false, error: "Erro ao atualizar usuário." };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/usuarios");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir usuário." };
  }
}
