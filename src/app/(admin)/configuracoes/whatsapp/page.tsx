import { Metadata } from "next";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { PageHeader } from "@/components/admin/page-header";
import { WhatsAppConfigClient } from "./whatsapp-config-client";

export const metadata: Metadata = {
  title: "WhatsApp API",
  description: "Gerencie a conexão da API do WhatsApp",
};

export default async function WhatsAppConfigPage() {
  await requireWeddingPage("/configuracoes");

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        className="mb-8"
        eyebrow="Configurações"
        title="Conexão do WhatsApp"
        description="Acompanhe o status do seu número conectado e gere um novo QR Code caso a conexão caia."
      />

      <WhatsAppConfigClient />
    </div>
  );
}
