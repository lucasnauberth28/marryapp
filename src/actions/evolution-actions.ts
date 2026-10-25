"use server";

import { requireWeddingRead } from "@/lib/security/wedding-context";

import { obterEstadoDaConexao } from "@/lib/evolution";

/**
 * Estado da conexão do WhatsApp do Aceito (um número só, da plataforma). O casal só consulta:
 * parear ou trocar o aparelho é da administração da plataforma (reconnectWhatsapp, em /admin/saude),
 * porque a conexão é compartilhada por todos os casamentos.
 */
export async function getWhatsAppStatus() {
  await requireWeddingRead("/configuracoes");
  return obterEstadoDaConexao();
}
