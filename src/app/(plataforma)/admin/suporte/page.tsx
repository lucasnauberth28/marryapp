import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/plataforma/page-header";
import { Panel } from "@/components/plataforma/panel";
import { InitialsAvatar } from "@/components/plataforma/initials-avatar";
import { btn } from "@/components/landing/styles";
import { requirePlatformAdminPage } from "@/lib/security/platform-admin";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { type SearchParams, param } from "@/lib/platform/list-params";
import { formatDate, timeAgo } from "@/lib/platform/format";
import { dueState } from "@/lib/platform/support";
import { listDataRequests, listIncidents, listTickets, searchEverything, ticketPrefill } from "@/lib/platform/queries/suporte";
import { DataRequests, type DataRequestItem } from "./_components/data-requests";
import { Incidents } from "./_components/incidents";
import { PasswordReset } from "./_components/password-reset";
import { SearchBox } from "./_components/search-box";
import { Tickets } from "./_components/tickets";

export const metadata = { title: "Suporte e LGPD" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ymd = (d: Date | null) => (d ? new Date(d.getTime() - 3 * 3_600_000).toISOString().slice(0, 10) : "");

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const admin = await requirePlatformAdminPage(); // guard da página (o layout sozinho não basta)
  const query = await searchParams;
  const now = new Date();
  const showClosed = param(query, "encerrados", 2) === "1";
  const casal = param(query, "casal", 40);
  const fornecedor = param(query, "fornecedor", 40);

  // Busca limitada por pessoa da administração: 60 por minuto
  const searchText = param(query, "q", 100);
  const allowed = searchText ? (await checkRateLimit({ key: `ADMIN_SEARCH:${admin.userId}`, limit: 60, windowMs: 60_000 })).success : true;

  const [results, tickets, requests, incidents, prefill] = await Promise.all([
    allowed ? searchEverything(searchText) : null,
    listTickets({ showClosed }),
    listDataRequests(),
    listIncidents(),
    ticketPrefill({ weddingId: casal && UUID.test(casal) ? casal : undefined, vendorId: fornecedor && UUID.test(fornecedor) ? fornecedor : undefined }),
  ]);

  const requestItems: DataRequestItem[] = requests.map((r) => {
    const due = dueState(r.dueAt, r.status, now);
    return {
      id: r.id,
      type: r.type,
      requesterName: r.requesterName,
      requesterEmail: r.requesterEmail,
      linked: r.userId !== null,
      status: r.status,
      receivedLabel: formatDate(r.receivedAt),
      dueLabel: formatDate(r.dueAt),
      dueText: due.kind === "overdue" ? `Venceu há ${due.days} ${due.days === 1 ? "dia" : "dias"}` : due.kind === "soon" || due.kind === "ok" ? (due.days === 0 ? "Vence hoje" : `Vence em ${due.days} ${due.days === 1 ? "dia" : "dias"}`) : null,
      dueTone: due.kind === "overdue" || due.kind === "soon" ? "perigo" : due.kind === "ok" ? "neutro" : null,
      note: r.note,
    };
  });
  const urgentList = requests.map((r) => ({ r, due: dueState(r.dueAt, r.status, now) })).filter((x) => x.due.kind === "overdue" || x.due.kind === "soon");
  const urgentFirst = urgentList.find((x) => x.due.kind === "overdue") ?? urgentList.sort((a, b) => a.r.dueAt.getTime() - b.r.dueAt.getTime())[0];
  const urgent = urgentFirst
    ? urgentFirst.due.kind === "overdue"
      ? `${urgentList.length} ${urgentList.length === 1 ? "vencido ou perto de vencer" : "vencidos ou perto de vencer"}`
      : `${urgentList.length} vence${urgentList.length === 1 ? "" : "m"} em até 5 dias`
    : null;

  return (
    <>
      <PageHeader eyebrow="Suporte" title="Suporte e LGPD" description="Ajude casais e fornecedores e responda aos pedidos sobre dados pessoais dentro do prazo." />

      <div id="busca" className="scroll-mt-6">
      <Panel title="Busca em tudo">
        <SearchBox defaultValue={searchText ?? ""} />
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
                      <Link href={h.href} className="flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa">
                        <InitialsAvatar name={h.title} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold leading-5 text-tinta">{h.title}</span>
                          <span className="block truncate text-sm leading-5 text-tinta-suave">{h.detail}</span>
                        </span>
                        <ChevronRight className="ml-auto size-4 shrink-0 text-tinta-suave" aria-hidden="true" />
                      </Link>
                    ) : (
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <InitialsAvatar name={h.title} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold leading-5 text-tinta">{h.title}</span>
                          <span className="block truncate text-sm leading-5 text-tinta-suave">{h.detail}</span>
                        </span>
                      </div>
                    )}
                    {h.ticketHref && (
                      <Link href={h.ticketHref} className={`${btn.quiet} ${btn.sm} shrink-0`}>
                        Abrir pedido
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Tickets
            key={`${prefill?.weddingId ?? prefill?.vendorId ?? "sem"}-${param(query, "novo", 2) ?? ""}`}
            rows={tickets.rows.map((t) => ({
              id: t.id,
              number: t.number,
              subject: t.subject,
              body: t.body,
              requesterName: t.requesterName,
              requesterEmail: t.requesterEmail,
              status: t.status,
              assigneeName: t.assigneeName,
              mine: t.assigneeId === admin.userId,
              internalNote: t.internalNote,
              whenLabel: timeAgo(t.createdAt, now),
              weddingId: t.weddingId,
              vendorId: t.vendorId,
            }))}
            newCount={tickets.newCount}
            closedCount={tickets.closedCount}
            showClosed={showClosed}
            prefill={prefill}
            openForm={param(query, "novo", 2) === "1"}
          />
          <DataRequests rows={requestItems} urgent={urgent} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <PasswordReset />
          <Incidents
            today={ymd(now)}
            rows={incidents.map((i) => ({
              id: i.id,
              title: i.title,
              description: i.description,
              affected: i.affected,
              discoveredLabel: formatDate(i.discoveredAt),
              notifiedOn: ymd(i.notifiedAt),
              notifiedWho: i.notifiedWho,
              open: i.status === "OPEN",
            }))}
          />
        </div>
      </div>
    </>
  );
}
