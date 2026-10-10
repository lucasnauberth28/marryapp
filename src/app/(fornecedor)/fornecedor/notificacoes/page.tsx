import type { Metadata } from "next";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { listNotificationHistory } from "@/actions/notification-actions";
import { HistoryList } from "@/components/notifications/history-list";
import { PushCard } from "@/components/notifications/push-card";
import { vapidPublicKey } from "@/lib/notifications/push";
import { getVendorPageContext } from "@/lib/security/vendor-guard";

export const metadata: Metadata = { title: "Avisos" };

export default async function FornecedorNotificacoesPage() {
  const { vendor } = await getVendorPageContext();
  if (!vendor) return null; // o layout explica que a conta ainda não foi vinculada

  const { items } = await listNotificationHistory();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 max-w-2xl">
          <h1 className="font-display text-[32px] leading-[38px] tracking-[-0.01em] text-balance text-tinta md:text-[40px] md:leading-[46px]">Avisos</h1>
          <p className="mt-1.5 text-[15px] text-tinta-suave">Pedidos, propostas, avaliações e o seu plano. Mostramos os últimos 100.</p>
        </div>
        <Link
          href="/conta#avisos"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-linha-forte bg-papel px-4 text-sm font-semibold text-tinta transition-colors hover:border-salvia hover:bg-salvia-suave"
        >
          <Settings2 aria-hidden="true" className="size-4" />
          Escolher quais avisos receber
        </Link>
      </div>
      <PushCard publicKey={vapidPublicKey()} />
      <HistoryList initialItems={items} nowIso={new Date().toISOString()} />
    </div>
  );
}
