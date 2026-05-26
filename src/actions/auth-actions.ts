"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "marryapp_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function login(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD não configurado nas variáveis de ambiente.");
  }

  if (password === adminPassword) {
    // Definimos uma string qualquer para indicar que está logado
    // Em um cenário real com db auth, seria um JWT.
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    
    return { success: true };
  } else {
    return { success: false, error: "Senha incorreta." };
  }
import { supabase } from "@/lib/supabase";

const SESSION_COOKIE_NAME = "sb-access-token";

export async function login(state: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Por favor, preencha todos os campos." };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return { error: error?.message || "E-mail ou senha inválidos." };
    }

    // Armazenar o token de acesso em um cookie seguro
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: data.session.expires_in,
      sameSite: "lax",
      path: "/",
    });

  } catch (err) {
    console.error("[Login Error]:", err);
    return { error: "Ocorreu um erro ao tentar fazer login." };
  }

  // Redirecionamento após o sucesso
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

/**
 * Verifica se o usuário tem uma sessão válida do Supabase.
 * Se não tiver, redireciona imediatamente para /login.
 */
export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    // Token inválido ou expirado
    cookieStore.delete(SESSION_COOKIE_NAME);
    redirect("/login");
  }

  return user;
}
