import { Aparicao } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import type { SituacaoDaAgenda } from "./agenda";
import type { PedidoCompleto } from "./dados";
import { ESTILO_DO_CARTAO, ESTILO_DO_SOBRETITULO } from "./estilos";

function fatosDoCasamento(lead: PedidoCompleto, dateLong: string | null) {
  return [
    { label: "Data", value: dateLong ?? "A definir" },
    { label: "Local", value: lead.location ?? "Não informado" },
    { label: "Convidados", value: lead.guestCount ? String(lead.guestCount) : "Não informado" },
    { label: "Orçamento previsto", value: lead.budget ?? "Não informado" },
    { label: "Reunião", value: lead.meetingType === "PRESENTIAL" ? "Presencial" : lead.meetingType === "ONLINE" ? "Online" : "Sem preferência" },
  ];
}

export function CartaoDoCasamento({ lead, dateLong, agenda }: { lead: PedidoCompleto; dateLong: string | null; agenda: SituacaoDaAgenda }) {
  return (
    <Aparicao variant="up" delay={80}>
      <section aria-labelledby="casamento-titulo" className={cn(ESTILO_DO_CARTAO, "flex flex-col gap-4")}>
        <h2 id="casamento-titulo" className="text-lg font-semibold">
          O casamento
        </h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {fatosDoCasamento(lead, dateLong).map((f) => (
            <div key={f.label} className="flex min-w-0 flex-col gap-0.5">
              <dt className={ESTILO_DO_SOBRETITULO}>{f.label}</dt>
              <dd className="text-base font-semibold break-words sm:text-[17px]">{f.value}</dd>
            </div>
          ))}
          <div className="col-span-2 flex min-w-0 flex-col gap-0.5 sm:col-span-1">
            <dt className={ESTILO_DO_SOBRETITULO}>Sua agenda</dt>
            <dd className={cn("text-base font-semibold sm:text-[17px]", agenda.tone === "sucesso" && "text-sucesso", agenda.tone === "perigo" && "text-perigo", agenda.tone === "suave" && "text-tinta-suave")}>{agenda.label}</dd>
            {agenda.note ? <dd className="text-sm text-tinta-suave">{agenda.note}</dd> : null}
          </div>
        </dl>
        {lead.message ? (
          <div className="flex flex-col gap-1.5 border-t border-linha pt-4">
            <p className={ESTILO_DO_SOBRETITULO}>Mensagem do casal</p>
            <p className="font-display text-[19px] leading-7 whitespace-pre-line break-words sm:text-[22px] sm:leading-8">“{lead.message}”</p>
          </div>
        ) : null}
      </section>
    </Aparicao>
  );
}
