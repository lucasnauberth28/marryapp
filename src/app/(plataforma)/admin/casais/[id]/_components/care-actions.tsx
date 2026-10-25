"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, KeyRound, RotateCcw, Trash2 } from "lucide-react";
import { excluirCasamento, redefinirSenhaDoCasamento, suspenderCasamento, reativarCasamento } from "@/actions/admin-casais-actions";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { CaixaDeSelecao } from "@/components/ui/checkbox";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { Entrada } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAcaoDoCasal } from "../../_components/use-casal-action";

type TipoDeAcao = "reset" | "suspend" | "unsuspend" | "delete";
type TextoDaAcao = { title: string; text: string; cta: string; danger?: boolean };

function textosDasAcoes(coupleNames: string): Record<TipoDeAcao, TextoDaAcao> {
  return {
    reset: { title: "Redefinir a senha", text: `Enviamos um link de nova senha, válido por 1 hora, para o e-mail do dono do casamento de ${coupleNames}. Nós nunca vemos nem mostramos a senha.`, cta: "Enviar o link" },
    suspend: { title: "Suspender o casal", text: `O site público de ${coupleNames} sai do ar (site, confirmação de presença e lista de presentes) e o painel do casal fica só para leitura. Dá para reativar a qualquer momento.`, cta: "Suspender o casal", danger: true },
    unsuspend: { title: "Reativar o casal", text: `O site de ${coupleNames} volta ao ar e o painel volta a aceitar alterações.`, cta: "Reativar o casal" },
    delete: { title: "Excluir o casamento", text: `Isso apaga o casamento de ${coupleNames} e tudo que há nele: convidados, presentes, site, mesas e pagamentos de presentes. As contas das pessoas continuam existindo. Não dá para desfazer.`, cta: "Excluir para sempre", danger: true },
  };
}

const BOTAO_DE_ACAO = `${estiloDoBotao.secondary} w-full justify-start gap-2`;

function BotoesDeCuidado({ suspended, aoAbrir }: { suspended: boolean; aoAbrir: (acao: TipoDeAcao) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <button type="button" className={BOTAO_DE_ACAO} onClick={() => aoAbrir("reset")}>
        <KeyRound className="size-4" aria-hidden="true" /> Redefinir a senha
      </button>
      {suspended ? (
        <button type="button" className={BOTAO_DE_ACAO} onClick={() => aoAbrir("unsuspend")}>
          <RotateCcw className="size-4" aria-hidden="true" /> Reativar o casal
        </button>
      ) : (
        <button type="button" className={BOTAO_DE_ACAO} onClick={() => aoAbrir("suspend")}>
          <Ban className="size-4" aria-hidden="true" /> Suspender o casal
        </button>
      )}
      <button type="button" className={cn(BOTAO_DE_ACAO, "border-perigo text-perigo hover:border-perigo hover:bg-perigo-suave")} onClick={() => aoAbrir("delete")}>
        <Trash2 className="size-4" aria-hidden="true" /> Excluir o casamento
      </button>
    </div>
  );
}

/** O estado da janela de confirmação e o envio de cada ação. */
function useAcoesDeCuidado(weddingId: string) {
  const router = useRouter();
  const [open, setOpen] = useState<TipoDeAcao | null>(null);
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [sure, setSure] = useState(false);
  const { pending, error, run, clearError } = useAcaoDoCasal();

  const close = () => {
    setOpen(null);
    setReason("");
    setConfirmText("");
    setSure(false);
    clearError();
  };
  const done = (redirect?: string) => () => {
    close();
    if (redirect) router.push(redirect);
    else router.refresh();
  };
  const submit = () => {
    if (open === "reset") run(() => redefinirSenhaDoCasamento({ weddingId, reason }), done());
    if (open === "suspend") run(() => suspenderCasamento({ weddingId, reason }), done());
    if (open === "unsuspend") run(() => reativarCasamento({ weddingId, reason }), done());
    if (open === "delete") run(() => excluirCasamento({ weddingId, reason, confirmation: confirmText, acknowledged: sure }), done("/admin/casais"));
  };
  const reasonRequired = open !== "unsuspend";
  const canSubmit = (!reasonRequired || reason.trim().length >= 5) && (open !== "delete" || (confirmText.trim().toUpperCase() === "EXCLUIR" && sure));
  return { open, setOpen, reason, setReason, confirmText, setConfirmText, sure, setSure, pending, error, close, submit, reasonRequired, canSubmit };
}

/** "Ações com cuidado": cada uma pede confirmação e motivo, e fica no Registro de atividades com o nome de quem fez. */
export function AcoesDeCuidado({ weddingId, coupleNames, suspended }: { weddingId: string; coupleNames: string; suspended: boolean }) {
  const a = useAcoesDeCuidado(weddingId);
  const current = a.open ? textosDasAcoes(coupleNames)[a.open] : null;
  return (
    <>
      <BotoesDeCuidado suspended={suspended} aoAbrir={a.setOpen} />
      <ModalPersonalizado isOpen={a.open !== null} onClose={a.close} title={current?.title ?? ""} description={current?.text}>
        <div className="flex flex-col gap-4">
          <AreaDeTexto label={a.reasonRequired ? "Motivo (obrigatório)" : "Motivo (opcional)"} value={a.reason} onChange={(e) => a.setReason(e.target.value)} maxLength={500} rows={3} hint="Fica no Registro de atividades." />
          {a.open === "delete" && (
            <>
              <Entrada label="Digite EXCLUIR para confirmar" value={a.confirmText} onChange={(e) => a.setConfirmText(e.target.value)} autoComplete="off" />
              <label className="flex items-start gap-3 text-sm leading-5 text-tinta">
                <CaixaDeSelecao checked={a.sure} onCheckedChange={(v) => a.setSure(v === true)} className="mt-0.5" />
                <span>Entendo que é para sempre e que o casal perde todos os dados do casamento.</span>
              </label>
            </>
          )}
          {a.error && (
            <p role="alert" className="text-sm font-semibold text-perigo">
              {a.error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Botao type="button" onClick={a.submit} disabled={!a.canSubmit} loading={a.pending} className={current?.danger ? "bg-perigo hover:bg-perigo" : undefined}>
              {current?.cta}
            </Botao>
            <Botao type="button" variant="quiet" onClick={a.close} disabled={a.pending}>
              Cancelar
            </Botao>
          </div>
        </div>
      </ModalPersonalizado>
    </>
  );
}
