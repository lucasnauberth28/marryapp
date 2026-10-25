import { Suspense } from "react";
import { Check, Clock, Globe, Hourglass, Link2, XCircle } from "lucide-react";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Paginacao } from "@/components/plataforma/pagination";
import { RegiaoPendente } from "@/components/plataforma/pending";
import { EsqueletoDasLinhas, EsqueletoDoPainelLateral } from "@/components/plataforma/loading-parts";
import { SkeletonCard } from "@/components/skeletons";
import { Painel } from "@/components/plataforma/panel";
import { TabelaResponsiva } from "@/components/plataforma/responsive-table";
import { CartaoDeIndicador, GradeDeIndicadores } from "@/components/plataforma/stat-card";
import { EtiquetaDePlano, EtiquetaDeSituacao, type TomDaSituacao } from "@/components/plataforma/status-chip";
import { NavegacaoDeAbas } from "@/components/plataforma/tabs-nav";
import { ROTULO_DA_SITUACAO, type NomeDaSituacaoDoPedidoDeDominio } from "@/lib/domain-order";
import { formatarTelefone } from "@/lib/formatacao/telefone";
import { situacaoDoLembreteDeRenovacao } from "@/lib/domain-renewal";
import { formatarData, formatarDataEHora, diaRelativo, haQuantoTempo } from "@/lib/platform/format";
import { pluralizar } from "@/lib/formatacao/plural";
import { umDosValores, parametroDaBusca, interpretarPagina, type ParametrosDeBusca } from "@/lib/platform/list-params";
import {
  TAMANHO_DA_PAGINA_DE_DOMINIOS,
  ABAS_DE_DOMINIOS,
  obterDetalheDoDominio,
  obterResumoDosPedidosDeDominio,
  obterContagensDasAbasDeDominios,
  listarPedidosDeDominio,
  listarRenovacoes,
  type AbaDeDominios,
} from "@/lib/platform/queries/dominios";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { vercelEstaConfigurada } from "@/lib/vercel-domains";
import { montarLink } from "@/lib/platform/list-params";
import { PainelDoDominio } from "./_components/domain-panel";
import { BotaoDeRenovacao } from "./_components/renewal-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Domínios" };

const ROTULO_DA_ABA: Record<AbaDeDominios, string> = { todos: "Todos", pedido: "Pedido recebido", registro: "Em registro", registrado: "Registrado", "no-ar": "No ar", recusado: "Recusado" };

const ETIQUETA_DA_SITUACAO: Record<NomeDaSituacaoDoPedidoDeDominio, { tone: TomDaSituacao; icon: typeof Clock }> = {
  REQUESTED: { tone: "aviso", icon: Clock },
  REGISTERING: { tone: "neutro", icon: Hourglass },
  REGISTERED: { tone: "aviso", icon: Check },
  CONNECTED: { tone: "sucesso", icon: Globe },
  REJECTED: { tone: "perigo", icon: XCircle },
  CANCELED: { tone: "neutro", icon: XCircle },
};

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const tab = umDosValores(query, "aba", ABAS_DE_DOMINIOS) ?? "todos";
  const selectedId = parametroDaBusca(query, "id", 40);
  const now = new Date();

  const [summary, counts, list] = await Promise.all([obterResumoDosPedidosDeDominio(), obterContagensDasAbasDeDominios(), listarPedidosDeDominio(tab, interpretarPagina(query))]);
  const rowHref = (id: string) => `${montarLink("/admin/dominios", { aba: tab === "todos" ? undefined : tab, pagina: list.page > 1 ? list.page : undefined, id })}#painel`;

  return (
    <>
      <CabecalhoDaPagina
        eyebrow="Dinheiro"
        title="Domínios"
        description="Pedidos de domínio próprio do plano VIP. O Aceito registra o .com.br no nome da pessoa que pediu."
      />

      <GradeDeIndicadores>
        <CartaoDeIndicador label="Pedido recebido" value={String(summary.requested)} hint={summary.requested > 0 ? `falta começar o registro${summary.oldestRequestedAt ? `, o mais antigo ${haQuantoTempo(summary.oldestRequestedAt, now)}` : ""}` : "nenhum esperando"} highlight={summary.requested > 0} />
        <CartaoDeIndicador label="Em registro" value={String(summary.registering)} hint={summary.registeringSince ? `desde ${formatarData(summary.registeringSince)}` : "nenhum em andamento"} />
        <CartaoDeIndicador label="Registrado" value={String(summary.registered)} hint={summary.registered > 0 ? "falta conectar" : "nenhum esperando"} highlight={summary.registered > 0} />
        <CartaoDeIndicador label="No ar" value={String(summary.connected)} hint={summary.connected > 0 ? "funcionando" : "nenhum ainda"} />
      </GradeDeIndicadores>

      <NavegacaoDeAbas
        label="Situação dos pedidos"
        basePath="/admin/dominios"
        active={tab}
        tabs={ABAS_DE_DOMINIOS.map((value) => ({ value, label: ROTULO_DA_ABA[value], count: counts[value] }))}
      />

      <RegiaoPendente>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <TabelaResponsiva
            caption="Pedidos de domínio"
            rows={list.rows}
            rowKey={(r) => r.id}
            rowHref={(r) => rowHref(r.id)}
            selectedKey={selectedId}
            empty={
              <EstadoVazio icon={Globe} title={tab === "todos" ? "Nenhum pedido de domínio ainda" : "Nenhum pedido nesta situação"} compact>
                {tab === "todos" ? "Quando um casal do plano VIP pedir o domínio próprio, o pedido aparece aqui." : "Escolha outra aba para ver os outros pedidos."}
              </EstadoVazio>
            }
            columns={[
              {
                key: "dominio",
                header: "Domínio e casal",
                primary: true,
                cell: (r) => (
                  <>
                    <span className="block break-all font-mono text-sm">{r.domain}</span>
                    <span className="block text-sm font-normal text-tinta-suave">{r.coupleNames}</span>
                  </>
                ),
              },
              {
                key: "titular",
                header: "Titular",
                cell: (r) => (
                  <>
                    <span className="block">{r.holderName}</span>
                    <span className="block text-sm text-tinta-suave">{r.holderDocument}</span>
                  </>
                ),
              },
              {
                key: "situacao",
                header: "Situação",
                cell: (r) => {
                  const chip = ETIQUETA_DA_SITUACAO[r.status as NomeDaSituacaoDoPedidoDeDominio] ?? ETIQUETA_DA_SITUACAO.CANCELED;
                  return (
                    <EtiquetaDeSituacao tone={chip.tone} icon={chip.icon}>
                      {ROTULO_DA_SITUACAO[r.status as NomeDaSituacaoDoPedidoDeDominio] ?? r.status}
                    </EtiquetaDeSituacao>
                  );
                },
              },
              {
                key: "vence",
                header: "Vence",
                cell: (r) =>
                  r.expiresAt ? (
                    <>
                      <span className="block">{formatarData(r.expiresAt)}</span>
                      {(r.expiresAt.getTime() - now.getTime()) / 86_400_000 <= 60 ? <span className="block text-sm font-semibold text-aviso">{r.expiresAt < now ? "venceu" : `renova ${diaRelativo(r.expiresAt, now)}`}</span> : null}
                    </>
                  ) : r.rejectionReason ? (
                    <span className="text-sm text-tinta-suave">{r.rejectionReason}</span>
                  ) : (
                    <span className="text-tinta-suave">Sem data</span>
                  ),
              },
            ]}
          />
          <Paginacao page={list.page} pageSize={TAMANHO_DA_PAGINA_DE_DOMINIOS} total={list.total} basePath="/admin/dominios" params={{ aba: tab === "todos" ? undefined : tab }} noun={["pedido", "pedidos"]} />

          <Suspense
            fallback={
              <SkeletonCard description>
                <EsqueletoDasLinhas rows={3} />
              </SkeletonCard>
            }
          >
            <BlocoDeRenovacoes now={now} />
          </Suspense>
        </div>

        <div id="painel" className="scroll-mt-6 lg:sticky lg:top-6">
          {/* O painel busca o pedido escolhido sozinho: a lista não espera por ele (key = pedido) */}
          <Suspense key={selectedId ?? "nenhum"} fallback={<EsqueletoDoPainelLateral />}>
            <AreaDoDetalheDoDominio selectedId={selectedId} summary={summary} />
          </Suspense>
        </div>
      </div>
      </RegiaoPendente>
    </>
  );
}

async function BlocoDeRenovacoes({ now }: { now: Date }) {
  const renewals = await listarRenovacoes(now, 90);
  return (
    <Painel title="Renovações dos próximos 90 dias" description="O VIP inclui o primeiro ano. Avisamos o casal por e-mail 60 e 30 dias antes de vencer (rotina diária). A renovação no Registro.br é manual.">
      {renewals.length === 0 ? (
        <p className="text-sm text-tinta-suave">Nenhum domínio vence nos próximos 90 dias.</p>
      ) : (
        <ul className="flex flex-col">
          {renewals.map((r) => {
            const reminder = situacaoDoLembreteDeRenovacao({ expiresAt: r.expiresAt, now, lastSent: r.renewalReminderDays });
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-linha py-3 first:pt-0 last:border-b-0 last:pb-0">
                <div className="min-w-0">
                  <p className="break-all font-mono text-[15px] text-tinta">{r.domain}</p>
                  <p className="text-sm text-tinta-suave">{r.expiresAt < now ? `Venceu em ${formatarData(r.expiresAt)}` : `Vence em ${formatarData(r.expiresAt)}`}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.expiresAt < now ? (
                    <EtiquetaDeSituacao tone="perigo">Vencido</EtiquetaDeSituacao>
                  ) : reminder.kind === "sent" ? (
                    <EtiquetaDeSituacao tone="sucesso" icon={Check}>Aviso de {reminder.day} dias enviado</EtiquetaDeSituacao>
                  ) : reminder.kind === "due" ? (
                    <EtiquetaDeSituacao tone="aviso" icon={Clock}>Aviso de {reminder.day} dias sai na próxima rotina diária</EtiquetaDeSituacao>
                  ) : reminder.kind === "scheduled" ? (
                    <EtiquetaDeSituacao tone="neutro" icon={Clock}>Aviso de {reminder.day} dias em {formatarData(reminder.on)}</EtiquetaDeSituacao>
                  ) : (
                    <EtiquetaDeSituacao tone="neutro">Sem aviso previsto</EtiquetaDeSituacao>
                  )}
                  <BotaoDeRenovacao orderId={r.id} domain={r.domain} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Painel>
  );
}

async function AreaDoDetalheDoDominio({ selectedId, summary }: { selectedId: string | undefined; summary: Awaited<ReturnType<typeof obterResumoDosPedidosDeDominio>> }) {
  const detail = selectedId ? await obterDetalheDoDominio(selectedId) : null;
  return (
    <>
      {detail ? (
        <Painel as="article">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {detail.planName?.toLowerCase().includes("vip") ? <EtiquetaDePlano plan="vip" /> : detail.planName?.toLowerCase().includes("adaptado") ? <EtiquetaDePlano plan="custom" /> : <EtiquetaDeSituacao tone="neutro">Sem assinatura</EtiquetaDeSituacao>}
            <EtiquetaDeSituacao tone={(ETIQUETA_DA_SITUACAO[detail.status as NomeDaSituacaoDoPedidoDeDominio] ?? ETIQUETA_DA_SITUACAO.CANCELED).tone}>{ROTULO_DA_SITUACAO[detail.status as NomeDaSituacaoDoPedidoDeDominio] ?? detail.status}</EtiquetaDeSituacao>
          </div>
          <h2 className="mt-3 break-all font-mono text-2xl font-medium leading-8 text-tinta">{detail.domain}</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {detail.coupleNames} · pedido em {formatarDataEHora(detail.requestedAt)}
            {detail.registeredAt ? ` · registrado em ${formatarData(detail.registeredAt)}` : ""}
          </p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
            <dt className="text-tinta-suave">Titular</dt>
            <dd className="text-tinta">{detail.holderName}</dd>
            <dt className="text-tinta-suave">E-mail</dt>
            <dd className="break-all text-tinta">{detail.holderEmail}</dd>
            <dt className="text-tinta-suave">Telefone</dt>
            <dd className="text-tinta">{formatarTelefone(detail.holderPhone)}</dd>
            <dt className="text-tinta-suave">Vence</dt>
            <dd className="text-tinta">{detail.expiresAt ? formatarData(detail.expiresAt) : "Sem data"}</dd>
            {detail.rejectionReason ? (
              <>
                <dt className="text-tinta-suave">Motivo da recusa</dt>
                <dd className="text-tinta">{detail.rejectionReason}</dd>
              </>
            ) : null}
          </dl>
          <div className="mt-5 border-t border-linha pt-5">
            <PainelDoDominio
              key={detail.id}
              vercelReady={vercelEstaConfigurada()}
              order={{
                id: detail.id,
                domain: detail.domain,
                status: detail.status as NomeDaSituacaoDoPedidoDeDominio,
                holderDocument: detail.holderDocument,
                canRevealDocument: detail.canRevealDocument,
                adminNote: detail.adminNote,
                vercelState: detail.vercelState,
                canRenew: Boolean(detail.expiresAt) && (detail.status === "REGISTERED" || detail.status === "CONNECTED"),
              }}
            />
          </div>
        </Painel>
      ) : (
        <Painel>
          <p className="text-sm text-tinta-suave">Escolha um pedido na lista para ver os dados do titular, as etapas e as ações.</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-tinta-suave">
            <Link2 className="size-4" aria-hidden="true" /> {pluralizar(summary.requested + summary.registered, "pedido espera", "pedidos esperam")} uma ação sua.
          </p>
        </Painel>
      )}
    </>
  );
}
