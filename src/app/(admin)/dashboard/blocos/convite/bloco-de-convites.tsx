"use client";
// O convite: endereço para copiar, envio pelo WhatsApp, progresso dos envios e lembretes de quem não respondeu.
import { useRef, useState } from "react";
import { Check, Clock } from "lucide-react";
import { rotuloDeConvites } from "@/lib/dashboard-summary";
import { BlocoDoPainel, Etiqueta } from "../../ui";
import { AcoesDoConvite } from "./acoes-do-convite";
import { LembretesDeResposta } from "./lembretes";
import { PreviaEEndereco } from "./previa-do-convite";
import { ProgressoDosEnvios } from "./progresso-dos-envios";
import type { PropriedadesDoBlocoDeConvites } from "./tipos";
import { useEnvioDeConvites } from "./use-envio-de-convites";

export type { LinhaDeConvite, PropriedadesDoBlocoDeConvites } from "./tipos";

function SituacaoDoConvite({ invitesTotal, sentNow, prazoChegando }: { invitesTotal: number; sentNow: number; prazoChegando: boolean }) {
  if (prazoChegando) return <Etiqueta tone="aviso" icon={Clock}>Prazo chegando</Etiqueta>;
  if (invitesTotal > 0 && sentNow >= invitesTotal) {
    return (
      <Etiqueta tone="ok" icon={Check}>
        {invitesTotal} de {rotuloDeConvites(invitesTotal)} {invitesTotal === 1 ? "enviado" : "enviados"}
      </Etiqueta>
    );
  }
  return <Etiqueta tone="ok" icon={Check}>Site no ar</Etiqueta>;
}

export function BlocoDeConvites(props: PropriedadesDoBlocoDeConvites) {
  const campo = useRef<HTMLInputElement>(null);
  const [listaAberta, setListaAberta] = useState(false);
  const envio = useEnvioDeConvites(props, campo);
  const { canSendEach, firstAccess, reminders } = props;
  return (
    <BlocoDoPainel id="convite" title="Convite" className="min-[1200px]:col-span-7" aside={<SituacaoDoConvite invitesTotal={props.invitesTotal} sentNow={envio.sentNow} prazoChegando={Boolean(reminders && reminders.total > 0)} />}>
      <PreviaEEndereco displayUrl={props.displayUrl} firstAccess={firstAccess} campo={campo} coverUrl={props.coverUrl} coupleNames={props.coupleNames} initials={props.initials} dateShort={props.dateShort} />
      <AcoesDoConvite generalWhatsappUrl={props.generalWhatsappUrl} generalMessage={props.generalMessage} canSendEach={canSendEach} firstAccess={firstAccess} listaAberta={listaAberta} aoAlternarLista={() => setListaAberta((v) => !v)} envio={envio} />
      <ProgressoDosEnvios invitesTotal={props.invitesTotal} canSendEach={canSendEach} firstAccess={firstAccess} listaAberta={listaAberta} toInvite={props.toInvite} envio={envio} />
      {reminders && reminders.total > 0 && canSendEach && <LembretesDeResposta reminders={reminders} envio={envio} />}
    </BlocoDoPainel>
  );
}
