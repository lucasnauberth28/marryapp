"use client";

import { AlertCircle } from "lucide-react";
import { marcarDominioComoNoAr } from "@/actions/domain-admin-actions";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { AcoesDoPedido } from "../_painel/acoes-do-pedido";
import { SecaoDeDns } from "../_painel/dns-da-vercel";
import { DocumentoDoTitular, EtapasDoPedido } from "../_painel/documento-e-etapas";
import { FormularioDaAnotacao, FormularioDeRecusa, FormularioDeRegistro } from "../_painel/formularios";
import type { DadosDoPainelDoDominio } from "../_painel/tipos-e-textos";
import { usePainelDoDominio } from "../_painel/use-painel-do-dominio";

export type { DadosDoPainelDoDominio };

/** Painel do pedido de domínio: etapas, DNS que a Vercel devolve e as ações da equipe (todas auditadas no servidor). */
export function PainelDoDominio({ order, vercelReady }: { order: DadosDoPainelDoDominio; vercelReady: boolean }) {
  const estado = usePainelDoDominio(order.id);
  const { pending, panel, setPanel, error, run, fullDocument, connection } = estado;
  const emAberto = order.status === "REQUESTED" || order.status === "REGISTERING";

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-perigo-suave p-3 text-sm font-semibold text-perigo">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      ) : null}
      <DocumentoDoTitular mascarado={order.holderDocument} completo={fullDocument} podeRevelar={order.canRevealDocument} carregando={estado.carregando("reveal")} desabilitado={pending} aoRevelar={estado.revealDocument} />
      <EtapasDoPedido status={order.status} />
      {order.status === "REGISTERED" || order.status === "CONNECTED" ? <SecaoDeDns vercelReady={vercelReady} connection={connection} vercelState={order.vercelState} /> : null}
      <AcoesDoPedido order={order} vercelReady={vercelReady} estado={estado} />
      {panel === "registered" ? <FormularioDeRegistro id={order.id} estado={estado} /> : null}
      {emAberto ? <FormularioDeRecusa id={order.id} estado={estado} /> : null}
      <ModalDeConfirmacao
        isOpen={panel === "online"}
        onClose={() => setPanel(null)}
        onConfirm={() => run("online", () => marcarDominioComoNoAr(order.id), () => setPanel(null))}
        title="Marcar como no ar?"
        description={`Confirme só se ${order.domain} já abre o site do casal. A partir daí os links dos convidados passam a usar este endereço e o casal é avisado.`}
        confirmText="Marcar como no ar"
        cancelText="Voltar"
        variant="default"
        isLoading={pending}
      />
      <FormularioDaAnotacao id={order.id} notaSalva={order.adminNote} estado={estado} />
    </div>
  );
}
