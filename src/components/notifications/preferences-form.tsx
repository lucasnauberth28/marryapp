"use client";

import { useRef, useState } from "react";
import { Moon } from "lucide-react";
import { toast } from "sonner";
import { salvarPreferenciasDeNotificacao } from "@/actions/notification-preferences-actions";
import { ROTULO_DO_GRUPO, type PublicoDaNotificacao, type GrupoDeNotificacao } from "@/lib/notifications/catalog";
import { canaisOferecidos, type CanalDeNotificacao, type PreferenciasDeNotificacao } from "@/lib/notifications/preferences";
import { NativeSelect } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PushCard } from "./push-card";
import { ToggleSwitch } from "./toggle-switch";

interface Props {
  initial: PreferenciasDeNotificacao;
  audience: PublicoDaNotificacao;
  groups: GrupoDeNotificacao[];
  pushPublicKey: string | null;
}

const CHANNEL_LABEL: Record<CanalDeNotificacao, { title: string; hint: string }> = {
  push: { title: "Aviso no aparelho", hint: "Notificação no celular ou no computador" },
  whatsapp: { title: "WhatsApp", hint: "Só para o que não pode esperar" },
  email: { title: "E-mail", hint: "Uma mensagem na sua caixa de entrada" },
};

const WHATSAPP_HINT: Partial<Record<GrupoDeNotificacao, string>> = {
  requests: "Só para novos pedidos de orçamento",
  account: "Só para plano ativado e perto de vencer",
};

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h: number) => `${h}h`;

/**
 * "Avisos" da conta: aviso no aparelho, e canais por grupo, e horário de silêncio.
 * A tela muda na hora e salva em seguida; se o servidor recusar, volta ao que estava salvo e avisa.
 */
export function PreferencesForm({ initial, audience, groups, pushPublicKey }: Props) {
  const [prefs, setPrefs] = useState(initial);
  const saved = useRef(initial);
  const seq = useRef(0);

  async function commit(next: PreferenciasDeNotificacao) {
    setPrefs(next);
    const mine = ++seq.current;
    try {
      const res = await salvarPreferenciasDeNotificacao(next);
      if (res.success) {
        saved.current = next;
        return;
      }
      if (mine === seq.current) setPrefs(saved.current);
      toast.error(res.error);
    } catch {
      if (mine === seq.current) setPrefs(saved.current);
      toast.error("Não conseguimos salvar agora. Tente de novo.");
    }
  }

  const setChannel = (channel: CanalDeNotificacao, group: GrupoDeNotificacao, value: boolean) =>
    commit({ ...prefs, channels: { ...prefs.channels, [channel]: { ...prefs.channels[channel], [group]: value } } });

  const setQuiet = (patch: Partial<PreferenciasDeNotificacao["quietHours"]>) => commit({ ...prefs, quietHours: { ...prefs.quietHours, ...patch } });

  const quiet = prefs.quietHours;

  return (
    <div className="flex flex-col gap-5">
      <PushCard publicKey={pushPublicKey} />

      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-tinta">O que você quer receber</h3>
        {groups.map((group) => {
          const channels = canaisOferecidos(group, audience);
          return (
            <fieldset key={group} className="rounded-2xl border border-linha bg-papel p-4">
              <legend className="sr-only">{ROTULO_DO_GRUPO[group].title}</legend>
              <p className="text-[15px] font-semibold text-tinta" aria-hidden="true">
                {ROTULO_DO_GRUPO[group].title}
              </p>
              <p className="mt-0.5 text-sm leading-5 text-tinta-suave" aria-hidden="true">
                {ROTULO_DO_GRUPO[group].hint}
              </p>
              <ul className="mt-2 divide-y divide-linha">
                {channels.map((channel) => (
                  <li key={channel} className="flex min-h-14 items-center justify-between gap-3 py-1">
                    <span className="min-w-0">
                      <span className="block text-[15px] text-tinta">{CHANNEL_LABEL[channel].title}</span>
                      <span className="block text-sm leading-5 text-tinta-suave">
                        {channel === "whatsapp" ? (WHATSAPP_HINT[group] ?? CHANNEL_LABEL.whatsapp.hint) : CHANNEL_LABEL[channel].hint}
                      </span>
                    </span>
                    <ToggleSwitch
                      checked={prefs.channels[channel][group]}
                      onChange={(value) => void setChannel(channel, group, value)}
                      label={`${ROTULO_DO_GRUPO[group].title}: ${CHANNEL_LABEL[channel].title}`}
                    />
                  </li>
                ))}
              </ul>
            </fieldset>
          );
        })}
      </div>

      <fieldset className="rounded-2xl border border-linha bg-papel p-4">
        <legend className="sr-only">Horário de silêncio</legend>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-ameixa-suave text-ameixa">
              <Moon className="size-[18px]" strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-tinta" aria-hidden="true">
                Não incomodar à noite
              </p>
              <p className="mt-0.5 text-sm leading-5 text-tinta-suave">
                Nesse horário o aviso no aparelho e o WhatsApp esperam. Pagamentos recebidos continuam chegando, e o sino guarda tudo.
              </p>
            </div>
          </div>
          <ToggleSwitch checked={quiet.enabled} onChange={(value) => void setQuiet({ enabled: value })} label="Não incomodar à noite" />
        </div>

        <div className={cn("mt-4 flex flex-wrap items-center gap-x-4 gap-y-4 pl-[52px]", !quiet.enabled && "opacity-80")}>
          <NativeSelect
            id="silencio-inicio"
            label="Das"
            fieldClassName="w-32"
            value={quiet.startHour}
            disabled={!quiet.enabled}
            onChange={(e) => void setQuiet({ startHour: Number(e.target.value) })}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            id="silencio-fim"
            label="Até"
            fieldClassName="w-32"
            value={quiet.endHour}
            disabled={!quiet.enabled}
            onChange={(e) => void setQuiet({ endHour: Number(e.target.value) })}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </NativeSelect>
          <span className="text-xs text-tinta-suave">Horário de Brasília</span>
        </div>
        {quiet.enabled && quiet.startHour === quiet.endHour && (
          <p className="mt-2 pl-[52px] text-sm text-aviso">Início e fim iguais: assim não há silêncio nenhum.</p>
        )}
      </fieldset>
    </div>
  );
}
