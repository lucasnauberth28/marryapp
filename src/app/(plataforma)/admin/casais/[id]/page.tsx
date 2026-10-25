import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AlertTriangle, Ban, CheckCircle2, Clock, Eye, Globe, Lock, LogIn, Mail, Receipt } from "lucide-react";
import { PageHeader } from "@/components/plataforma/page-header";
import { Panel } from "@/components/plataforma/panel";
import { StatCard, StatGrid } from "@/components/plataforma/stat-card";
import { PendingRegion } from "@/components/plataforma/pending";
import { TabsNav } from "@/components/plataforma/tabs-nav";
import { PlanChip, StatusChip, type StatusTone } from "@/components/plataforma/status-chip";
import { EmptyState } from "@/components/plataforma/empty-state";
import { Notice } from "@/components/plataforma/notices";
import { btn } from "@/components/landing/styles";
import { Switch } from "@/components/ui/switch";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { umDosValores, type ParametrosDeBusca } from "@/lib/platform/list-params";
import { diasEntre, formatarData, formatarDataEHora, formatarInteiro, formatarDataPorExtenso, formatarPercentual, formatarDiaDaSemana, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import {
  obterAtividadeDoCasal,
  obterDominioDoCasal,
  obterNumerosDeConvidadosDoCasal,
  obterCabecalhoDoCasal,
  obterMadrinhaDoCasal,
  obterPagamentosDoCasal,
  obterSuporteDoCasal,
  obterLinhaDoTempoDoCasal,
  type CabecalhoDoCasal,
} from "@/lib/platform/queries/casais";
import { urlDoSiteDoCasamento } from "@/lib/wedding-links";
import { obterVisaoDaContaDeRepasse } from "@/lib/payout-account-view";
import { cn } from "@/lib/utils";
import { SituationChip } from "../_components/situation-chip";
import { LinkRow } from "./_components/copy-link";
import { CareActions } from "./_components/care-actions";
import { CasalTabSkeleton } from "./_components/skeletons";
import { ConfirmPixButton } from "./_components/confirm-pix-button";
import { GrantPlanForm } from "./_components/grant-plan-form";
import { NoteForm } from "./_components/note-form";
import { RefundForm } from "./_components/refund-form";

export const metadata = { title: "Casal" };

const TABS = ["visao", "pagamentos", "convidados", "atividade", "dominio", "madrinha", "suporte"] as const;
type Tab = (typeof TABS)[number];

const DOMAIN_STATUS: Record<string, { label: string; tone: StatusTone }> = {
  REQUESTED: { label: "Pedido recebido", tone: "aviso" },
  REGISTERING: { label: "Em registro", tone: "aviso" },
  REGISTERED: { label: "Registrado, falta conectar", tone: "aviso" },
  CONNECTED: { label: "No ar", tone: "sucesso" },
  REJECTED: { label: "Recusado", tone: "perigo" },
  CANCELED: { label: "Cancelado", tone: "neutro" },
};

const TICKET_STATUS: Record<string, string> = { NEW: "Novo", IN_PROGRESS: "Em andamento", ANSWERED: "Respondido", CLOSED: "Fechado" };

function Rows({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-[170px_1fr]">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-subgrid gap-1 sm:col-span-2 sm:items-baseline">
          <dt className="text-tinta-suave">{item.label}</dt>
          <dd className="min-w-0 break-words text-tinta">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const { id } = await params;
  // O id vem da URL: só serve para BUSCAR o casamento (nunca para decidir permissão). Formato inválido = 404.
  if (!z.string().uuid().safeParse(id).success) notFound();
  const tab: Tab = umDosValores(await searchParams, "aba", TABS) ?? "visao";

  const now = new Date();
  const header = await obterCabecalhoDoCasal(id, now);
  if (!header) notFound();
  const { wedding, owner, plan, guests, gifts, pix, situation, problems } = header;
  const suspended = Boolean(wedding.suspendedAt);
  const siteUrl = urlDoSiteDoCasamento(wedding.slug, undefined, wedding.customDomain);
  const daysLeft = wedding.weddingDate ? diasEntre(wedding.weddingDate, now) : null;
  const closeToWedding = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14;
  const base = `/admin/casais/${id}`;

  const sideColumn = (
    <aside className="flex flex-col gap-6">
      <PlanPanel header={header} />
      {tab === "visao" && <HealthPanel header={header} />}
      {tab === "pagamentos" && (
        <Panel title="Contato">
          <Rows items={[{ label: "E-mail", value: owner?.username ?? "sem e-mail" }]} />
          {owner && (
            <a href={`mailto:${owner.username}`} className={cn(btn.secondary, btn.sm, "mt-4 gap-2")}>
              <Mail className="size-4" aria-hidden="true" /> Enviar e-mail
            </a>
          )}
        </Panel>
      )}
      <Panel title="Ações com cuidado">
        <CareActions weddingId={id} coupleNames={wedding.coupleNames} suspended={suspended} />
        <Notice tone="neutro" icon={Receipt} className="mt-4">
          Cada uma pede confirmação e motivo. Fica no Registro de atividades com o seu nome, o horário e o motivo.
        </Notice>
      </Panel>
    </aside>
  );

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: "Casais", href: "/admin/casais" }, { label: wedding.coupleNames }]}
        eyebrow="Casal"
        title={wedding.coupleNames}
        description={`${wedding.city ? `${wedding.city} · cadastrados` : "Cadastrados"} em ${formatarDataPorExtenso(wedding.createdAt).replace(/^[^,]+, /, "")}`}
        actions={
          <>
            <Link href={`${base}/entrar-como`} className={cn(btn.primary, "gap-2")}>
              <LogIn className="size-4" aria-hidden="true" /> Entrar como este casal
            </Link>
            {suspended ? (
              <span aria-disabled="true" className={cn(btn.secondary, "gap-2 opacity-50")} title="O site está fora do ar enquanto o casal estiver suspenso">
                <Globe className="size-4" aria-hidden="true" /> Abrir o site
              </span>
            ) : (
              <a href={siteUrl} target="_blank" rel="noopener noreferrer" className={cn(btn.secondary, "gap-2")}>
                <Globe className="size-4" aria-hidden="true" /> Abrir o site
              </a>
            )}
          </>
        }
      />

      <div className="-mt-2 flex flex-wrap gap-2">
        <SituationChip situation={situation} />
        <PlanChip plan={plan?.planId ?? null} />
        {suspended ? (
          <StatusChip tone="perigo" icon={Ban}>
            Site fora do ar
          </StatusChip>
        ) : (
          <StatusChip tone="sucesso" icon={Globe}>
            Site no ar
          </StatusChip>
        )}
      </div>

      {problems.length > 0 && (
        <Notice
          tone="perigo"
          icon={AlertTriangle}
          title={problems.length === 1 ? problems[0].title : `${problems.length} problemas pedem atenção`}
          aside={
            <div className="flex flex-wrap gap-2">
              {pix && <ConfirmPixButton subscriptionId={pix.id} />}
              <Link href={`${base}?aba=pagamentos`} className={`${btn.secondary} ${btn.sm}`}>
                Ver pagamentos
              </Link>
            </div>
          }
        >
          <ul className="list-disc pl-4">
            {problems.map((p) => (
              <li key={p.code}>
                {p.title}
                {p.code === "suspended" && wedding.suspendedReason ? `: ${wedding.suspendedReason}` : ""}
                {p.code === "onboarding_close" && daysLeft !== null ? ` (faltam ${pluralizar(daysLeft, "dia", "dias")})` : ""}
              </li>
            ))}
          </ul>
        </Notice>
      )}

      <StatGrid>
        <StatCard
          label="Casamento"
          value={wedding.weddingDate ? formatarData(wedding.weddingDate) : "Sem data"}
          hint={wedding.weddingDate ? `${formatarDiaDaSemana(wedding.weddingDate)} · ${daysLeft! >= 0 ? `faltam ${pluralizar(daysLeft!, "dia", "dias")}` : `foi há ${pluralizar(-daysLeft!, "dia", "dias")}`}` : "O casal ainda não informou"}
          highlight={closeToWedding && problems.length > 0}
        />
        <StatCard
          label="Convidados"
          value={formatarInteiro(guests.total)}
          hint={guests.total === 0 ? "Lista vazia" : `${formatarInteiro(guests.confirmed)} confirmaram (${formatarPercentual(guests.confirmed, guests.total)})`}
        />
        <StatCard label="Presentes" value={formatarReais(gifts.cents)} hint={gifts.count === 0 ? "Nenhum presente recebido" : `${pluralizar(gifts.count, "presente recebido", "presentes recebidos")}`} />
        <StatCard
          label="Última atividade"
          value={wedding.lastActiveAt ? haQuantoTempo(wedding.lastActiveAt) : "—"}
          hint={wedding.lastActiveAt ? formatarDataEHora(wedding.lastActiveAt) : "Sem registro de visita (só medimos desde agora)"}
        />
      </StatGrid>

      <TabsNav
        label="Abas do casal"
        basePath={base}
        active={tab}
        tabs={[
          { value: "visao", label: "Visão geral" },
          { value: "pagamentos", label: "Pagamentos e plano", count: pix ? 1 : undefined },
          { value: "convidados", label: "Convidados e presentes" },
          { value: "atividade", label: "Atividade e notificações" },
          { value: "dominio", label: "Domínio" },
          { value: "madrinha", label: "Liz" },
          { value: "suporte", label: "Suporte" },
        ]}
      />

      {/* Cada aba busca os próprios dados: o cabeçalho e os números ficam na tela e só o corpo mostra o esqueleto (key = aba) */}
      <PendingRegion>
        <Suspense key={tab} fallback={<CasalTabSkeleton tab={tab} />}>
          {tab === "visao" && <VisaoTab header={header} sideColumn={sideColumn} />}
          {tab === "pagamentos" && <PagamentosTab header={header} sideColumn={sideColumn} />}
          {tab === "convidados" && <ConvidadosTab id={id} />}
          {tab === "atividade" && <AtividadeTab id={id} />}
          {tab === "dominio" && <DominioTab id={id} />}
          {tab === "madrinha" && <MadrinhaTab id={id} />}
          {tab === "suporte" && <SuporteTab id={id} />}
        </Suspense>
      </PendingRegion>
    </>
  );
}

// ---------- Painéis laterais ----------

function PlanPanel({ header }: { header: CabecalhoDoCasal }) {
  const { plan, gifts, pix, wedding } = header;
  return (
    <Panel title="Plano">
      <p className="font-display text-[32px] leading-10 text-tinta">{plan?.planName.replace(/^Plano /, "") ?? "Básico"}</p>
      <p className="mt-1 text-sm leading-5 text-tinta-suave">
        {plan
          ? plan.amount > 0
            ? `Pago em ${plan.paidAt ? formatarData(plan.paidAt) : "data não registrada"} · ${formatarReais(plan.amount)} · sem mensalidade`
            : "Liberado como cortesia · sem cobrança"
          : "Gratuito"}
        {` · taxas de presentes até agora ${formatarReais(gifts.feeCents)}`}
      </p>
      {pix && (
        <div className="mt-4 flex flex-col gap-3">
          <Notice tone="aviso" icon={Clock}>
            <strong>Pix do {pix.planName.replace(/^Plano /, "")} a conferir.</strong> {formatarReais(pix.amount)}, gerado {haQuantoTempo(pix.createdAt)}.
          </Notice>
          <div>
            <ConfirmPixButton subscriptionId={pix.id} />
          </div>
        </div>
      )}
      <div className="mt-4">
        <Link href={`/admin/casais/${wedding.id}?aba=pagamentos#conceder`} className={`${btn.secondary} ${btn.sm}`}>
          Conceder um plano
        </Link>
      </div>
    </Panel>
  );
}

function HealthPanel({ header }: { header: CabecalhoDoCasal }) {
  const { wedding, guests } = header;
  const suspended = Boolean(wedding.suspendedAt);
  const items: { ok: boolean; title: string; detail: string }[] = [
    suspended
      ? { ok: false, title: "Site fora do ar", detail: `suspenso em ${formatarData(wedding.suspendedAt!)}` }
      : { ok: true, title: "Site no ar", detail: `desde o cadastro, em ${formatarData(wedding.createdAt)}` },
    guests.total > 0 ? { ok: true, title: "Lista de convidados", detail: `${pluralizar(guests.total, "convidado cadastrado", "convidados cadastrados")}` } : { ok: false, title: "Lista de convidados", detail: "ainda sem convidados" },
    guests.total === 0
      ? { ok: true, title: "Confirmações", detail: "nada a responder ainda" }
      : guests.pending > 0
        ? { ok: false, title: "Confirmações", detail: `${pluralizar(guests.pending, "convidado ainda sem resposta", "convidados ainda sem resposta")}` }
        : { ok: true, title: "Confirmações", detail: "todos já responderam" },
  ];
  return (
    <Panel title="Saúde do casamento">
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            {item.ok ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-sucesso" aria-hidden="true" /> : <Clock className="mt-0.5 size-5 shrink-0 text-aviso" aria-hidden="true" />}
            <div>
              <p className="font-semibold leading-6 text-tinta">{item.title}</p>
              <p className="text-sm leading-5 text-tinta-suave">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ---------- Abas ----------

async function VisaoTab({ header, sideColumn }: { header: CabecalhoDoCasal; sideColumn: React.ReactNode }) {
  const { wedding, owner, openDomainOrder } = header;
  const timeline = await obterLinhaDoTempoDoCasal(wedding.id, 8);
  const emails = wedding.members.map((m) => m.username);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        <Panel title="Dados do casamento">
          <Rows
            items={[
              { label: "Casal", value: wedding.coupleNames },
              { label: emails.length > 1 ? "E-mails" : "E-mail", value: emails.length ? emails.join(", ") : "sem e-mail" },
              { label: "Cidade", value: wedding.city ?? "Não informada" },
              { label: "Domínio próprio", value: wedding.customDomain ?? (openDomainOrder ? `${openDomainOrder.domain} (pedido em andamento)` : "Nenhum") },
              { label: "Cadastro", value: formatarDataEHora(wedding.createdAt) },
              { label: "Onboarding concluído", value: wedding.onboardedAt ? formatarDataEHora(wedding.onboardedAt) : "Ainda não" },
              { label: "Última entrada com senha", value: owner?.lastLoginAt ? formatarDataEHora(owner.lastLoginAt) : "Sem registro" },
            ]}
          />
        </Panel>

        <Panel title="Links do casal">
          <ul>
            <LinkRow label="Site do casal" url={urlDoSiteDoCasamento(wedding.slug, undefined, wedding.customDomain)} />
            <LinkRow label="Confirmação de presença" url={urlDoSiteDoCasamento(wedding.slug, "rsvp", wedding.customDomain)} />
            <LinkRow label="Lista de presentes" url={urlDoSiteDoCasamento(wedding.slug, "presentes", wedding.customDomain)} />
          </ul>
        </Panel>

        <Panel title="Linha do tempo" action={{ label: "Ver tudo no registro", href: "/atividades" }}>
          <Timeline items={timeline} />
        </Panel>
      </div>
      {sideColumn}
    </div>
  );
}

function Timeline({ items }: { items: Awaited<ReturnType<typeof obterLinhaDoTempoDoCasal>> }) {
  return (
    <ol className="flex flex-col">
      {items.map((item) => (
        <li key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
          <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-ameixa/70" />
          <div className="min-w-0">
            <p className="text-sm leading-5 text-tinta-suave">{formatarDataEHora(item.at)}</p>
            <p className="flex flex-wrap items-center gap-2 leading-6 text-tinta">
              {item.text}
              {item.badge && <StatusChip tone={item.badge.tone}>{item.badge.label}</StatusChip>}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

async function PagamentosTab({ header, sideColumn }: { header: CabecalhoDoCasal; sideColumn: React.ReactNode }) {
  const { wedding, plan } = header;
  const payments = await obterPagamentosDoCasal(wedding.id);
  const refundable = payments
    .filter((p) => p.status === "APPROVED" && p.amount > 0 && !p.refundRequests.some((r) => r.status === "REQUESTED"))
    .map((p) => ({ id: p.id, amountCents: p.amount, label: `${p.planName.replace(/^Plano /, "")}, ${p.paidAt ? formatarData(p.paidAt) : formatarData(p.createdAt)}, ${formatarReais(p.amount)}` }));
  const refunds = payments.flatMap((p) => p.refundRequests.map((r) => ({ ...r, planName: p.planName })));
  const STATUS: Record<string, { tone: StatusTone; label: string }> = {
    APPROVED: { tone: "sucesso", label: "Pago" },
    PENDING: { tone: "aviso", label: "Aguardando" },
    REJECTED: { tone: "perigo", label: "Recusado" },
    FAILED: { tone: "perigo", label: "Falhou" },
    REFUNDED: { tone: "neutro", label: "Estornado" },
  };
  const REFUND_STATUS: Record<string, string> = { REQUESTED: "Para decidir", REFUNDED: "Reembolsado", DENIED: "Negado" };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        <Panel title="Pagamentos" aside={<span className="text-sm text-tinta-suave">Plano de casal é pago uma vez</span>}>
          {payments.length === 0 ? (
            <p className="text-tinta-suave">Este casal ainda não gerou nenhum pagamento de plano.</p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left text-[15px]">
                  <caption className="sr-only">Pagamentos de plano do casal</caption>
                  <thead>
                    <tr className="border-b border-linha text-[13px] font-semibold text-tinta-suave">
                      {["Quando", "Plano", "Valor", "Forma", "Situação", "Recibo"].map((h) => (
                        <th key={h} scope="col" className={cn("px-2 py-2", h === "Valor" && "text-right")}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-linha last:border-b-0">
                        <td className="px-2 py-3">{formatarDataEHora(p.paidAt ?? p.createdAt)}</td>
                        <td className="px-2 py-3">{p.planName.replace(/^Plano /, "")}</td>
                        <td className="px-2 py-3 text-right tabular-nums">{formatarReais(p.amount)}</td>
                        <td className="px-2 py-3">{p.method}</td>
                        <td className="px-2 py-3">
                          <StatusChip tone={STATUS[p.status]?.tone ?? "neutro"}>{STATUS[p.status]?.label ?? p.status}</StatusChip>
                        </td>
                        <td className="px-2 py-3">
                          {p.status === "APPROVED" && p.amount > 0 ? (
                            <Link href={`/recibo/${p.id}`} className="font-semibold text-ameixa underline underline-offset-2">
                              Recibo
                            </Link>
                          ) : (
                            <span className="text-sm text-tinta-suave">Sem recibo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="flex flex-col gap-3 md:hidden">
                {payments.map((p) => (
                  <li key={p.id} className="rounded-xl border border-linha p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{p.planName.replace(/^Plano /, "")} · {formatarReais(p.amount)}</p>
                      <StatusChip tone={STATUS[p.status]?.tone ?? "neutro"}>{STATUS[p.status]?.label ?? p.status}</StatusChip>
                    </div>
                    <p className="mt-1 text-sm text-tinta-suave">{formatarDataEHora(p.paidAt ?? p.createdAt)} · {p.method}</p>
                    {p.status === "APPROVED" && p.amount > 0 && (
                      <Link href={`/recibo/${p.id}`} className="mt-1 inline-block text-sm font-semibold text-ameixa underline underline-offset-2">
                        Recibo
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <PayoutPanel weddingId={wedding.id} />

        <Panel>
          <GrantPlanForm weddingId={wedding.id} currentPlanId={plan?.planId ?? null} />
        </Panel>

        <Panel title="Reembolso">
          <RefundForm weddingId={wedding.id} options={refundable} />
          {refunds.length > 0 && (
            <ul className="mt-5 flex flex-col gap-2 border-t border-linha pt-4">
              {refunds.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    {formatarReais(r.amount)} do plano {r.planName.replace(/^Plano /, "")}, pedido em {formatarData(r.createdAt)}
                  </span>
                  <StatusChip tone={r.status === "REQUESTED" ? "aviso" : "neutro"}>{REFUND_STATUS[r.status] ?? r.status}</StatusChip>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      {sideColumn}
    </div>
  );
}

// Dados de recebimento do casal: SOMENTE a máscara, sem botão que decifre. A página já passou por requirePlatformAdminPage.
async function PayoutPanel({ weddingId }: { weddingId: string }) {
  const account = await obterVisaoDaContaDeRepasse(weddingId);
  return (
    <Panel
      title="Dados de recebimento"
      aside={
        account ? (
          <StatusChip tone={account.verifiedAt ? "sucesso" : "aviso"} icon={account.verifiedAt ? CheckCircle2 : Clock}>
            {account.verifiedAt ? "Confirmado pelo casal" : "Falta o casal confirmar"}
          </StatusChip>
        ) : (
          <StatusChip tone="neutro">Não cadastrados</StatusChip>
        )
      }
    >
      {account ? (
        <Rows
          items={[
            { label: "Cadastrados", value: "Sim" },
            { label: "Tipo", value: account.type === "PIX_KEY" ? "Chave Pix" : "Conta bancária" },
            { label: "Destino", value: account.keyHint },
            { label: "Titular", value: `${account.holderName} (${account.holderDocumentHint})` },
            { label: "Verificado em", value: account.verifiedAt ? formatarDataEHora(account.verifiedAt) : "Ainda não" },
            { label: "Atualizado em", value: formatarDataEHora(account.updatedAt) },
          ]}
        />
      ) : (
        <p className="text-tinta-suave">O casal ainda não cadastrou onde receber os presentes.</p>
      )}
      <Notice tone="neutro" icon={Lock} className="mt-4">
        Os dados ficam criptografados e esta tela mostra só a máscara. Nenhuma ação daqui decifra o dado, e o repasse ainda não é automático.
      </Notice>
    </Panel>
  );
}

async function ConvidadosTab({ id }: { id: string }) {
  const n = await obterNumerosDeConvidadosDoCasal(id);
  const pct = (v: number) => (n.total ? `${(v / n.total) * 100}%` : "0%");
  return (
    <Panel title="Só números e saúde">
      <Notice tone="neutro" icon={Lock} className="mb-5">
        Nomes, telefones e restrições dos convidados ficam escondidos. A privacidade deles é do casal.
      </Notice>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-lg font-semibold">{pluralizar(n.total, "convidado", "convidados")}</p>
        {n.total > 0 && (
          <p className="text-sm text-tinta-suave">
            {n.confirmed} vão · {n.declined} não vão · {n.pending} sem resposta
          </p>
        )}
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-areia" role="img" aria-label={`${n.confirmed} confirmaram, ${n.declined} recusaram, ${n.pending} sem resposta`}>
        <span className="bg-sucesso" style={{ width: pct(n.confirmed) }} />
        <span className="bg-perigo" style={{ width: pct(n.declined) }} />
      </div>
      <div className="mt-5">
        <Rows
          items={[
            { label: "Convites enviados", value: n.total === 0 ? "Nenhum convidado ainda" : `${n.invited} de ${n.total}` },
            { label: "Sem telefone cadastrado", value: pluralizar(n.noPhone, "convidado", "convidados") },
            { label: "Presentes", value: n.giftsCount === 0 ? "Nenhum presente recebido" : `${formatarReais(n.giftsCents)} em ${pluralizar(n.giftsCount, "presente", "presentes")}` },
            { label: "Taxas pagas", value: formatarReais(n.feesCents) },
          ]}
        />
      </div>
    </Panel>
  );
}

async function AtividadeTab({ id }: { id: string }) {
  const [timeline, activity] = await Promise.all([obterLinhaDoTempoDoCasal(id, 20), obterAtividadeDoCasal(id)]);
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Panel title="O que aconteceu" action={{ label: "Abrir no registro", href: "/atividades" }}>
        <Timeline items={timeline} />
      </Panel>
      <Panel title="Avisos enviados ao casal">
        {activity.notifications.length === 0 ? (
          <p className="text-tinta-suave">Nenhum aviso foi enviado a este casal ainda.</p>
        ) : (
          <ul className="flex flex-col">
            {activity.notifications.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
                <span className="min-w-0">
                  <span className="block leading-6 text-tinta">{n.title}</span>
                  <span className="block text-sm text-tinta-suave">{formatarDataEHora(n.createdAt)}</span>
                </span>
                {n.readAt ? (
                  <StatusChip tone="sucesso" icon={CheckCircle2}>
                    Lida
                  </StatusChip>
                ) : (
                  <StatusChip tone="neutro" icon={Eye}>
                    Não lida
                  </StatusChip>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

async function DominioTab({ id }: { id: string }) {
  const orders = await obterDominioDoCasal(id);
  return (
    <Panel title="Domínio próprio">
      {orders.length === 0 ? (
        <EmptyState
          icon={Globe}
          compact
          title="Sem domínio próprio"
          action={
            <Link href="/admin/dominios" className={`${btn.secondary} ${btn.sm}`}>
              Ver a fila de domínios
            </Link>
          }
        >
          O casal ainda não pediu um endereço .com.br. O plano VIP inclui um por 1 ano.
        </EmptyState>
      ) : (
        <ul className="flex flex-col">
          {orders.map((o) => {
            const s = DOMAIN_STATUS[o.status] ?? { label: o.status, tone: "neutro" as const };
            return (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
                <span>
                  <span className="block font-semibold">{o.domain}</span>
                  <span className="block text-sm text-tinta-suave">
                    Pedido em {formatarData(o.requestedAt)}
                    {o.expiresAt ? ` · vence em ${formatarData(o.expiresAt)}` : ""}
                  </span>
                </span>
                <StatusChip tone={s.tone}>{s.label}</StatusChip>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

async function MadrinhaTab({ id }: { id: string }) {
  const override = await obterMadrinhaDoCasal(id);
  return (
    <Panel title="Assistente">
      <div className="flex items-center justify-between gap-4 border-b border-linha pb-4">
        <div>
          <p className="font-semibold">Liz para este casal</p>
          <p className="text-sm text-tinta-suave">Ainda não ativada na plataforma</p>
        </div>
        <Switch checked={false} disabled aria-label="Liz para este casal (ainda não ativada na plataforma)" />
      </div>
      <p className="mt-4 text-sm leading-6 text-tinta-suave">
        Quando a Liz for ativada, aqui você vê o limite deste casal e pode bloquear por abuso.
        {override && (override.extraMessages > 0 || override.blockedAt) ? ` Já existe um ajuste guardado para este casal: ${override.extraMessages > 0 ? `${override.extraMessages} mensagens a mais` : ""}${override.blockedAt ? `${override.extraMessages > 0 ? ", " : ""}bloqueado` : ""}.` : ""}
      </p>
      <Link href="/admin/madrinha" className={cn(btn.secondary, btn.sm, "mt-4")}>
        Ver a gestão da Liz
      </Link>
    </Panel>
  );
}

async function SuporteTab({ id }: { id: string }) {
  const { notes, tickets } = await obterSuporteDoCasal(id);
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Panel title="Notas internas" aside={<StatusChip tone="neutro" icon={Lock}>Só a equipe vê</StatusChip>}>
        {notes.length === 0 ? (
          <p className="mb-4 text-tinta-suave">Nenhuma nota ainda.</p>
        ) : (
          <ul className="mb-4 flex flex-col">
            {notes.map((n) => (
              <li key={n.id} className="border-b border-linha py-3 first:pt-0">
                <p className="text-sm text-tinta-suave">
                  {n.authorName} · {formatarData(n.createdAt)}
                </p>
                <p className="whitespace-pre-wrap leading-6 text-tinta">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
        <NoteForm weddingId={id} />
      </Panel>
      <Panel title="Pedidos de ajuda deste casal">
        {tickets.length === 0 ? (
          <p className="text-tinta-suave">Nenhum chamado registrado para este casal.</p>
        ) : (
          <ul className="flex flex-col">
            {tickets.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
                <span>
                  <span className="block font-semibold">
                    #{t.number} {t.subject}
                  </span>
                  <span className="block text-sm text-tinta-suave">{formatarData(t.createdAt)}</span>
                </span>
                <StatusChip tone={t.status === "CLOSED" ? "neutro" : "aviso"}>{TICKET_STATUS[t.status] ?? t.status}</StatusChip>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/suporte" className={cn(btn.secondary, btn.sm, "mt-4")}>
          Abrir Suporte e LGPD
        </Link>
      </Panel>
    </div>
  );
}
