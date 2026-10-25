"use client";
// Situação da conexão do WhatsApp que envia convites e lembretes.
import { RefreshCw } from "lucide-react";
import { Botao } from "@/components/ui/button";
import { SituacaoDaConexao } from "./componentes/situacao-da-conexao";
import { useSituacaoDoWhatsapp } from "./componentes/use-situacao-do-whatsapp";

export function ConfiguracaoDoWhatsappCliente() {
  const { status, message, loading, refreshManually } = useSituacaoDoWhatsapp();
  return (
    <div className="rounded-2xl border border-linha bg-papel p-5 shadow-[var(--shadow-aceito-1)] md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold leading-7 text-tinta">Status da conexão</h2>
        <Botao variant="outline" size="sm" onClick={refreshManually} loading={loading}>
          <RefreshCw aria-hidden="true" />
          Atualizar
        </Botao>
      </div>
      <SituacaoDaConexao status={status} message={message} loading={loading} />
    </div>
  );
}
