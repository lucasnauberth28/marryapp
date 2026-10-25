"use client";

import { useId, useState, useTransition } from "react";
import { TicketPercent } from "lucide-react";
import { previaDoPrecoDaAssinatura } from "@/actions/assinatura/pagamento";
import { estiloDoBotao } from "@/components/landing/styles";
import { Botao } from "@/components/ui/button";
import { Entrada } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ResumoDoCupom } from "./cupom/resumo-do-cupom";
import type { CupomAplicado } from "./cupom/tipos";
import { interpretarPrevia, useReconferirCupomAoTrocarDePlano } from "./cupom/use-conferir-cupom";

export type { CupomAplicado } from "./cupom/tipos";

interface PropriedadesDoCampoDeCupom {
  planId: string;
  modules?: string[];
  applied: CupomAplicado | null;
  onChange: (applied: CupomAplicado | null) => void;
  /** Texto do crédito do plano anterior, quando houver ("Crédito do Pro atual"). */
  creditLabel?: string;
}

interface PropriedadesDoFormulario {
  code: string;
  setCode: (c: string) => void;
  error: string;
  setError: (e: string) => void;
  isPending: boolean;
  aoAplicar: (code: string) => void;
}

function BotaoTenhoCupom({ aoAbrir }: { aoAbrir: () => void }) {
  return (
    <button type="button" onClick={aoAbrir} className={cn(estiloDoBotao.quiet, "-ml-3 min-h-11 self-start")}>
      <TicketPercent aria-hidden="true" className="size-4" />
      Tenho um cupom de desconto
    </button>
  );
}

function FormularioDeCupom({ code, setCode, error, setError, isPending, aoAplicar }: PropriedadesDoFormulario) {
  const inputId = useId();
  return (
    <form
      className="flex flex-col gap-1.5 pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        const value = code.trim();
        if (!value) {
          setError("Digite o código do cupom.");
          return;
        }
        aoAplicar(value);
      }}
    >
      <div className="flex items-start gap-2">
        <Entrada
          id={inputId}
          label="Cupom de desconto"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (error) setError("");
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={30}
          error={error || undefined}
          placeholder="Ex.: NOIVOS10"
          fieldClassName="min-w-0 flex-1"
          inputClassName="font-mono uppercase"
        />
        <Botao type="submit" variant="outline" loading={isPending} className="h-12 shrink-0 rounded-[12px] px-6">
          Aplicar
        </Botao>
      </div>
    </form>
  );
}

/**
 * Campo de cupom do checkout: "Aplicar" confere o código no servidor e mostra o novo total.
 * O servidor confere de novo ao gerar o Pix; aqui é só a prévia.
 */
export function CampoDeCupom({ planId, modules, applied, onChange, creditLabel = "Crédito do plano atual" }: PropriedadesDoCampoDeCupom) {
  const [open, setOpen] = useState(Boolean(applied));
  const [code, setCode] = useState(applied?.code ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const check = (couponCode: string) =>
    previaDoPrecoDaAssinatura({ planId, modules, couponCode }).then((res) => {
      const r = interpretarPrevia(res, planId);
      if ("applied" in r) {
        setError("");
        return onChange(r.applied);
      }
      onChange(null);
      setError(r.error);
    });

  useReconferirCupomAoTrocarDePlano(planId, modules, applied, onChange, setError);

  if (!open) return <BotaoTenhoCupom aoAbrir={() => setOpen(true)} />;

  if (applied && applied.planId === planId) {
    return (
      <ResumoDoCupom
        applied={applied}
        creditLabel={creditLabel}
        aoRemover={() => {
          onChange(null);
          setCode("");
        }}
      />
    );
  }

  return (
    <FormularioDeCupom
      code={code}
      setCode={setCode}
      error={error}
      setError={setError}
      isPending={isPending}
      aoAplicar={(value) => startTransition(() => check(value))}
    />
  );
}
