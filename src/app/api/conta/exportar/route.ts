import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, SUPER_ADMIN_USER_ID } from "@/lib/security/auth-guard";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { classifyAccount } from "@/lib/account/wedding-provisioning";

export const dynamic = "force-dynamic";

/**
 * Portabilidade (LGPD, art. 18): baixa em JSON os dados da conta logada.
 * Casal: perfil + o casamento inteiro. Fornecedor: perfil + vitrine, pedidos, avaliações e agenda.
 * Nunca inclui hashes de senha ou de tokens.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.userId === SUPER_ADMIN_USER_ID) {
    return NextResponse.json({ error: "A conta de emergência não tem dados próprios." }, { status: 400 });
  }

  const limit = await checkRateLimit({ key: `ACCOUNT_EXPORT:${session.userId}`, limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.success) return NextResponse.json({ error: "Muitas exportações seguidas. Aguarde alguns minutos." }, { status: 429 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        weddingId: true,
        partnerVendorId: true,
        role: { select: { name: true, allowedPaths: true } },
        subscriptions: {
          select: {
            id: true,
            planId: true,
            planType: true,
            planName: true,
            modules: true,
            couponCode: true,
            discount: true,
            credit: true,
            amount: true,
            status: true,
            paidAt: true,
            periodEnd: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const kind = classifyAccount(user);

    const wedding =
      kind !== "vendor" && user.weddingId
        ? await prisma.wedding.findUnique({
            where: { id: user.weddingId },
            include: {
              members: { select: { id: true, name: true, username: true, createdAt: true } },
              invites: { select: { id: true, email: true, createdAt: true, expiresAt: true, usedAt: true } },
              settings: true,
              site: true,
              wallet: true,
              guests: true,
              timeline: true,
              tables: true,
              gifts: true,
              transactions: true,
              vendors: true,
              expenses: true,
              tasks: true,
              honeymoon: true,
              templates: true,
              creditCards: true,
              story: true,
              tips: true,
              guestbook: true,
            },
          })
        : null;

    const vendorProfile = user.partnerVendorId
      ? await prisma.partnerVendor.findUnique({
          where: { id: user.partnerVendorId },
          include: { leads: true, reviews: true, events: true, profileViews: true },
        })
      : null;

    const exportedAt = new Date();
    const payload = {
      exportedAt: exportedAt.toISOString(),
      notice:
        "Cópia dos seus dados no Aceito (LGPD, art. 18, V). Valores em dinheiro estão em centavos. Senhas e tokens não são exportados.",
      account: {
        id: user.id,
        name: user.name,
        email: user.username,
        type: kind,
        role: user.role.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      subscriptions: user.subscriptions,
      wedding,
      vendorProfile,
    };

    const filename = `aceito-meus-dados-${exportedAt.toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[conta/exportar]", error);
    return NextResponse.json({ error: "Não foi possível exportar agora." }, { status: 500 });
  }
}
