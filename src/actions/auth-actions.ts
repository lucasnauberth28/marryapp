"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
