import { rotuloDeConvites } from "@/lib/resumo/datas";
import { LinkDeTexto, MedidorDeProgresso, classeDaDica, classeDoRotulo } from "../../ui";
import { LinhaDoConvidado } from "./linha-do-convidado";
import type { LinhaDeConvite } from "./tipos";
import type { EnvioDeConvites } from "./use-envio-de-convites";

interface PropriedadesDoProgresso {
  invitesTotal: number;
  canSendEach: boolean;
  firstAccess: boolean;
  listaAberta: boolean;
  toInvite: { rows: LinhaDeConvite[]; total: number };
  envio: EnvioDeConvites;
}

function ListaPorEnviar({ toInvite, envio }: Pick<PropriedadesDoProgresso, "toInvite" | "envio">) {
  if (toInvite.rows.length === 0) return <p className={`${classeDaDica} py-2`}>Todos os convites já foram enviados.</p>;
  return (
    <ul aria-label="Convites por enviar" className="mt-1 overflow-hidden rounded-[8px] border border-linha">
      {toInvite.rows.map((row) => (
        <LinhaDoConvidado key={row.id} row={row} sent={envio.done.has(row.id)} onOpen={envio.aoAbrirWhatsapp} />
      ))}
      <li className="flex min-h-12 items-center justify-between gap-3 border-t border-linha bg-areia/40 px-3.5">
        <span className={classeDaDica}>
          Mostrando {toInvite.rows.length} de {toInvite.total.toLocaleString("pt-BR")} {toInvite.total === 1 ? "convite por enviar" : "convites por enviar"}
        </span>
        <LinkDeTexto href="/convidados">Ver na lista</LinkDeTexto>
      </li>
    </ul>
  );
}

/** Quantos convites já chegaram, e a lista para mandar um por um. */
export function ProgressoDosEnvios({ invitesTotal, canSendEach, firstAccess, listaAberta, toInvite, envio }: PropriedadesDoProgresso) {
  const { sentNow, remaining } = envio;
  return (
    <div className="grid gap-2 border-t border-linha pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className={classeDoRotulo}>Convites enviados</span>
        {invitesTotal === 0 ? (
          <span className={classeDaDica}>Nenhum convidado na lista ainda</span>
        ) : (
          <span className={classeDaDica}>
            <b className="font-semibold tabular-nums text-tinta">{sentNow.toLocaleString("pt-BR")}</b> de {rotuloDeConvites(invitesTotal)} ·{" "}
            <b className="font-semibold tabular-nums text-tinta">{remaining.toLocaleString("pt-BR")}</b> por enviar
          </span>
        )}
      </div>
      <MedidorDeProgresso
        label={invitesTotal === 0 ? "Nenhum convite para enviar ainda" : `${sentNow} de ${rotuloDeConvites(invitesTotal)} ${invitesTotal === 1 ? "enviado" : "enviados"}`}
        segments={[
          { value: sentNow, className: "bg-ameixa" },
          { value: remaining, className: "bg-areia" },
        ]}
      />
      {canSendEach && !firstAccess && (
        <div id="lista-envio" hidden={!listaAberta}>
          <ListaPorEnviar toInvite={toInvite} envio={envio} />
        </div>
      )}
    </div>
  );
}
