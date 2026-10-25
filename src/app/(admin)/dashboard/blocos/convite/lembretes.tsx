import { LinkDeTexto, classeDaDica, classeDoRotulo } from "../../ui";
import { LinhaDoConvidado } from "./linha-do-convidado";
import type { PropriedadesDoBlocoDeConvites } from "./tipos";
import type { EnvioDeConvites } from "./use-envio-de-convites";

type Lembretes = NonNullable<PropriedadesDoBlocoDeConvites["reminders"]>;

/** Prazo chegando: lembrar quem ainda não respondeu. */
export function LembretesDeResposta({ reminders, envio }: { reminders: Lembretes; envio: EnvioDeConvites }) {
  return (
    <div className="grid gap-2 border-t border-linha pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className={classeDoRotulo}>Lembrar quem não respondeu</h3>
        <span className={classeDaDica}>
          <b className="font-semibold tabular-nums text-tinta">{reminders.total.toLocaleString("pt-BR")}</b> {reminders.total === 1 ? "convite sem resposta" : "convites sem resposta"} · {reminders.peopleTotal.toLocaleString("pt-BR")} {reminders.peopleTotal === 1 ? "pessoa" : "pessoas"}
        </span>
      </div>
      <ul aria-label="Convites sem resposta" className="overflow-hidden rounded-[8px] border border-linha">
        {reminders.rows.map((row) => (
          <LinhaDoConvidado key={row.id} row={row} sent={envio.done.has(row.id)} onOpen={envio.aoAbrirWhatsapp} />
        ))}
        <li className="flex min-h-12 items-center justify-between gap-3 border-t border-linha bg-areia/40 px-3.5">
          <span className={classeDaDica}>
            Mostrando {reminders.rows.length} de {reminders.total.toLocaleString("pt-BR")} {reminders.total === 1 ? "convite" : "convites"}
          </span>
          <LinkDeTexto href="/convidados?resposta=sem-resposta">Ver na lista</LinkDeTexto>
        </li>
      </ul>
    </div>
  );
}
