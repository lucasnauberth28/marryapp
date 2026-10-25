import { useState, useTransition } from "react";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { aceitarConvite } from "@/actions/invite-actions";
import { sair } from "@/actions/auth-actions";
import { estiloDoBotao, estiloDoBotaoComSeta } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { AvisoDoFormulario } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { Visitante } from "./tipos";

type Confirmacao = { currentCoupleNames: string; willDeleteCurrent: boolean };

function useAceiteDoConvite(token: string) {
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<Confirmacao | null>(null);
  const [isPending, startTransition] = useTransition();

  const accept = (confirmLeave: boolean) => {
    setError("");
    startTransition(async () => {
      try {
        const res = await aceitarConvite({ token, confirmLeave });
        if (res.success) window.location.href = res.redirectTo;
        else if ("needsConfirm" in res) setConfirm({ currentCoupleNames: res.currentCoupleNames, willDeleteCurrent: res.willDeleteCurrent });
        else setError(res.error);
      } catch {
        setError("Não conseguimos falar com o servidor. Tente de novo em instantes.");
      }
    });
  };

  return { error, confirm, setConfirm, isPending, accept };
}

function AvisoDeTrocaDeCasamento({ confirm, isPending, aoConfirmar, aoCancelar }: { confirm: Confirmacao; isPending: boolean; aoConfirmar: () => void; aoCancelar: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-[12px] border border-aviso/30 bg-aviso-suave px-4 py-3 text-[15px] leading-6 text-tinta">
      <p className="flex items-start gap-2 font-semibold text-aviso">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" strokeWidth={2} />
        Sua conta já faz parte de {confirm.currentCoupleNames}.
      </p>
      <p>
        {confirm.willDeleteCurrent
          ? `Ao entrar neste casamento, ${confirm.currentCoupleNames} será excluído com tudo que tem nele (convidados, site, presentes). Isso não pode ser desfeito.`
          : `Ao entrar neste casamento, você sai de ${confirm.currentCoupleNames}. Quem continua lá não perde nada.`}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Botao type="button" onClick={aoConfirmar} loading={isPending} className="flex-1 rounded-[12px] px-6">
          Entendi, entrar mesmo assim
        </Botao>
        <button type="button" onClick={aoCancelar} disabled={isPending} className={cn(estiloDoBotao.secondary, "min-h-11")}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export function AceiteDeQuemTemConta({ token, viewer }: { token: string; viewer: Extract<Visitante, { kind: "member" }> }) {
  const { error, confirm, setConfirm, isPending, accept } = useAceiteDoConvite(token);

  if (viewer.alreadyIn) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-[12px] border border-linha bg-papel px-4 py-3 text-[15px] text-tinta">Você já faz parte deste casamento.</p>
        <a href="/dashboard" className={cn(estiloDoBotao.primary, estiloDoBotao.block, "min-h-12")}>
          Ir para o painel
          <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-[12px] border border-linha bg-papel px-4 py-3 text-[15px] text-tinta-suave">
        Você está como <strong className="font-semibold text-tinta">{viewer.name}</strong> ({viewer.email}).
      </p>
      {confirm ? (
        <AvisoDeTrocaDeCasamento confirm={confirm} isPending={isPending} aoConfirmar={() => accept(true)} aoCancelar={() => setConfirm(null)} />
      ) : (
        <Botao type="button" onClick={() => accept(false)} loading={isPending} className="h-12 w-full rounded-[12px] px-6">
          Entrar neste casamento
          <ArrowRight aria-hidden="true" className={estiloDoBotaoComSeta} />
        </Botao>
      )}
      {error ? <AvisoDoFormulario>{error}</AvisoDoFormulario> : null}
      <button type="button" onClick={() => sair()} className={cn(estiloDoBotao.quiet, "self-center")}>
        Não é você? Sair
      </button>
    </div>
  );
}
