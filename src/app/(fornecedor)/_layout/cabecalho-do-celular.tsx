import Link from "next/link";
import { SinoDeNotificacoes } from "@/components/notifications/notification-bell";
import { AlternadorDeTema } from "@/components/theme/theme-toggle";
import { chavePublicaVapid } from "@/lib/notifications/push";
import { EtiquetaBase } from "../_components/status-chip";
import { AvatarDoFornecedor } from "../_components/vendor-avatar";
import { BotaoDeIconeDeSair, TituloMovelDoFornecedor } from "../_components/vendor-nav";

interface PropriedadesDoCabecalho {
  companyName: string;
  logoUrl: string | null;
  etiquetaDoPlano: string;
  unreadNotifications: number;
}

/** Celular: conta, título da tela, plano, tema, sino e sair. */
export function CabecalhoDoCelular({ companyName, logoUrl, etiquetaDoPlano, unreadNotifications }: PropriedadesDoCabecalho) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-2.5 border-b border-linha bg-linho/95 pr-2 pl-4 backdrop-blur md:hidden">
      <Link href="/conta" aria-label="Minha conta" className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salvia">
        <AvatarDoFornecedor name={companyName} logoUrl={logoUrl} size={36} />
      </Link>
      <TituloMovelDoFornecedor />
      <EtiquetaBase tone="salvia">{etiquetaDoPlano}</EtiquetaBase>
      <AlternadorDeTema />
      <SinoDeNotificacoes initialUnread={unreadNotifications} allHref="/fornecedor/notificacoes" settingsHref="/conta#avisos" pushPublicKey={chavePublicaVapid()} className="-mr-1" />
      <BotaoDeIconeDeSair />
    </header>
  );
}
