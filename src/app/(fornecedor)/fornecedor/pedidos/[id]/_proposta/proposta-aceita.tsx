import { BadgeCheck } from "lucide-react";
import { CaixaDoLink } from "./caixa-do-link";
import type { PropostaSalva, ValoresDaProposta } from "./tipos";

const SOBRETITULO = "text-xs font-semibold tracking-[0.12em] text-tinta-suave uppercase";

export function PropostaAceita({ saved, valores }: { saved: PropostaSalva & { accepted: NonNullable<PropostaSalva["accepted"]> }; valores: ValoresDaProposta }) {
  return (
    <div className="flex flex-col gap-4">
      <div role="status" className="flex flex-col gap-1 rounded-xl bg-sucesso-suave p-4">
        <p className="flex items-start gap-2 text-[15px]">
          <BadgeCheck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-sucesso" />
          <strong className="font-semibold">
            Proposta aceita por {saved.accepted.name} em {saved.accepted.atLabel}.
          </strong>
        </p>
        <p className="pl-[26px] text-sm text-tinta-suave">Aceite digital registrado pelo link da proposta (nome completo, data e hora). Agora é com você: envie o contrato ao casal.</p>
      </div>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-0.5">
          <dt className={SOBRETITULO}>Valor</dt>
          <dd className="text-[17px] font-semibold">R$ {valores.amount}</dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className={SOBRETITULO}>Registrada</dt>
          <dd className="text-[17px] font-semibold">{saved.sentAtLabel}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:col-span-2">
          <dt className={SOBRETITULO}>O que está incluído</dt>
          <dd className="text-[15px] whitespace-pre-line break-words">{valores.details}</dd>
        </div>
      </dl>
      {saved.publicUrl ? <CaixaDoLink url={saved.publicUrl} /> : null}
    </div>
  );
}
