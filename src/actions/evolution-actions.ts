"use server";

import { requirePathPermission } from "@/lib/security/auth-guard";

import { getConnectionState, connectInstance } from "@/lib/evolution";

export async function getWhatsAppStatus() {
  await requirePathPermission("/configuracoes");
  return getConnectionState();
}

export async function generateWhatsAppQRCode() {
  await requirePathPermission("/configuracoes");
  return connectInstance();
}
