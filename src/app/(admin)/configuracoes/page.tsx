import { Metadata } from "next";
import { getSettings } from "@/actions/settings-actions";
import { SettingsClient } from "./settings-client";
import { verifyAdminSession } from "@/actions/auth-actions";

export const metadata: Metadata = {
  title: "Configurações | Lucas & Giovanna",
  description: "Configurações globais do sistema e personalização",
};

export default async function SettingsPage() {
  await verifyAdminSession();
  const settings = await getSettings();

  return (
    <div className="flex-1 p-8 pt-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SettingsClient initialSettings={settings} />
    </div>
  );
}
