import { useState } from "react";
import { Check } from "lucide-react";
import { aprovarFornecedorComoAdmin, recusarFornecedorComoAdmin } from "@/actions/admin-fornecedores-actions";
import { Botao } from "@/components/ui/button";
import { SelecaoNativa } from "@/components/ui/select";
import { AreaDeTexto } from "@/components/ui/textarea";
import { MOTIVOS_DE_RECUSA, mensagemDeRecusaPara } from "@/lib/platform/vendor-admin";
import { cn } from "@/lib/utils";
import { ESTILO_DE_PERIGO, type AcoesDoPainel } from "./tipos";

export function BotaoDeAprovar({ vendorId, acao }: { vendorId: string; acao: AcoesDoPainel }) {
  return (
    <Botao type="button" disabled={acao.pending} loading={acao.carregando("approve")} onClick={() => acao.run("approve", () => aprovarFornecedorComoAdmin({ vendorId }))} className="self-start">
      <Check className="size-4" aria-hidden="true" /> Aprovar
    </Botao>
  );
}

export function RecusaComMotivo({ vendorId, acao }: { vendorId: string; acao: AcoesDoPainel }) {
  const [reasonKey, setReasonKey] = useState<string>(MOTIVOS_DE_RECUSA[0].value);
  const [message, setMessage] = useState<string>(MOTIVOS_DE_RECUSA[0].message);
  return (
    <section aria-label="Recusar com motivo" className="flex flex-col gap-3 border-t border-linha pt-4">
      <h3 className="text-[15px] font-semibold text-tinta">Recusar com motivo</h3>
      <SelecaoNativa
        label="Motivo"
        alwaysFloat
        value={reasonKey}
        onChange={(e) => {
          setReasonKey(e.target.value);
          setMessage(mensagemDeRecusaPara(e.target.value));
        }}
      >
        {MOTIVOS_DE_RECUSA.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </SelecaoNativa>
      <AreaDeTexto label="Mensagem para o fornecedor" rows={4} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} hint="Ele lê esta mensagem no painel dele." />
      <Botao
        type="button"
        variant="outline"
        disabled={message.trim().length < 10 || acao.pending}
        loading={acao.carregando("reject")}
        onClick={() => acao.run("reject", () => recusarFornecedorComoAdmin({ vendorId, message }))}
        className={cn(ESTILO_DE_PERIGO, "self-start")}
      >
        Recusar com motivo
      </Botao>
    </section>
  );
}
