"use server";

import { exigirCasamentoParaLeitura } from "@/lib/security/wedding-context";

import { obterEstadoDaConexao } from "@/lib/whatsapp/instancia";

/**
 * Estado da conexão do WhatsApp do Aceito (um número só, da plataforma). O casal só consulta:
 * parear ou trocar o aparelho é da administração da plataforma (reconnectWhatsapp, em /admin/saude),
 * porque a conexão é compartilhada por todos os casamentos.
 */
export async function obterSituacaoDoWhatsapp() {
  await exigirCasamentoParaLeitura("/configuracoes");
  return obterEstadoDaConexao();
}
