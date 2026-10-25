"use client";
// "Envios rápidos": o convite inicial e o lembrete de quem não respondeu, com um toque.
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Guest } from "@prisma/client";
import { Bell, Check, Send } from "lucide-react";
import { toast } from "sonner";
import { enviarConvitesIniciais, enviarLembretesDeConfirmacao } from "@/actions/whatsapp-actions";
import { BotaoComCarregamento } from "@/components/painel/loading-button";
import { estiloDaDicaDoPainel, estiloDoBotao, estiloDoCartao } from "@/components/painel/styles";
import { ehSoPresentePendente } from "@/lib/convidados/guest-origin";
import { temTelefone } from "./utilitarios";

type Atalho = "invites" | "reminders";

const queAindaPodeReceber = (g: Guest) => temTelefone(g) && !ehSoPresentePendente(g);

function useEnviosRapidos() {
  const router = useRouter();
  const [emAndamento, setEmAndamento] = useState<Atalho | null>(null);
  const executar = async (qual: Atalho) => {
    setEmAndamento(qual);
    const idDoAviso = toast.loading(qual === "invites" ? "Enviando os convites..." : "Enviando os lembretes...");
    const resposta = qual === "invites" ? await enviarConvitesIniciais() : await enviarLembretesDeConfirmacao();
    if (resposta.success) {
      toast.success(resposta.message, { id: idDoAviso });
      router.refresh();
    } else toast.error(resposta.error || "Não deu para enviar agora. Tente de novo.", { id: idDoAviso });
    setEmAndamento(null);
  };
  return { emAndamento, executar };
}

export function EnviosRapidos({ convidados }: { convidados: Guest[] }) {
  const { emAndamento, executar } = useEnviosRapidos();
  const aEnviar = {
    invites: convidados.filter((g) => !g.hasReceivedMessage && queAindaPodeReceber(g)).length,
    reminders: convidados.filter((g) => g.rsvpStatus === "PENDING" && g.hasReceivedMessage && queAindaPodeReceber(g)).length,
  };
  const atalhos = [
    { kind: "invites" as const, title: "Enviar convites", text: "O convite inicial vai para quem ainda não recebeu nenhuma mensagem.", botao: "Enviar convite para", nenhum: "Todos já receberam o convite" },
    { kind: "reminders" as const, title: "Lembrar quem não respondeu", text: "O lembrete vai para quem recebeu o convite e ainda não confirmou.", botao: "Enviar lembrete para", nenhum: "Ninguém para lembrar agora" },
  ];
  return (
    <section aria-labelledby="envios-rapidos" className="flex flex-col gap-4">
      <div>
        <h2 id="envios-rapidos" className="flex items-center gap-2 font-display text-2xl leading-8 text-tinta">
          <Bell className="size-5 text-ameixa" aria-hidden="true" />
          Envios rápidos
        </h2>
        <p className={`${estiloDaDicaDoPainel} mt-1`}>Os dois envios mais comuns, com um toque. Usam as mensagens de convite e de lembrete abaixo.</p>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {atalhos.map((a) => {
          const n = aEnviar[a.kind];
          return (
            <li key={a.kind} className={`${estiloDoCartao} flex flex-col gap-4 p-5`}>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-semibold leading-7 text-tinta">{a.title}</h3>
                <p className="text-[15px] leading-6 text-tinta-suave">{a.text}</p>
              </div>
              <div className="mt-auto">
                <BotaoComCarregamento loading={emAndamento === a.kind} disabled={emAndamento !== null || n === 0} onClick={() => executar(a.kind)} className={n === 0 ? estiloDoBotao.secondary : estiloDoBotao.primary}>
                  {n === 0 ? <><Check className="size-4" aria-hidden="true" />{a.nenhum}</> : <><Send className="size-4" aria-hidden="true" />{a.botao} {n} {n === 1 ? "pessoa" : "pessoas"}</>}
                </BotaoComCarregamento>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
