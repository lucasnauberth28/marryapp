"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "marryapp_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function login(password: string, username?: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Fallback de emergência (Super Admin)
  if (adminPassword && password === adminPassword && (!username || username === "admin")) {
    const token = await signToken({
      userId: "super-admin",
      role: "Super Admin",
      allowedPaths: ["*"] // acesso a tudo
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    
    return { success: true };
  }

  // Validação real via Banco de Dados
  if (username) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });

    if (user && bcrypt.compareSync(password, user.password)) {
      const allowedPaths = Array.isArray(user.role.allowedPaths) 
        ? user.role.allowedPaths as string[] 
        : [];

      const token = await signToken({
        userId: user.id,
        role: user.role.name,
        allowedPaths,
      });

      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      });

      return { success: true };
    }
  }

  return { success: false, error: "Usuário ou senha incorretos." };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}

export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  return true;
}
