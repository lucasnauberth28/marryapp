import { Metadata } from "next";
import { getSettings } from "@/actions/settings-actions";
import { SettingsClient } from "./settings-client";
import { requireWeddingPage } from "@/lib/security/wedding-context";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Configurações globais do sistema e personalização",
};

export default async function SettingsPage() {
  await requireWeddingPage("/configuracoes");
  const settings = await getSettings();

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsClient initialSettings={settings} />
    </div>
  );
}
