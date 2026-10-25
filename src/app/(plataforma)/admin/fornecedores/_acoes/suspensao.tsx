import { useState } from "react";
import { reativarFornecedor, suspenderFornecedor } from "@/actions/admin-fornecedores-actions";
import { Botao } from "@/components/ui/button";
import { AreaDeTexto } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ESTILO_DE_PERIGO, type AcoesDoPainel } from "./tipos";

function FormularioDeSuspensao({ vendorId, acao, aoFechar }: { vendorId: string; acao: AcoesDoPainel; aoFechar: () => void }) {
  const [suspendReason, setSuspendReason] = useState("");
  return (
    <>
      <AreaDeTexto label="Motivo da suspensão" rows={2} maxLength={500} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} hint="O fornecedor vê este motivo no painel dele." />
      <div className="flex flex-wrap gap-2">
        <Botao
          type="button"
          variant="outline"
          disabled={suspendReason.trim().length < 5 || acao.pending}
          loading={acao.carregando("suspend")}
          onClick={() => acao.run("suspend", () => suspenderFornecedor({ vendorId, reason: suspendReason }), aoFechar)}
          className={ESTILO_DE_PERIGO}
        >
          Suspender o fornecedor
        </Botao>
        <Botao type="button" variant="quiet" onClick={aoFechar} disabled={acao.pending}>
          Voltar
        </Botao>
      </div>
    </>
  );
}

export function SecaoDeSuspensao({ vendorId, suspended, acao }: { vendorId: string; suspended: boolean; acao: AcoesDoPainel }) {
  const [aberto, setAberto] = useState(false);
  return (
    <section aria-label="Suspender" className="flex flex-col gap-3 border-t border-linha pt-4">
      {suspended ? (
        <>
          <p className="text-sm text-tinta-suave">Este fornecedor está suspenso e fora da vitrine.</p>
          <Botao type="button" variant="outline" disabled={acao.pending} loading={acao.carregando("unsuspend")} onClick={() => acao.run("unsuspend", () => reativarFornecedor({ vendorId }))} className="self-start">
            Reativar o fornecedor
          </Botao>
        </>
      ) : aberto ? (
        <FormularioDeSuspensao vendorId={vendorId} acao={acao} aoFechar={() => setAberto(false)} />
      ) : (
        <Botao type="button" variant="outline" onClick={() => setAberto(true)} className={cn(ESTILO_DE_PERIGO, "self-start")}>
          Suspender o fornecedor
        </Botao>
      )}
      <p className="text-sm text-tinta-suave">Toda ação aqui fica no Registro de atividades.</p>
    </section>
  );
}
