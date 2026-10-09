import "server-only";
import { after } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/security/auth-guard";
import { todayBrasilia } from "@/app/(fornecedor)/_lib/vendor-panel";

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|monitor|headless|lighthouse/i;

/**
 * Conta uma visita ao perfil público (um contador por fornecedor e dia, em Brasília).
 * Não é uma Server Action: só a página do perfil chama, no servidor.
 * Ignora robôs, prefetch do Next e o próprio fornecedor vendo o perfil.
 * A gravação roda depois da resposta (after), sem atrasar a página.
 */
export async function recordVendorProfileView(vendorId: string): Promise<void> {
  try {
    const h = await headers();
    if (h.get("next-router-prefetch") || h.get("purpose") === "prefetch" || h.get("sec-purpose")?.includes("prefetch")) return;
    if (BOT_UA.test(h.get("user-agent") ?? "")) return;

    const session = await getSession();
    const day = todayBrasilia();

    after(async () => {
      try {
        if (session) {
          const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { partnerVendorId: true } });
          if (user?.partnerVendorId === vendorId) return;
        }
        await prisma.vendorProfileView.upsert({
          where: { vendorId_day: { vendorId, day } },
          create: { vendorId, day, count: 1 },
          update: { count: { increment: 1 } },
        });
      } catch (error) {
        console.error("[recordVendorProfileView Error]:", error);
      }
    });
  } catch (error) {
    console.error("[recordVendorProfileView Error]:", error);
  }
}
