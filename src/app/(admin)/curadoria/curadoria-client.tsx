"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { Check, CircleX, Clock, ExternalLink, Search, ShieldCheck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { approveVendorAction, rejectVendorAction, getAllVendorsForCurationAction } from "@/actions/partner-vendor-actions";
import { useNow } from "@/components/notifications/use-now";
import { PageHeader } from "@/components/admin/page-header";
import { btn } from "@/components/landing/styles";
import { Chip, card } from "@/components/casal/ui";
import { toast } from "sonner";

type CurationVendor = Awaited<ReturnType<typeof getAllVendorsForCurationAction>>["vendors"][number];
type Tab = "ALL" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

interface CuradoriaClientProps {
  initialVendors: CurationVendor[];
  initialCounts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  /** Hora do servidor, para os "há N dias" saírem iguais no servidor e no navegador. */
  nowIso: string;
}

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(date: Date | string, now: Date) {
  const days = Math.floor((now.getTime() - new Date(date).getTime()) / DAY);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

function parseGallery(raw: string | null | undefined, cover?: string | null) {
  let photos: string[] = [];
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    photos = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
  } catch {
    photos = [];
  }
  if (photos.length === 0 && cover) photos = [cover];
  return photos;
}

function StatusChip({ status }: { status: string }) {
  if (status === "APPROVED") return <Chip tone="sucesso" icon={Check}>Aprovado</Chip>;
  if (status === "REJECTED") return <Chip tone="perigo" icon={CircleX}>Recusado</Chip>;
  return <Chip tone="aviso" icon={Clock}>Em análise</Chip>;
}

export function CuradoriaClient({ initialVendors, initialCounts, nowIso }: CuradoriaClientProps) {
  const uid = useId();
  const now = useNow(nowIso);
  const [vendors, setVendors] = useState<CurationVendor[]>(initialVendors);
  const [counts, setCounts] = useState(initialCounts);
  const [activeTab, setActiveTab] = useState<Tab>("PENDING_APPROVAL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredVendors = vendors.filter((v) => {
    const matchesTab = activeTab === "ALL" || v.curationStatus === activeTab;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      v.companyName.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      (v.documentNumber && v.documentNumber.includes(searchQuery));
    return matchesTab && matchesSearch;
  });

  // Sem escolha (ou com a escolha fora do filtro), o detalhe mostra o primeiro da lista
  const selected = filteredVendors.find((v) => v.id === selectedId) ?? filteredVendors[0] ?? null;

  const pendingList = vendors.filter((v) => v.curationStatus === "PENDING_APPROVAL");
  const oldest = pendingList.reduce<Date | null>((acc, v) => {
    const d = new Date(v.createdAt);
    return !acc || d < acc ? d : acc;
  }, null);

  const select = (id: string) => {
    setSelectedId(id);
    setMessage("");
    // No celular o detalhe abre numa janela; no computador ele já está ao lado da lista.
    setDialogOpen(!window.matchMedia("(min-width: 1024px)").matches);
  };

  const handleApprove = (vendor: CurationVendor) => {
    const toastId = toast.loading(`Aprovando ${vendor.companyName}...`);
    startTransition(async () => {
      const res = await approveVendorAction(vendor.id);
      if (res.success) {
        toast.success(`${vendor.companyName} aprovado e publicado na vitrine.`, { id: toastId });
        const wasPending = vendor.curationStatus === "PENDING_APPROVAL";
        const wasRejected = vendor.curationStatus === "REJECTED";
        setVendors((prev) => prev.map((v) => (v.id === vendor.id ? { ...v, curationStatus: "APPROVED", isVerified: true } : v)));
        setCounts((c) => ({
          ...c,
          pending: wasPending ? Math.max(0, c.pending - 1) : c.pending,
          rejected: wasRejected ? Math.max(0, c.rejected - 1) : c.rejected,
          approved: c.approved + 1,
        }));
        setDialogOpen(false);
      } else {
        toast.error(res.error || "Não foi possível aprovar o fornecedor.", { id: toastId });
      }
    });
  };

  const handleReject = (vendor: CurationVendor) => {
    const reason = message.trim();
    if (!reason) {
      toast.error("Explique o que falta, para o fornecedor poder corrigir.");
      return;
    }
    const toastId = toast.loading(`Registrando a recusa de ${vendor.companyName}...`);
    startTransition(async () => {
      const res = await rejectVendorAction(vendor.id, reason);
      if (res.success) {
        toast.success(`Cadastro de ${vendor.companyName} recusado. A mensagem foi registrada.`, { id: toastId });
        const wasPending = vendor.curationStatus === "PENDING_APPROVAL";
        const wasApproved = vendor.curationStatus === "APPROVED";
        setVendors((prev) =>
          prev.map((v) => (v.id === vendor.id ? { ...v, curationStatus: "REJECTED", isVerified: false, curationNotes: reason } : v)),
        );
        setCounts((c) => ({
          ...c,
          pending: wasPending ? Math.max(0, c.pending - 1) : c.pending,
          approved: wasApproved ? Math.max(0, c.approved - 1) : c.approved,
          rejected: c.rejected + 1,
        }));
        setMessage("");
        setDialogOpen(false);
      } else {
        toast.error(res.error || "Não foi possível recusar o fornecedor.", { id: toastId });
      }
    });
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "PENDING_APPROVAL", label: "Em análise", count: counts.pending },
    { id: "APPROVED", label: "Aprovados", count: counts.approved },
    { id: "REJECTED", label: "Recusados", count: counts.rejected },
    { id: "ALL", label: "Todos", count: counts.total },
  ];

  const detail = (vendor: CurationVendor) => {
    const photos = parseGallery(vendor.galleryImages, vendor.coverUrl);
    const shown = photos.slice(0, photos.length > 4 ? 3 : 4);
    const extra = photos.length - shown.length;
    const contact = vendor.whatsapp || vendor.phone;
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Chip tone="salvia" className="min-h-7">{vendor.category}</Chip>
          <StatusChip status={vendor.curationStatus} />
        </div>
        <div>
          <h2 className="font-display text-[28px] leading-8 text-tinta md:text-[32px] md:leading-9">{vendor.companyName}</h2>
          <p className="mt-1 text-[15px] text-tinta-suave">
            {vendor.documentNumber ? `${vendor.documentType || "CNPJ"} ${vendor.documentNumber}` : "Documento não informado"}
            {contact ? ` · ${contact}` : ""}
          </p>
          {vendor.description && <p className="mt-2 text-[15px] text-tinta">{vendor.description}</p>}
        </div>

        {photos.length > 0 ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {shown.map((url, i) => (
              <li key={i} className="aspect-square overflow-hidden rounded-xl bg-areia">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1} do portfólio de ${vendor.companyName}`} className="size-full object-cover" />
              </li>
            ))}
            {extra > 0 && (
              <li className="grid aspect-square place-items-center rounded-xl bg-areia text-sm font-semibold text-tinta-suave">+{extra}</li>
            )}
          </ul>
        ) : (
          <p className="rounded-xl bg-areia p-3 text-sm text-tinta-suave">Nenhuma foto enviada.</p>
        )}

        <dl className="grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
          <div>
            <dt className="text-sm text-tinta-suave">Faixa de preço</dt>
            <dd className="font-semibold text-tinta">{vendor.priceRange || "Não informada"}</dd>
          </div>
          <div>
            <dt className="text-sm text-tinta-suave">A partir de</dt>
            <dd className="font-semibold text-tinta">
              {vendor.startingPrice
                ? (vendor.startingPrice / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/,00$/, "")
                : "Sob consulta"}
            </dd>
          </div>
          {vendor.instagram && (
            <div>
              <dt className="text-sm text-tinta-suave">Instagram</dt>
              <dd className="break-all text-tinta">{vendor.instagram}</dd>
            </div>
          )}
          {vendor.website && (
            <div>
              <dt className="text-sm text-tinta-suave">Site</dt>
              <dd className="break-all text-tinta">{vendor.website}</dd>
            </div>
          )}
        </dl>

        <Link href={`/fornecedores/${vendor.id}`} target="_blank" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-[15px] font-semibold text-ameixa underline-offset-4 hover:underline">
          Ver a página pública <ExternalLink className="size-4" aria-hidden="true" />
        </Link>

        {vendor.curationStatus === "REJECTED" && vendor.curationNotes && (
          <p className="rounded-xl bg-perigo-suave p-3 text-[15px] text-perigo">Motivo da recusa: {vendor.curationNotes}</p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${uid}-msg`} className="text-sm font-semibold text-tinta">Mensagem para o fornecedor</label>
          <Textarea
            id={`${uid}-msg`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Explique o que falta, se for recusar"
            className="rounded-xl bg-papel"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {vendor.curationStatus !== "APPROVED" && (
            <button type="button" onClick={() => handleApprove(vendor)} disabled={isPending} className={btn.primary}>
              <Check className="size-4" aria-hidden="true" /> Aprovar
            </button>
          )}
          {vendor.curationStatus !== "REJECTED" && (
            <button
              type="button"
              onClick={() => handleReject(vendor)}
              disabled={isPending}
              className={`${btn.secondary} border-perigo text-perigo hover:border-perigo hover:bg-perigo-suave`}
            >
              <X className="size-4" aria-hidden="true" /> Recusar
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Fornecedores"
        title="Curadoria"
        description={
          counts.pending === 0
            ? "Nenhum cadastro esperando análise."
            : `${counts.pending} ${counts.pending === 1 ? "cadastro esperando" : "cadastros esperando"} análise${oldest ? ` · mais antigo ${daysAgo(oldest, now)}` : ""}`
        }
        actions={
          <Link href="/fornecedores" target="_blank" className={`${btn.secondary} ${btn.sm}`}>
            Ver a vitrine pública <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Situação do cadastro" className="flex w-full gap-1 overflow-x-auto rounded-xl bg-areia p-1 sm:w-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`min-h-11 shrink-0 cursor-pointer whitespace-nowrap rounded-[10px] px-4 text-[15px] font-semibold transition-colors sm:min-h-10 ${
                activeTab === t.id ? "bg-papel text-tinta shadow-[var(--shadow-aceito-1)]" : "text-tinta-suave hover:text-tinta"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
          <Input
            aria-label="Buscar empresa, categoria ou CNPJ"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar empresa ou CNPJ"
            className="h-11 rounded-xl pl-9"
          />
        </div>
      </div>

      {filteredVendors.length === 0 ? (
        <div className={`${card} flex flex-col items-center gap-2 px-4 py-14 text-center`}>
          <ShieldCheck className="size-10 text-linha-forte" aria-hidden="true" />
          <p className="font-semibold text-tinta">Nenhum fornecedor por aqui.</p>
          <p className="text-[15px] text-tinta-suave">Cadastros novos de fornecedores aparecem nesta lista sozinhos.</p>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
          <ul className="flex flex-col gap-1.5" aria-label="Fornecedores">
            {filteredVendors.map((v) => {
              const active = selected?.id === v.id;
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => select(v.id)}
                    aria-current={active ? "true" : undefined}
                    className={`flex min-h-[72px] w-full cursor-pointer flex-col justify-center gap-0.5 rounded-xl px-3 py-2 text-left transition-colors ${
                      active ? "bg-ameixa-suave" : "hover:bg-areia"
                    }`}
                  >
                    <strong className={`font-semibold ${active ? "text-ameixa" : "text-tinta"}`}>{v.companyName}</strong>
                    <span className="text-sm text-tinta-suave">
                      {v.category} · {daysAgo(v.createdAt, now)}
                      {v.curationStatus === "APPROVED" ? " · aprovado" : v.curationStatus === "REJECTED" ? " · recusado" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && <section aria-label={`Cadastro de ${selected.companyName}`} className={`${card} hidden p-5 sm:p-6 lg:block`}>{detail(selected)}</section>}
        </div>
      )}

      {/* No celular o detalhe abre numa janela */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-h-[90vh] overflow-y-auto rounded-2xl bg-papel p-5 sm:max-w-2xl sm:p-6">
          <DialogHeader>
            <DialogTitle className="sr-only">Cadastro de {selected?.companyName}</DialogTitle>
            <DialogDescription className="sr-only">Dados do cadastro para aprovar ou recusar.</DialogDescription>
          </DialogHeader>
          {selected && detail(selected)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
