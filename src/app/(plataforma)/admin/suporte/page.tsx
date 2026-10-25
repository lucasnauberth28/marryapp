import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CabecalhoDaPagina } from "@/components/plataforma/page-header";
import { Painel } from "@/components/plataforma/panel";
import { AvatarComIniciais } from "@/components/plataforma/initials-avatar";
import { estiloDoBotao } from "@/components/landing/styles";
import { EsqueletoDasLinhas } from "@/components/plataforma/loading-parts";
import { EsqueletoDeCartao, EsqueletoDeFormulario, RegiaoDeCarregamento } from "@/components/skeletons";
import { exigirAdminDaPlataformaNaPagina } from "@/lib/security/platform-admin";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { type ParametrosDeBusca, parametroDaBusca } from "@/lib/platform/list-params";
import { formatarData, haQuantoTempo } from "@/lib/platform/format";
import { situacaoDoPrazo } from "@/lib/platform/support";
import { listarSolicitacoesDeDados, listarIncidentes, listarChamados, buscarEmTudo, preenchimentoDoChamado } from "@/lib/platform/queries/suporte";
import { SolicitacoesDeDados, type ItemDeSolicitacaoDeDados } from "./_components/data-requests";
import { Incidentes } from "./_components/incidents";
import { RedefinicaoDeSenha } from "./_components/password-reset";
import { CaixaDeBusca } from "./_components/search-box";
import { Chamados } from "./_components/tickets";

export const metadata = { title: "Suporte e LGPD" };

const PADRAO_DE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const anoMesDia = (d: Date | null) => (d ? new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 10) : "");

export default async function Page({ searchParams }: { searchParams: Promise<ParametrosDeBusca> }) {
  const admin = await exigirAdminDaPlataformaNaPagina(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const searchText = parametroDaBusca(query, "q", 100);
  const showClosed = parametroDaBusca(query, "encerrados", 2) === "1";
  const casal = parametroDaBusca(query, "casal", 40);
  const fornecedor = parametroDaBusca(query, "fornecedor", 40);
  const openNew = parametroDaBusca(query, "novo", 2) === "1";

  return (
    <>
      <CabecalhoDaPagina eyebrow="Suporte" title="Suporte e LGPD" description="Ajude casais e fornecedores e responda aos pedidos sobre dados pessoais dentro do prazo." />

      <div id="busca" className="scroll-mt-6">
        <Painel title="Busca em tudo">
          <CaixaDeBusca defaultValue={searchText ?? ""} />
          {searchText && (
            // Cada busca nova troca o resultado por um esqueleto (key = texto); o campo e o resto da página ficam
            <Suspense key={searchText} fallback={<EsqueletoDosResultadosDaBusca />}>
              <ResultadosDaBusca searchText={searchText} userId={admin.userId} />
            </Suspense>
          )}
        </Painel>
      </div>

      <Suspense key={`${casal ?? ""}-${fornecedor ?? ""}-${showClosed}`} fallback={<EsqueletoDasListasDeSuporte />}>
        <ListasDeSuporte userId={admin.userId} showClosed={showClosed} casal={casal} fornecedor={fornecedor} openNew={openNew} />
      </Suspense>
    </>
  );
}

function EsqueletoDosResultadosDaBusca() {
  return (
    <RegiaoDeCarregamento label="a busca" className="mt-4">
      <EsqueletoDasLinhas rows={3} chip={false} />
    </RegiaoDeCarregamento>
  );
}

function EsqueletoDasListasDeSuporte() {
  return (
    <RegiaoDeCarregamento label="os pedidos de ajuda" className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <EsqueletoDeCartao>
          <EsqueletoDasLinhas rows={4} />
        </EsqueletoDeCartao>
        <EsqueletoDeCartao>
          <EsqueletoDasLinhas rows={3} />
        </EsqueletoDeCartao>
      </div>
      <div className="flex min-w-0 flex-col gap-6">
        <EsqueletoDeCartao description>
          <EsqueletoDeFormulario fields={1} />
        </EsqueletoDeCartao>
        <EsqueletoDeCartao>
          <EsqueletoDasLinhas rows={2} />
        </EsqueletoDeCartao>
      </div>
    </RegiaoDeCarregamento>
  );
}

async function ResultadosDaBusca({ searchText, userId }: { searchText: string; userId: string }) {
  // Busca limitada por pessoa da administração: 60 por minuto
  const allowed = (await conferirLimiteDeUso({ key: `ADMIN_SEARCH:${userId}`, limit: 60, windowMs: 60_000 })).success;
  const results = allowed ? await buscarEmTudo(searchText) : null;
  return (
    <>
      {!allowed && <p className="mt-3 text-sm font-semibold text-perigo">Muitas buscas seguidas. Aguarde um minuto.</p>}
        {results && (
        <div className="mt-4" aria-live="polite">
          {results.hits.length === 0 ? (
            <p className="text-sm text-tinta-suave">Nada encontrado para &quot;{results.query}&quot;. O telefone só encontra fornecedores: o cadastro do casal não guarda telefone.</p>
          ) : (
            <ul className="divide-y divide-linha">
              {results.hits.map((h) => (
                <li key={`${h.kind}-${h.id}`} className="flex items-center justify-between gap-3 py-3">
                  {h.href ? (
                    <Link href={h.href} className="flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ameixa">
                      <AvatarComIniciais name={h.title} />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold leading-5 text-tinta">{h.title}</span>
                        <span className="block truncate text-sm leading-5 text-tinta-suave">{h.detail}</span>
                      </span>
                      <ChevronRight className="ml-auto size-4 shrink-0 text-tinta-suave" aria-hidden="true" />
                    </Link>
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <AvatarComIniciais name={h.title} />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold leading-5 text-tinta">{h.title}</span>
                        <span className="block truncate text-sm leading-5 text-tinta-suave">{h.detail}</span>
                      </span>
                    </div>
                  )}
                  {h.ticketHref && (
                    <Link href={h.ticketHref} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm} shrink-0`}>
                      Abrir pedido
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

async function ListasDeSuporte({ userId, showClosed, casal, fornecedor, openNew }: { userId: string; showClosed: boolean; casal: string | undefined; fornecedor: string | undefined; openNew: boolean }) {
  const now = new Date();
  const [tickets, requests, incidents, prefill] = await Promise.all([
    listarChamados({ showClosed }),
    listarSolicitacoesDeDados(),
    listarIncidentes(),
    preenchimentoDoChamado({ weddingId: casal && PADRAO_DE_UUID.test(casal) ? casal : undefined, vendorId: fornecedor && PADRAO_DE_UUID.test(fornecedor) ? fornecedor : undefined }),
  ]);

  const requestItems: ItemDeSolicitacaoDeDados[] = requests.map((r) => {
    const due = situacaoDoPrazo(r.dueAt, r.status, now);
    return {
      id: r.id,
      type: r.type,
      requesterName: r.requesterName,
      requesterEmail: r.requesterEmail,
      linked: r.userId !== null,
      status: r.status,
      receivedLabel: formatarData(r.receivedAt),
      dueLabel: formatarData(r.dueAt),
      dueText: due.kind === "overdue" ? `Venceu há ${due.days} ${due.days === 1 ? "dia" : "dias"}` : due.kind === "soon" || due.kind === "ok" ? (due.days === 0 ? "Vence hoje" : `Vence em ${due.days} ${due.days === 1 ? "dia" : "dias"}`) : null,
      dueTone: due.kind === "overdue" || due.kind === "soon" ? "perigo" : due.kind === "ok" ? "neutro" : null,
      note: r.note,
    };
  });
  const urgentList = requests.map((r) => ({ r, due: situacaoDoPrazo(r.dueAt, r.status, now) })).filter((x) => x.due.kind === "overdue" || x.due.kind === "soon");
  const urgentFirst = urgentList.find((x) => x.due.kind === "overdue") ?? urgentList.sort((a, b) => a.r.dueAt.getTime() - b.r.dueAt.getTime())[0];
  const urgent = urgentFirst
    ? urgentFirst.due.kind === "overdue"
      ? `${urgentList.length} ${urgentList.length === 1 ? "vencido ou perto de vencer" : "vencidos ou perto de vencer"}`
      : `${urgentList.length} vence${urgentList.length === 1 ? "" : "m"} em até 5 dias`
    : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Chamados
            key={`${prefill?.weddingId ?? prefill?.vendorId ?? "sem"}-${openNew ? "1" : ""}`}
            rows={tickets.rows.map((t) => ({
              id: t.id,
              number: t.number,
              subject: t.subject,
              body: t.body,
              requesterName: t.requesterName,
              requesterEmail: t.requesterEmail,
              status: t.status,
              assigneeName: t.assigneeName,
              mine: t.assigneeId === userId,
              internalNote: t.internalNote,
              whenLabel: haQuantoTempo(t.createdAt, now),
              weddingId: t.weddingId,
              vendorId: t.vendorId,
            }))}
            newCount={tickets.newCount}
            closedCount={tickets.closedCount}
            showClosed={showClosed}
            prefill={prefill}
            openForm={openNew}
          />
          <SolicitacoesDeDados rows={requestItems} urgent={urgent} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <RedefinicaoDeSenha />
          <Incidentes
            today={anoMesDia(now)}
            rows={incidents.map((i) => ({
              id: i.id,
              title: i.title,
              description: i.description,
              affected: i.affected,
              discoveredLabel: formatarData(i.discoveredAt),
              notifiedOn: anoMesDia(i.notifiedAt),
              notifiedWho: i.notifiedWho,
              open: i.status === "OPEN",
            }))}
          />
        </div>
      </div>
    </>
  );
}
