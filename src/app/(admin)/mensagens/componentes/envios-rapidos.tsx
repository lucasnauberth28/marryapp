"use client";
// "Envios rápidos": o convite inicial e o lembrete de quem não respondeu, em fila pelo WhatsApp do casal.
import { useState } from "react";
import type { Guest } from "@prisma/client";
import { Bell, Check, ListChecks } from "lucide-react";
import { estiloDaDicaDoPainel, estiloDoBotao, estiloDoCartao } from "@/components/painel/styles";
import { ModalPersonalizado } from "@/components/ui/custom-modal";
import { ehSoPresentePendente } from "@/lib/convidados/guest-origin";
import { FilaDeEnvio } from "./fila-de-envio";
import type { ModeloDeMensagem } from "./tipos";
import { temTelefone } from "./utilitarios";

type Atalho = "invites" | "reminders";

const queAindaPodeReceber = (g: Guest) => temTelefone(g) && !ehSoPresentePendente(g);

const ATALHOS = [
  { kind: "invites" as const, tipo: "INITIAL_INVITE", title: "Enviar convites", text: "O convite inicial, para quem ainda não recebeu nenhuma mensagem.", botao: "Montar a fila para", nenhum: "Todos já receberam o convite" },
  { kind: "reminders" as const, tipo: "RSVP_REMINDER", title: "Lembrar quem não respondeu", text: "O lembrete, para quem recebeu o convite e ainda não confirmou.", botao: "Montar a fila para", nenhum: "Ninguém para lembrar agora" },
];

export function EnviosRapidos({ convidados, modelos }: { convidados: Guest[]; modelos: ModeloDeMensagem[] }) {
  const [aberta, setAberta] = useState<{ kind: Atalho; ids: string[] } | null>(null);
  const aEnviar: Record<Atalho, string[]> = {
    invites: convidados.filter((g) => !g.hasReceivedMessage && queAindaPodeReceber(g)).map((g) => g.id),
    reminders: convidados.filter((g) => g.rsvpStatus === "PENDING" && g.hasReceivedMessage && queAindaPodeReceber(g)).map((g) => g.id),
  };
  const modeloAberto = aberta ? modelos.find((m) => m.type === ATALHOS.find((a) => a.kind === aberta.kind)?.tipo) : undefined;
  return (
    <section aria-labelledby="envios-rapidos" className="flex flex-col gap-4">
      <div>
        <h2 id="envios-rapidos" className="flex items-center gap-2 font-display text-2xl leading-8 text-tinta">
          <Bell className="size-5 text-ameixa" aria-hidden="true" />
          Envios rápidos
        </h2>
        <p className={`${estiloDaDicaDoPainel} mt-1`}>Os dois envios mais comuns. A mensagem sai do WhatsApp de vocês, uma pessoa por vez, com o texto já pronto.</p>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {ATALHOS.map((a) => {
          const n = aEnviar[a.kind].length;
          const semModelo = !modelos.some((m) => m.type === a.tipo);
          return (
            <li key={a.kind} className={`${estiloDoCartao} flex flex-col gap-4 p-5`}>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold leading-7 text-tinta">{a.title}</h3>
                <p className="text-[15px] leading-6 text-tinta-suave">{a.text}</p>
              </div>
              <div className="mt-auto">
                <button type="button" disabled={n === 0 || semModelo} onClick={() => setAberta({ kind: a.kind, ids: aEnviar[a.kind] })} className={n === 0 ? estiloDoBotao.secondary : estiloDoBotao.primary}>
                  {n === 0 ? <><Check className="size-4" aria-hidden="true" />{a.nenhum}</> : <><ListChecks className="size-4" aria-hidden="true" />{a.botao} {n} {n === 1 ? "pessoa" : "pessoas"}</>}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <ModalPersonalizado isOpen={aberta !== null && !!modeloAberto} onClose={() => setAberta(null)} title={aberta?.kind === "invites" ? "Fila de convites" : "Fila de lembretes"} description="Uma pessoa por vez, no WhatsApp de vocês." size="lg">
        {aberta && modeloAberto ? <FilaDeEnvio templateId={modeloAberto.id} ehConvite={aberta.kind === "invites"} guestIds={aberta.ids} aoFechar={() => setAberta(null)} /> : null}
      </ModalPersonalizado>
    </section>
  );
}
