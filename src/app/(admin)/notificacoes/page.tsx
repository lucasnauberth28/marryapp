import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";
import { listarHistoricoDeNotificacoes } from "@/actions/notification-actions";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { ListaDoHistorico } from "@/components/notifications/history-list";
import { CartaoDoPush } from "@/components/notifications/push-card";
import { chavePublicaVapid } from "@/lib/notifications/push";
import { temAcessoAoCaminho } from "@/lib/permissions";
import { obterSessao, redirecionarParaOLogin } from "@/lib/security/auth-guard";
import { obterContextoDoCasamento } from "@/lib/security/wedding-context";

export const metadata: Metadata = { title: "Avisos", description: "Tudo o que aconteceu no casamento de vocês." };

export default async function NotificacoesPage() {
  const session = await obterSessao();
  if (!session) return redirecionarParaOLogin();
  // Conta de fornecedor tem os avisos no painel dela; conta sem casamento ainda vai ao cadastro do casamento.
  if (!(await obterContextoDoCasamento())) {
    redirect(temAcessoAoCaminho(session.allowedPaths, "/fornecedor") ? "/fornecedor/notificacoes" : "/boas-vindas");
  }

  const { items } = await listarHistoricoDeNotificacoes();
  return (
    <div className="flex flex-col gap-6">
      <CabecalhoDaPagina
        eyebrow="Conta"
        title="Avisos"
        description="Presentes recebidos, respostas dos convidados e lembretes do casamento. Mostramos os últimos 100."
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
      <CartaoDoPush publicKey={chavePublicaVapid()} />
      <ListaDoHistorico initialItems={items} nowIso={new Date().toISOString()} />
    </div>
  );
}
