"use client";

import { useTransition } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { atualizarSituacaoDoPedido } from "@/actions/fornecedor/pedidos";
import { Botao } from "@/components/ui/button";
import { SelecaoNativa } from "@/components/ui/select";
import { PROXIMO_PASSO_DO_PEDIDO, ROTULO_DA_SITUACAO_DO_PEDIDO, SITUACOES_DO_PEDIDO, type SituacaoDoPedido } from "../_lib/pedidos";

const estiloBaseDoBotao =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";
const estiloDoBotaoPrimario = `${estiloBaseDoBotao} bg-ameixa text-on-ameixa hover:bg-ameixa-hover`;
const estiloDoBotaoSecundario = `${estiloBaseDoBotao} border border-linha-forte bg-papel text-tinta hover:bg-areia`;

function BotaoDeResposta({ status, whatsappUrl, coupleEmail }: { status: SituacaoDoPedido; whatsappUrl: string | null; coupleEmail: string | null }) {
  const estilo = status === "NEW" ? estiloDoBotaoPrimario : estiloDoBotaoSecundario;
  if (whatsappUrl) {
    return (
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={estilo}>
        <MessageCircle aria-hidden="true" className="size-[18px]" />
        {status === "NEW" ? "Responder no WhatsApp" : "WhatsApp"}
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
    );
  }
  if (!coupleEmail) return null;
  return (
    <a href={`mailto:${coupleEmail}`} className={estilo}>
      <Mail aria-hidden="true" className="size-[18px]" />
      Responder por e-mail
    </a>
  );
}

interface PropriedadesDasAcoesDoPedido {
  leadId: string;
  status: SituacaoDoPedido;
  coupleName: string;
  whatsappUrl: string | null;
  coupleEmail: string | null;
}

export function AcoesDoPedido({ leadId, status, coupleName, whatsappUrl, coupleEmail }: PropriedadesDasAcoesDoPedido) {
  const [isPending, startTransition] = useTransition();
  const next = PROXIMO_PASSO_DO_PEDIDO[status];

  function changeStatus(target: SituacaoDoPedido) {
    if (target === status) return;
    startTransition(async () => {
      const res = await atualizarSituacaoDoPedido(leadId, target);
      if (res.success) {
        toast.success(`Pedido de ${coupleName} marcado como “${ROTULO_DA_SITUACAO_DO_PEDIDO[target]}”.`);
      } else {
        toast.error(res.error ?? "Não foi possível atualizar o pedido.");
      }
    });
  }

  return (
    <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:w-64 sm:flex-col">
      <BotaoDeResposta status={status} whatsappUrl={whatsappUrl} coupleEmail={coupleEmail} />

      {next ? (
        <Botao type="button" variant="outline" loading={isPending} onClick={() => changeStatus(next.status)}>
          {next.label}
        </Botao>
      ) : null}

      <SelecaoNativa
        label="Status"
        size="sm"
        aria-label={`Alterar status do pedido de ${coupleName}`}
        fieldClassName="min-[420px]:col-span-2 sm:col-span-1"
        value={status}
        disabled={isPending}
        onChange={(e) => changeStatus(e.target.value as SituacaoDoPedido)}
      >
        {SITUACOES_DO_PEDIDO.map((s) => (
          <option key={s} value={s}>
            {ROTULO_DA_SITUACAO_DO_PEDIDO[s]}
          </option>
        ))}
      </SelecaoNativa>
    </div>
  );
}
