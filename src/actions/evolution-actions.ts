"use server";

import { getConnectionState, connectInstance } from "@/lib/evolution";
import { verifyAdminSession } from "@/actions/auth-actions";

export async function getWhatsAppStatus() {
  await verifyAdminSession();
  return getConnectionState();
}

export async function generateWhatsAppQRCode() {
  await verifyAdminSession();
  return connectInstance();
}
