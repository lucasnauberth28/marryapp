import { Metadata } from "next";
import { exigirCasamentoNaPagina } from "@/lib/security/wedding-context";
import { CabecalhoDaPagina } from "@/components/admin/page-header";
import { ConfiguracaoDoWhatsappCliente } from "./configuracao-do-whatsapp-cliente";

export const metadata: Metadata = {
  title: "Conexão do WhatsApp",
  description: "Veja se o WhatsApp está conectado para enviar convites e lembretes",
};

export default async function WhatsAppConfigPage() {
  await exigirCasamentoNaPagina("/configuracoes");

  return (
    <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CabecalhoDaPagina
        className="mb-8"
        eyebrow="Configurações"
        title="Conexão do WhatsApp"
        description="Veja se o envio de convites e lembretes pelo WhatsApp está disponível. A conexão é do Aceito e a equipe cuida dela."
      />

      <ConfiguracaoDoWhatsappCliente />
    </div>
  );
}
