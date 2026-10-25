import { NextResponse } from "next/server";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { montarExportacaoDaConta } from "@/lib/account/export-data";

export const dynamic = "force-dynamic";

/**
 * Portabilidade (LGPD, art. 18): baixa em JSON os dados da conta logada.
 * Casal: perfil + o casamento inteiro. Fornecedor: perfil + vitrine, pedidos, avaliações e agenda.
 * Nunca inclui hashes de senha ou de tokens.
 */
export async function GET() {
  const session = await obterSessao();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.userId === ID_DO_SUPER_ADMIN) {
    return NextResponse.json({ error: "A conta de emergência não tem dados próprios." }, { status: 400 });
  }

  const limit = await conferirLimiteDeUso({ key: `ACCOUNT_EXPORT:${session.userId}`, limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.success) return NextResponse.json({ error: "Muitas exportações seguidas. Aguarde alguns minutos." }, { status: 429 });

  try {
    const exported = await montarExportacaoDaConta(session.userId);
    if (!exported) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    console.error("[conta/exportar]", error);
    return NextResponse.json({ error: "Não foi possível exportar agora." }, { status: 500 });
  }
}
