import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { buildAccountExport } from "@/lib/account/export-data";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { platformAdminApiGuard } from "@/lib/security/platform-admin";

import { ERROS } from "@/lib/mensagens-de-erro";
export const dynamic = "force-dynamic";

/**
 * Exportação dos dados de um titular para atender um pedido de dados pessoais (LGPD), só para a administração.
 * GET /api/admin/suporte/exportar?pedido=<id do pedido>. O pedido precisa ser de EXPORTAÇÃO e estar ligado a uma conta.
 * O mesmo exportador de "Minha conta" (sem senhas nem tokens). Cada download vai ao registro de atividades.
 */
export async function GET(req: Request) {
  const { ctx, response } = await platformAdminApiGuard();
  if (response) return response;

  const id = new URL(req.url).searchParams.get("pedido") ?? "";
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: ERROS.pedidoInvalido }, { status: 400, headers: { "cache-control": "no-store" } });

  const limit = await checkRateLimit({ key: `ADMIN_DATA_EXPORT:${ctx.userId}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limit.success) return NextResponse.json({ error: "Muitas exportações seguidas. Aguarde alguns minutos." }, { status: 429 });

  try {
    const request = await prisma.dataRequest.findUnique({ where: { id }, select: { id: true, type: true, userId: true } });
    if (!request || request.type !== "EXPORT") return NextResponse.json({ error: "Pedido de exportação não encontrado." }, { status: 404 });
    if (!request.userId) return NextResponse.json({ error: "Este pedido não está ligado a uma conta." }, { status: 409 });

    const exported = await buildAccountExport(request.userId);
    if (!exported) return NextResponse.json({ error: "A conta não existe mais." }, { status: 404 });

    await logAudit({ action: "data_request.export", targetType: "data_request", targetId: request.id, details: { userId: request.userId, bytes: exported.json.length } });
    return new NextResponse(exported.json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exported.filename}"`,
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[admin/suporte/exportar]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Não foi possível exportar agora." }, { status: 500 });
  }
}
