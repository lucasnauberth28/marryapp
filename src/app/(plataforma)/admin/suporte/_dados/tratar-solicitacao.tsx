import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { ModalDeConfirmacao } from "@/components/ui/confirm-modal";
import { AvisoDoFormulario } from "@/components/ui/field";
import { Botao } from "@/components/ui/button";
import { BotaoDeExportar } from "@/components/plataforma/export-button";
import { cumprirSolicitacaoDeExclusao, atualizarSolicitacaoDeDados } from "@/actions/admin-suporte-actions";
import { useAcaoDoAdmin } from "../../_sistema/use-admin-action";
import type { ItemDeSolicitacaoDeDados } from "./tipos";

type AcaoDoAdmin = ReturnType<typeof useAcaoDoAdmin>;
type Decisao = "review" | "done" | "refuse";

function BotoesDeDecisao({ item, note, acao, aposDecidir }: { item: ItemDeSolicitacaoDeDados; note: string; acao: AcaoDoAdmin; aposDecidir: () => void }) {
  const [running, setRunning] = useState<Decisao | null>(null); // só o botão clicado mostra o spinner
  const { pending, run } = acao;
  const decidir = (decisao: Decisao, status: "IN_REVIEW" | "DONE" | "REFUSED", depois?: () => void) => {
    setRunning(decisao);
    run(() => atualizarSolicitacaoDeDados({ id: item.id, status, note }), depois);
  };
  return (
    <div className="flex flex-wrap gap-3">
      {item.status === "NEW" && (
        <Botao type="button" variant="outline" disabled={pending} loading={pending && running === "review"} onClick={() => decidir("review", "IN_REVIEW", aposDecidir)}>
          Marcar em análise
        </Botao>
      )}
      <Botao type="button" disabled={pending} loading={pending && running === "done"} onClick={() => decidir("done", "DONE", aposDecidir)}>
        Marcar como pronto
      </Botao>
      <Botao type="button" variant="quiet" disabled={pending} loading={pending && running === "refuse"} onClick={() => decidir("refuse", "REFUSED")} className="text-perigo">
        Recusar
      </Botao>
    </div>
  );
}

function ExclusaoDeConta({ item, acao, aposExcluir }: { item: ItemDeSolicitacaoDeDados; acao: AcaoDoAdmin; aposExcluir: () => void }) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { pending, errors, run } = acao;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-perigo/40 bg-papel p-4">
      <p className="font-semibold text-tinta">Excluir a conta agora</p>
      <p className="text-sm leading-5 text-tinta-suave">Apaga a conta e, se for o último membro, o casamento (ou o perfil de fornecedor) com tudo dentro. Os pagamentos ficam guardados sem vínculo, para fins fiscais. Não dá para desfazer.</p>
      <Entrada label="Digite o e-mail do titular para confirmar" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} error={errors.confirmEmail} autoComplete="off" />
      <div>
        <Botao type="button" variant="outline" disabled={pending || confirmEmail.trim().length < 5} onClick={() => setConfirmOpen(true)} className="text-perigo">
          Excluir a conta
        </Botao>
      </div>
      <ModalDeConfirmacao
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Excluir esta conta?"
        description={`A conta de ${item.requesterName} será apagada de vez.`}
        confirmText="Excluir a conta"
        isLoading={pending}
        onConfirm={() =>
          run(
            () => cumprirSolicitacaoDeExclusao({ id: item.id, confirmEmail }),
            () => {
              setConfirmOpen(false);
              aposExcluir();
            },
          )
        }
      />
    </div>
  );
}

export function TratarSolicitacao({ item, onDone }: { item: ItemDeSolicitacaoDeDados; onDone: () => void }) {
  const router = useRouter();
  const [note, setNote] = useState(item.note ?? "");
  const acao = useAcaoDoAdmin();
  const closed = item.status === "DONE" || item.status === "REFUSED";
  const after = () => {
    onDone();
    router.refresh();
  };
  return (
    <div className="flex flex-col gap-4 border-t border-linha bg-linho px-4 py-4">
      <p className="text-sm text-tinta-suave">{item.requesterEmail}</p>
      {item.type === "EXPORT" && item.linked && (
        <div>
          <BotaoDeExportar href={`/api/admin/suporte/exportar?pedido=${item.id}`} fallbackName="exportacao.json" size="sm">
            <Download className="size-4" aria-hidden="true" /> Baixar a exportação (JSON)
          </BotaoDeExportar>
          <p className="mt-1 text-sm text-tinta-suave">Sem senhas nem tokens. Envie o arquivo ao titular pelo e-mail dele e marque como pronto. O download fica no registro.</p>
        </div>
      )}
      <AreaDeTexto label="Nota do atendimento" optional hint="Obrigatória para recusar. Fica no registro." value={note} onChange={(e) => setNote(e.target.value)} error={acao.errors.note} rows={2} maxLength={2000} />
      {acao.formError && !Object.keys(acao.errors).length && <AvisoDoFormulario>{acao.formError}</AvisoDoFormulario>}
      {!closed && <BotoesDeDecisao item={item} note={note} acao={acao} aposDecidir={after} />}
      {item.type === "DELETE" && item.linked && !closed && <ExclusaoDeConta item={item} acao={acao} aposExcluir={after} />}
    </div>
  );
}
