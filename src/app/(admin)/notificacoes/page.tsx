import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";
import { listNotificationHistory } from "@/actions/notification-actions";
import { PageHeader } from "@/components/admin/page-header";
import { HistoryList } from "@/components/notifications/history-list";
import { PushCard } from "@/components/notifications/push-card";
import { vapidPublicKey } from "@/lib/notifications/push";
import { hasPathAccess } from "@/lib/permissions";
import { getSession, redirectToLogin } from "@/lib/security/auth-guard";
import { getWeddingContext } from "@/lib/security/wedding-context";

export const metadata: Metadata = { title: "Avisos", description: "Tudo o que aconteceu no casamento de vocês." };

export default async function NotificacoesPage() {
  const session = await getSession();
  if (!session) return redirectToLogin();
  // Conta de fornecedor tem os avisos no painel dela; conta sem casamento ainda vai ao cadastro do casamento.
  if (!(await getWeddingContext())) {
    redirect(hasPathAccess(session.allowedPaths, "/fornecedor") ? "/fornecedor/notificacoes" : "/boas-vindas");
  }

  const { items } = await listNotificationHistory();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Conta"
        title="Avisos"
        description="Presentes, confirmações e lembretes do casamento. Mostramos os últimos 100."
        actions={
          <Link
            href="/conta#avisos"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-linha-forte bg-papel px-4 text-sm font-semibold text-tinta transition-colors hover:border-ameixa hover:bg-ameixa-suave"
          >
            <Settings2 aria-hidden="true" className="size-4" />
            Escolher quais avisos receber
          </Link>
        }
      />
      <PushCard publicKey={vapidPublicKey()} />
      <HistoryList initialItems={items} nowIso={new Date().toISOString()} />
    </div>
  );
}
