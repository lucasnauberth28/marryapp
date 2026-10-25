import { Logotipo } from "@/components/brand/logo";
import { SinoDeNotificacoes } from "@/components/notifications/notification-bell";
import { AlternadorDeTema } from "@/components/theme/theme-toggle";
import { chavePublicaVapid } from "@/lib/notifications/push";
import { AvatarDoFornecedor } from "../_components/vendor-avatar";
import { BotaoDeSair, MenuLateralDoFornecedor } from "../_components/vendor-nav";

export function BlocoDaMarca() {
  return (
    <div className="flex flex-col gap-1.5 px-3">
      <Logotipo height={26} />
      <span className="w-fit rounded-md bg-salvia-suave px-2.5 py-0.5 text-xs font-semibold text-salvia">para Fornecedores</span>
    </div>
  );
}

interface PropriedadesDaBarraLateral {
  companyName: string;
  logoUrl: string | null;
  planLabel: string;
  newLeads: number;
  unreadNotifications: number;
  publicProfileHref: string | null;
}

/** Computador: marca, sino, fornecedor, menu, sair e tema. */
export function BarraLateralDoFornecedor({ companyName, logoUrl, planLabel, newLeads, unreadNotifications, publicProfileHref }: PropriedadesDaBarraLateral) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-linha bg-linho px-4 py-6 md:flex">
      <div className="flex items-start justify-between gap-2">
        <BlocoDaMarca />
        <SinoDeNotificacoes initialUnread={unreadNotifications} allHref="/fornecedor/notificacoes" settingsHref="/conta#avisos" pushPublicKey={chavePublicaVapid()} side="right" align="start" className="-mt-2.5" />
      </div>
      <div className="flex items-center gap-2.5 rounded-xl border border-linha bg-papel p-3">
        <AvatarDoFornecedor name={companyName} logoUrl={logoUrl} size={40} />
        <span className="flex min-w-0 flex-col">
          <strong className="truncate text-[15px] font-semibold">{companyName}</strong>
          <span className="text-[13px] text-tinta-suave">{planLabel}</span>
        </span>
      </div>
      <MenuLateralDoFornecedor newLeads={newLeads} publicProfileHref={publicProfileHref} />
      <div className="mt-auto flex items-center gap-1 border-t border-linha pt-3">
        <div className="min-w-0 flex-1">
          <BotaoDeSair />
        </div>
        <AlternadorDeTema align="start" />
      </div>
    </aside>
  );
}
