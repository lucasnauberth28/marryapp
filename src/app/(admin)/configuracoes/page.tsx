import { Metadata } from "next";
import { obterConfiguracoes } from "@/actions/settings-actions";
import { ConfiguracoesCliente } from "./settings-client";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { obterIdentidadeDoCasamentoPrincipal } from "@/lib/wedding";
import { urlDoSiteDoCasamento } from "@/lib/wedding-links";
import { temAcessoAoCaminho } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Prazo de confirmação, dados do casamento e conexão do WhatsApp",
};

export default async function SettingsPage() {
  const { session, wedding } = await exigirCasamentoNaPagina("/configuracoes");
  const [settings, identity] = await Promise.all([obterConfiguracoes(), obterIdentidadeDoCasamentoPrincipal()]);

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ConfiguracoesCliente
        initialSettings={settings}
        summary={{
          names: identity.coupleNames,
          date: identity.dateLabel,
          place: identity.locationName || wedding.city || null,
          address: identity.slug ? urlDoSiteDoCasamento(identity.slug, undefined, wedding.customDomain).replace(/^https?:\/\//, "") : null,
        }}
        canSeePlan={temAcessoAoCaminho(session.allowedPaths, "/plano")}
      />
    </div>
  );
}
