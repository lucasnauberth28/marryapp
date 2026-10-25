import { NextResponse } from "next/server";
import { obterManutencao } from "@/lib/platform/maintenance";

/**
 * Estado público do modo de manutenção (só o que a pessoa precisa ver: ligado, mensagem e hora de volta).
 * As páginas estáticas do site do casamento consultam aqui para mostrar o aviso aos convidados.
 * Cache curto de 30 s, o mesmo da leitura no servidor.
 */
export async function GET() {
  const state = await obterManutencao();
  return NextResponse.json(
    { enabled: state.enabled, message: state.enabled ? state.message : "", backAt: state.enabled ? state.backAt : null },
    { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=30" } },
  );
}
