import { AlertTriangle, CheckCircle2, Clock, Info, XCircle } from "lucide-react";
import { PageHeader } from "@/components/plataforma/page-header";
import { Panel } from "@/components/plataforma/panel";
import { Notice } from "@/components/plataforma/notices";
import { StatusChip, type StatusTone } from "@/components/plataforma/status-chip";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { getPlatformSetting } from "@/lib/platform/settings";
import { isEmailConfigured } from "@/lib/email";
import { getHealthSnapshot, type ServiceCounts } from "@/lib/platform/queries/saude";
import { CRON_LABEL, CRON_STATE_LABEL } from "@/lib/platform/health";
import { formatDateTime, formatInt, formatTime, plural, timeAgo } from "@/lib/platform/format";
import { AlertsForm } from "./_components/alerts-form";
import { ReconnectWhatsapp } from "./_components/reconnect-whatsapp";

export const metadata = { title: "Saúde do sistema" };
export const dynamic = "force-dynamic"; // sempre medir na hora

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-num text-[34px] leading-10 tabular-nums text-tinta">{value}</p>
      <p className="text-sm leading-5 text-tinta-suave">{label}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 text-[15px] leading-5">
      <dt className="text-tinta-suave">{label}</dt>
      <dd className="text-right font-semibold text-tinta">{children}</dd>
    </div>
  );
}

const NoRecords = ({ what }: { what: string }) => <p className="text-sm leading-5 text-tinta-suave">Sem registros ainda. {what}</p>;

/** Situação geral de um serviço, só com o que foi medido: sem configuração, sem registros, com falhas ou sem falhas. */
function serviceChip(configured: boolean, c: ServiceCounts): { tone: StatusTone; icon: typeof Clock; text: string } {
  if (!configured) return { tone: "neutro", icon: Info, text: "Não configurado" };
  if (c.failed > 0) return { tone: "aviso", icon: AlertTriangle, text: "Atenção" };
  if (c.total === 0) return { tone: "neutro", icon: Clock, text: "Sem registros" };
  return { tone: "sucesso", icon: CheckCircle2, text: "Sem falhas em 24 h" };
}

export default async function Page() {
  await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  const [h, alerts] = await Promise.all([getHealthSnapshot(), getPlatformSetting("healthAlerts")]);
  const now = h.measuredAt;

  const nothingMeasured =
    h.mercadopago.counts.total + h.email.counts.total + h.whatsapp.counts.total + h.push.counts.total === 0 && h.crons.every((c) => c.state === "never");
  const cronsAllOk = h.crons.length > 0 && h.crons.every((c) => c.state === "ok");
  const cronsBad = h.crons.some((c) => c.state === "failed" || c.state === "late");

  const mp = serviceChip(h.mercadopago.configured, h.mercadopago.counts);
  const wa = serviceChip(h.whatsapp.configured, h.whatsapp.counts);
  const waState = !h.whatsapp.configured
    ? null
    : h.whatsapp.connected === true
      ? { tone: "sucesso" as const, icon: CheckCircle2, text: "Instância conectada" }
      : h.whatsapp.connected === false
        ? { tone: "perigo" as const, icon: XCircle, text: "Instância desconectada" }
        : { tone: "neutro" as const, icon: Clock, text: "Sem resposta da instância" };
  const em = serviceChip(h.email.configured, h.email.counts);

  return (
    <>
      <PageHeader eyebrow="Sistema" title="Saúde do sistema" description={`O que faz o Aceito funcionar, num lugar só. Atualizado às ${formatTime(now)}.`} />

      {h.attention.length > 0 ? (
        <Notice tone="aviso" icon={AlertTriangle} title={`${plural(h.attention.length, "coisa pede", "coisas pedem")} atenção`}>
          {h.attention.map((a) => `${a.title}: ${a.detail}`).join(" ")}
        </Notice>
      ) : nothingMeasured ? (
        <Notice tone="neutro" icon={Info} title="Ainda estamos medindo">
          Ainda não há registros das últimas 24 horas. Assim que chegarem pagamentos, e-mails e mensagens, os números aparecem aqui. Enquanto isso, só o que dá para conferir na hora (banco e configuração) está medido.
        </Notice>
      ) : (
        <Notice tone="sucesso" icon={CheckCircle2} title="Nada pede atenção agora">
          Considerando só o que foi medido nas últimas 24 horas.
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Mercado Pago" aside={<StatusChip tone={mp.tone} icon={mp.icon}>{mp.text}</StatusChip>}>
          {!h.mercadopago.configured && <p className="mb-3 text-sm leading-5 text-aviso">O token do Mercado Pago não está configurado neste ambiente.</p>}
          {h.mercadopago.counts.total === 0 ? (
            <NoRecords what="Os avisos de pagamento recebidos passam a ser contados a partir de agora." />
          ) : (
            <>
              <div className="flex gap-10">
                <Metric value={formatInt(h.mercadopago.counts.total)} label="avisos recebidos em 24 h" />
                <Metric value={formatInt(h.mercadopago.counts.failed)} label="não aplicados" />
              </div>
              <ul className="mt-4 divide-y divide-linha">
                {h.mercadopago.recent.map((e, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
                    <span className="flex min-w-0 items-baseline gap-3">
                      <span className="text-sm tabular-nums text-tinta-suave">{formatTime(e.at)}</span>
                      <span className="truncate text-tinta">{e.message ?? "Aviso aplicado"}</span>
                    </span>
                    <StatusChip tone={e.ok ? "sucesso" : "perigo"} icon={e.ok ? CheckCircle2 : XCircle}>
                      {e.ok ? "Recebido" : "Falhou"}
                    </StatusChip>
                  </li>
                ))}
              </ul>
            </>
          )}
          <dl className="mt-3 divide-y divide-linha border-t border-linha pt-2">
            <Row label="Assinatura dos avisos">{h.mercadopago.webhookSecret ? "Conferida" : "Não configurada"}</Row>
          </dl>
        </Panel>

        <Panel
          title="Rotinas diárias"
          aside={
            h.crons.length === 0 ? undefined : cronsAllOk ? (
              <StatusChip tone="sucesso" icon={CheckCircle2}>Todas rodaram</StatusChip>
            ) : cronsBad ? (
              <StatusChip tone="aviso" icon={AlertTriangle}>Atenção</StatusChip>
            ) : (
              <StatusChip tone="neutro" icon={Clock}>Ainda não rodou</StatusChip>
            )
          }
        >
          <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
            {h.crons.map((c) => (
              <li key={c.job} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold leading-5 text-tinta">{CRON_LABEL[c.job] ?? c.job}</p>
                  <p className="text-sm leading-5 text-tinta-suave">{c.lastAt ? `${timeAgo(c.lastAt, now)}, ${formatDateTime(c.lastAt)}` : "Ainda não rodou"}</p>
                  {c.error && <p className="text-sm leading-5 text-perigo">{c.error.slice(0, 160)}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusChip tone={c.state === "ok" ? "sucesso" : c.state === "never" ? "neutro" : "perigo"} icon={c.state === "ok" ? CheckCircle2 : c.state === "never" ? Clock : XCircle}>
                    {CRON_STATE_LABEL[c.state]}
                  </StatusChip>
                  {c.result && <span className="text-sm text-tinta-suave">{c.result}</span>}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-5 text-tinta-suave">As rotinas rodam uma vez por dia e só aparecem aqui depois da primeira execução.</p>
        </Panel>

        <Panel title="WhatsApp" aside={<StatusChip tone={wa.tone} icon={wa.icon}>{wa.text}</StatusChip>}>
          {!h.whatsapp.configured ? (
            <p className="text-sm leading-5 text-tinta-suave">O WhatsApp não está configurado neste ambiente. Configure na Vercel (variáveis de ambiente da Evolution API).</p>
          ) : (
            <>
              {waState && (
                <p className="mb-4 flex items-center gap-2 text-[15px] text-tinta">
                  <waState.icon className={waState.tone === "sucesso" ? "size-5 text-sucesso" : waState.tone === "perigo" ? "size-5 text-perigo" : "size-5 text-tinta-suave"} aria-hidden="true" />
                  {waState.text}
                </p>
              )}
              {h.whatsapp.stateNote && <p className="mb-3 text-sm text-tinta-suave">{h.whatsapp.stateNote}</p>}
              {h.whatsapp.counts.total === 0 && h.whatsapp.invalidNumbers === 0 ? (
                <NoRecords what="As mensagens enviadas passam a ser contadas a partir de agora." />
              ) : (
                <div className="flex gap-10">
                  <Metric value={formatInt(h.whatsapp.counts.ok)} label="enviadas em 24 h" />
                  <Metric value={formatInt(h.whatsapp.counts.failed)} label="falhas em 24 h" />
                  <Metric value={formatInt(h.whatsapp.invalidNumbers)} label="números sem WhatsApp" />
                </div>
              )}
              <div className="mt-3">
                <ReconnectWhatsapp />
              </div>
            </>
          )}
        </Panel>

        <Panel title="E-mail e notificações" aside={<StatusChip tone={em.tone} icon={em.icon}>{em.text}</StatusChip>}>
          {!h.email.configured && <p className="mb-3 text-sm leading-5 text-aviso">O envio de e-mail (Resend) não está configurado neste ambiente.</p>}
          {h.email.counts.total === 0 ? (
            <NoRecords what="Os e-mails enviados passam a ser contados a partir de agora." />
          ) : (
            <div className="flex gap-10">
              <Metric value={formatInt(h.email.counts.ok)} label="e-mails enviados em 24 h" />
              <Metric value={formatInt(h.email.counts.failed)} label="falhas de envio" />
            </div>
          )}
          <dl className="mt-3 divide-y divide-linha border-t border-linha pt-2">
            <Row label="Notificações no celular">{h.push.configured ? "Configuradas" : "Não configuradas"}</Row>
            <Row label="Aparelhos inscritos">{formatInt(h.push.subscriptions)}</Row>
            <Row label="Envios de notificação em 24 h">{h.push.counts.total === 0 ? "Sem registros ainda" : `${formatInt(h.push.counts.ok)} certos, ${formatInt(h.push.counts.failed)} com falha`}</Row>
          </dl>
        </Panel>

        <Panel
          title="Banco e versão no ar"
          aside={
            h.database.ok ? <StatusChip tone="sucesso" icon={CheckCircle2}>Banco respondendo</StatusChip> : <StatusChip tone="perigo" icon={XCircle}>Banco sem resposta</StatusChip>
          }
        >
          <dl className="divide-y divide-linha">
            <Row label="Versão no ar">{h.version.sha ? <span className="font-mono">{h.version.sha}{h.version.env ? ` · ${h.version.env}` : ""}</span> : "Ambiente local (sem versão da Vercel)"}</Row>
            <Row label="Banco de dados">{h.database.ok && h.database.ms !== null ? `Respondendo em ${h.database.ms} ms` : "Sem resposta"}</Row>
            <Row label="Migrações">
              {h.database.migrationsApplied === null
                ? "Não foi possível contar"
                : h.database.migrationsPending === null
                  ? `${h.database.migrationsApplied} aplicadas`
                  : `${h.database.migrationsApplied} aplicadas, ${h.database.migrationsPending} pendentes`}
            </Row>
            <Row label="Sentry (erros do sistema)">{h.sentryConfigured ? "Configurado" : "Não configurado"}</Row>
          </dl>
          <p className="mt-3 text-sm leading-5 text-tinta-suave">Percentual de erros e erros por dia ainda não são medidos aqui.</p>
        </Panel>
      </div>

      <AlertsForm
        initial={{ mercadoPagoFailures: alerts.mercadoPagoFailures, whatsappDisconnected: alerts.whatsappDisconnected, routineMissed: alerts.routineMissed, sendTo: alerts.sendTo }}
        emailConfigured={isEmailConfigured()}
      />
    </>
  );
}
