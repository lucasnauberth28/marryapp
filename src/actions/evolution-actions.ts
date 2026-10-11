"use server";

import { requireWedding, requireWeddingRead } from "@/lib/security/wedding-context";

import { getConnectionState, connectInstance } from "@/lib/evolution";

export async function getWhatsAppStatus() {
  await requireWeddingRead("/configuracoes");
  return getConnectionState();
}

export async function generateWhatsAppQRCode() {
  await requireWedding("/configuracoes");
  return connectInstance();
}
