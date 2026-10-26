"use server";

// Cadastro de conta pelo plano (casal ou fornecedor), com e-mail e senha: cria a conta e abre a sessão.
import { registrarConta } from "@/actions/assinatura/cadastro-nucleo";
import type { DadosDoCadastroDoPlano } from "@/actions/assinatura/cadastro-comum";

export async function cadastrarContaDoPlano(data: DadosDoCadastroDoPlano) {
  return registrarConta(data, { tipo: "senha" });
}
