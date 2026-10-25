import { CheckCircle2, XCircle } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { formatarInteiro } from "@/lib/platform/format";
import { LinhaDaSaude, MetricaDaSaude, SemRegistros, etiquetaDoServico, type FotoDaSaude } from "./comuns";

export function PainelDeEmail({ h }: { h: FotoDaSaude }) {
  const em = etiquetaDoServico(h.email.configured, h.email.counts);
  return (
    <Painel title="E-mail e notificações" aside={<EtiquetaDeSituacao tone={em.tone} icon={em.icon}>{em.text}</EtiquetaDeSituacao>}>
      {!h.email.configured && <p className="mb-3 text-sm leading-5 text-aviso">O envio de e-mail (Resend) não está configurado neste ambiente.</p>}
      {h.email.counts.total === 0 ? (
        <SemRegistros what="Os e-mails enviados passam a ser contados a partir de agora." />
      ) : (
        <div className="flex gap-10">
          <MetricaDaSaude value={formatarInteiro(h.email.counts.ok)} label="e-mails enviados em 24 h" />
          <MetricaDaSaude value={formatarInteiro(h.email.counts.failed)} label="falhas de envio" />
        </div>
      )}
      <dl className="mt-3 divide-y divide-linha border-t border-linha pt-2">
        <LinhaDaSaude label="Notificações no celular">{h.push.configured ? "Configuradas" : "Não configuradas"}</LinhaDaSaude>
        <LinhaDaSaude label="Aparelhos inscritos">{formatarInteiro(h.push.subscriptions)}</LinhaDaSaude>
        <LinhaDaSaude label="Envios de notificação em 24 h">{h.push.counts.total === 0 ? "Sem registros ainda" : `${formatarInteiro(h.push.counts.ok)} certos, ${formatarInteiro(h.push.counts.failed)} com falha`}</LinhaDaSaude>
      </dl>
    </Painel>
  );
}

function textoDasMigracoes({ migrationsApplied, migrationsPending }: FotoDaSaude["database"]) {
  if (migrationsApplied === null) return "Não foi possível contar";
  if (migrationsPending === null) return `${migrationsApplied} aplicadas`;
  return `${migrationsApplied} aplicadas, ${migrationsPending} pendentes`;
}

export function PainelDoBanco({ h }: { h: FotoDaSaude }) {
  const etiqueta = h.database.ok ? <EtiquetaDeSituacao tone="sucesso" icon={CheckCircle2}>Banco respondendo</EtiquetaDeSituacao> : <EtiquetaDeSituacao tone="perigo" icon={XCircle}>Banco sem resposta</EtiquetaDeSituacao>;
  return (
    <Painel title="Banco e versão no ar" aside={etiqueta}>
      <dl className="divide-y divide-linha">
        <LinhaDaSaude label="Versão no ar">{h.version.sha ? <span className="font-mono">{h.version.sha}{h.version.env ? ` · ${h.version.env}` : ""}</span> : "Ambiente local (sem versão da Vercel)"}</LinhaDaSaude>
        <LinhaDaSaude label="Banco de dados">{h.database.ok && h.database.ms !== null ? `Respondendo em ${h.database.ms} ms` : "Sem resposta"}</LinhaDaSaude>
        <LinhaDaSaude label="Migrações">{textoDasMigracoes(h.database)}</LinhaDaSaude>
        <LinhaDaSaude label="Sentry (erros do sistema)">{h.sentryConfigured ? "Configurado" : "Não configurado"}</LinhaDaSaude>
      </dl>
      <p className="mt-3 text-sm leading-5 text-tinta-suave">Percentual de erros e erros por dia ainda não são medidos aqui.</p>
    </Painel>
  );
}
