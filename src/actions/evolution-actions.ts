"use server";

import { requireWedding } from "@/lib/security/wedding-context";

import { getConnectionState, connectInstance } from "@/lib/evolution";

export async function getWhatsAppStatus() {
  await requireWedding("/configuracoes");
  return getConnectionState();
}

export async function generateWhatsAppQRCode() {
  await requireWedding("/configuracoes");
  return connectInstance();
}
