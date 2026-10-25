import { Check, Clock } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { situacaoDoLembreteDeRenovacao } from "@/lib/dominio/domain-renewal";
import { formatarData } from "@/lib/platform/format";
import { listarRenovacoes } from "@/lib/platform/queries/dominios";
import { BotaoDeRenovacao } from "../_components/renewal-button";

type Renovacao = Awaited<ReturnType<typeof listarRenovacoes>>[number];
type Lembrete = ReturnType<typeof situacaoDoLembreteDeRenovacao>;

function EtiquetaDoAviso({ vencido, reminder }: { vencido: boolean; reminder: Lembrete }) {
  if (vencido) return <EtiquetaDeSituacao tone="perigo">Vencido</EtiquetaDeSituacao>;
  if (reminder.kind === "sent") return <EtiquetaDeSituacao tone="sucesso" icon={Check}>Aviso de {reminder.day} dias enviado</EtiquetaDeSituacao>;
  if (reminder.kind === "due") return <EtiquetaDeSituacao tone="aviso" icon={Clock}>Aviso de {reminder.day} dias sai na próxima rotina diária</EtiquetaDeSituacao>;
  if (reminder.kind === "scheduled") return <EtiquetaDeSituacao tone="neutro" icon={Clock}>Aviso de {reminder.day} dias em {formatarData(reminder.on)}</EtiquetaDeSituacao>;
  return <EtiquetaDeSituacao tone="neutro">Sem aviso previsto</EtiquetaDeSituacao>;
}

function ItemDeRenovacao({ r, now }: { r: Renovacao; now: Date }) {
  const reminder = situacaoDoLembreteDeRenovacao({ expiresAt: r.expiresAt, now, lastSent: r.renewalReminderDays });
  const vencido = r.expiresAt < now;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="break-all font-mono text-[15px] text-tinta">{r.domain}</p>
        <p className="text-sm text-tinta-suave">{vencido ? `Venceu em ${formatarData(r.expiresAt)}` : `Vence em ${formatarData(r.expiresAt)}`}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <EtiquetaDoAviso vencido={vencido} reminder={reminder} />
        <BotaoDeRenovacao orderId={r.id} domain={r.domain} />
      </div>
    </li>
  );
}

export async function BlocoDeRenovacoes({ now }: { now: Date }) {
  const renewals = await listarRenovacoes(now, 90);
  return (
    <Painel title="Renovações dos próximos 90 dias" description="O VIP inclui o primeiro ano. Avisamos o casal por e-mail 60 e 30 dias antes de vencer (rotina diária). A renovação no Registro.br é manual.">
      {renewals.length === 0 ? (
        <p className="text-sm text-tinta-suave">Nenhum domínio vence nos próximos 90 dias.</p>
      ) : (
        <ul className="flex flex-col">
          {renewals.map((r) => (
            <ItemDeRenovacao key={r.id} r={r} now={now} />
          ))}
        </ul>
      )}
    </Painel>
  );
}
