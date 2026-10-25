"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LogIn, ShieldAlert } from "lucide-react";
import { iniciarPersonificacao } from "@/actions/admin-impersonation-actions";
import { btn } from "@/components/landing/styles";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { MAXIMO_DE_MINUTOS_DE_PERSONIFICACAO, MOTIVOS_DE_PERSONIFICACAO } from "@/lib/security/impersonation-rules";

import { somenteDigitos } from "@/lib/formatacao/telefone";
/** Confirmação para "Entrar como este casal": motivo obrigatório, chamado opcional e, para editar, uma segunda confirmação. */
export function EntrarComoForm({ weddingId, coupleNames, backHref }: { weddingId: string; coupleNames: string; backHref: string }) {
  const [reason, setReason] = useState<string>(MOTIVOS_DE_PERSONIFICACAO[0]);
  const [ticket, setTicket] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Depois do sucesso a página recarrega por inteiro: o botão continua ocupado até lá (sem segundo clique)
  const [redirecting, setRedirecting] = useState(false);

  const ticketDigits = somenteDigitos(ticket);
  const ticketNumber = ticketDigits ? Number(ticketDigits) : null;
  const ticketInvalid = ticket.trim() !== "" && (ticketNumber === null || ticketNumber < 1 || ticketNumber > 2_000_000_000);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await iniciarPersonificacao({ weddingId, reason, ticketNumber, canEdit, confirmEdit: canEdit && confirmEdit });
        if (result.success) {
          // Carga completa: o painel e a faixa fixa já nascem com a sessão nova
          setRedirecting(true);
          window.location.assign(result.redirectTo);
        } else setError(result.error);
      } catch {
        setError("Não foi possível entrar agora. Tente de novo.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex max-w-[520px] flex-col gap-5 rounded-2xl border border-linha bg-papel p-6 shadow-[var(--shadow-aceito-2)] md:p-8">
      <span className="grid size-11 place-items-center rounded-full bg-ameixa-suave text-ameixa">
        <LogIn className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-display text-[28px] leading-9 text-tinta">Entrar como {coupleNames}?</h2>
        <p className="mt-2 text-tinta-suave">Você vai ver o painel como o casal vê, inclusive a lista de convidados. Use só quando precisar ajudar.</p>
      </div>

      <NativeSelect label="Por que você vai entrar?" value={reason} onChange={(e) => setReason(e.target.value)}>
        {MOTIVOS_DE_PERSONIFICACAO.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </NativeSelect>
      <Input label="Número do chamado (opcional)" value={ticket} onChange={(e) => setTicket(e.target.value)} inputMode="numeric" placeholder="#2041" error={ticketInvalid ? "Use só o número do chamado." : undefined} />

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3">
          <Checkbox
            checked={canEdit}
            onCheckedChange={(v) => {
              setCanEdit(v === true);
              if (v !== true) setConfirmEdit(false);
            }}
            className="mt-1"
          />
          <span>
            <span className="block font-semibold text-tinta">Permitir editar</span>
            <span className="block text-sm leading-5 text-tinta-suave">Desligado, você só olha. Ligado, pede uma segunda confirmação.</span>
          </span>
        </label>
        {canEdit && (
          <div role="group" aria-label="Segunda confirmação" className="flex flex-col gap-3 rounded-xl border border-aviso/40 bg-aviso-suave p-4">
            <p className="flex items-start gap-2 text-sm font-semibold leading-5 text-tinta">
              <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> Cuidado: o que você alterar muda o casamento de verdade, e cada alteração fica no registro com o seu nome.
            </p>
            <label className="flex items-start gap-3 text-sm leading-5 text-tinta">
              <Checkbox checked={confirmEdit} onCheckedChange={(v) => setConfirmEdit(v === true)} className="mt-0.5" />
              <span>Entendo e quero poder editar durante esta entrada.</span>
            </label>
          </div>
        )}
      </div>

      <dl className="grid grid-cols-[88px_1fr] gap-x-4 gap-y-3 text-[15px] leading-6">
        <dt className="text-tinta-suave">Duração</dt>
        <dd className="text-tinta">{MAXIMO_DE_MINUTOS_DE_PERSONIFICACAO} minutos, depois sai sozinho</dd>
        <dt className="text-tinta-suave">Registro</dt>
        <dd className="text-tinta">Sua entrada, o motivo e cada ação ficam no Registro de atividades</dd>
        <dt className="text-tinta-suave">Faixa</dt>
        <dd className="text-tinta">Fica fixa no topo enquanto você estiver dentro</dd>
      </dl>

      {error && (
        <p role="alert" className="text-sm font-semibold text-perigo">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={ticketInvalid || (canEdit && !confirmEdit)} loading={pending || redirecting}>
          <LogIn className="size-4" aria-hidden="true" /> Entrar como {coupleNames}
        </Button>
        <Link href={backHref} className={btn.quiet}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
