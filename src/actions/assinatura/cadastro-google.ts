"use server";

// Cadastro de quem chegou pelo Google: o e-mail e o identificador vêm do cookie assinado do retorno (nunca do formulário).
import { cookies } from "next/headers";
import { registrarConta } from "@/actions/assinatura/cadastro-nucleo";
import type { DadosDoCadastroDoPlano } from "@/actions/assinatura/cadastro-comum";
import { lerPerfilPendente } from "@/lib/google/cookies";
import { valorAleatorio } from "@/lib/google/pkce";
import { COOKIE_DO_PERFIL_PENDENTE, segredoDoFluxoDoGoogle } from "@/lib/google/servidor";

export type DadosDoCadastroComGoogle = Omit<DadosDoCadastroDoPlano, "email" | "password">;

export async function cadastrarContaComGoogle(data: DadosDoCadastroComGoogle) {
  const armazem = await cookies();
  const perfil = await lerPerfilPendente(armazem.get(COOKIE_DO_PERFIL_PENDENTE)?.value, segredoDoFluxoDoGoogle());
  if (!perfil) return { success: false, error: "A conexão com o Google expirou. Toque em “Continuar com o Google” para tentar de novo." };

  // A senha é um valor descartável só para passar na validação: a conta nasce sem senha (ver acessoDaConta)
  const resposta = await registrarConta({ ...data, email: perfil.email, password: valorAleatorio() }, { tipo: "google", perfil });
  if (resposta.success) armazem.delete(COOKIE_DO_PERFIL_PENDENTE);
  return resposta;
}
