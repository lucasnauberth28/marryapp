import { Metadata } from "next";
import { verifyAdminSession } from "@/actions/auth-actions";
import { WhatsAppConfigClient } from "./whatsapp-config-client";

export const metadata: Metadata = {
  title: "WhatsApp API | Lucas & Giovanna",
  description: "Gerencie a conexão da API do WhatsApp",
};

export default async function WhatsAppConfigPage() {
  await verifyAdminSession();

  return (
    <div className="flex-1 p-8 pt-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight">WhatsApp API (Evolution)</h1>
        <p className="text-zinc-500 mt-1">
          Acompanhe o status do seu número conectado e gere um novo QR Code caso a conexão caia.
        </p>
      </div>

      <WhatsAppConfigClient />
    </div>
  );
}
