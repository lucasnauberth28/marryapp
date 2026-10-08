import { Metadata } from "next";
import { verifyAdminSession } from "@/actions/auth-actions";
import { WhatsAppConfigClient } from "./whatsapp-config-client";

export const metadata: Metadata = {
  title: "WhatsApp API",
  description: "Gerencie a conexão da API do WhatsApp",
};

export default async function WhatsAppConfigPage() {
  await verifyAdminSession();

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="font-display text-[32px] leading-[38px] tracking-[-0.01em] text-tinta text-balance md:text-[40px] md:leading-[46px]">WhatsApp API (Evolution)</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          Acompanhe o status do seu número conectado e gere um novo QR Code caso a conexão caia.
        </p>
      </div>

      <WhatsAppConfigClient />
    </div>
  );
}
