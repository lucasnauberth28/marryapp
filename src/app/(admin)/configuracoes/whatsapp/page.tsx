import { Metadata } from "next";
import { requireWeddingPage } from "@/lib/security/wedding-context";
import { PageHeader } from "@/components/admin/page-header";
import { WhatsAppConfigClient } from "./whatsapp-config-client";

export const metadata: Metadata = {
  title: "Conexão do WhatsApp",
  description: "Veja se o WhatsApp está conectado para enviar convites e lembretes",
};

export default async function WhatsAppConfigPage() {
  await requireWeddingPage("/configuracoes");

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        className="mb-8"
        eyebrow="Configurações"
        title="Conexão do WhatsApp"
        description="Veja se o envio de convites e lembretes pelo WhatsApp está disponível. A conexão é do Aceito e a equipe cuida dela."
      />

      <WhatsAppConfigClient />
    </div>
  );
}
