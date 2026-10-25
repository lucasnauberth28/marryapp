import { NextResponse } from "next/server";
import { protecaoDaApiDeAdminDaPlataforma } from "@/lib/security/platform-admin";

/**
 * Quem está na administração (modelo das rotas de API do /admin e alvo do teste de acesso negado).
 * Toda rota em /api/admin/* começa com platformAdminApiGuard(): 401 sem sessão, 403 sem acesso total.
 */
export async function GET() {
  const { ctx, response } = await protecaoDaApiDeAdminDaPlataforma();
  if (response) return response;
  return NextResponse.json({ ok: true, name: ctx.name, emergency: ctx.isEmergencyAccount }, { headers: { "cache-control": "no-store" } });
}
