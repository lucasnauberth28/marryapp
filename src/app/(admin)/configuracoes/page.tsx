import { Metadata } from "next";
import { getSettings } from "@/actions/settings-actions";
import { SettingsClient } from "./settings-client";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { getWeddingIdentity } from "@/lib/wedding";
import { weddingSiteUrl } from "@/lib/wedding-links";
import { hasPathAccess } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Prazo de confirmação, dados do casamento e conexão do WhatsApp",
};

export default async function SettingsPage() {
  const { session, wedding } = await requireWeddingPage("/configuracoes");
  const [settings, identity] = await Promise.all([getSettings(), getWeddingIdentity()]);

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsClient
        initialSettings={settings}
        summary={{
          names: identity.coupleNames,
          date: identity.dateLabel,
          place: identity.locationName || wedding.city || null,
          address: identity.slug ? weddingSiteUrl(identity.slug).replace(/^https?:\/\//, "") : null,
        }}
        canSeePlan={hasPathAccess(session.allowedPaths, "/plano")}
      />
    </div>
  );
}
