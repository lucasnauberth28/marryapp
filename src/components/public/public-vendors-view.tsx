"use client";

import { useState, useTransition } from "react";
import { Reveal } from "@/components/motion/reveal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { btn, container, overline } from "@/components/landing/styles";
import {
  Building2,
  Check,
  CheckCircle2,
  Star,
  MapPin,
  Video,
  Calendar,
  Search,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { createVendorLead, type PublicVendorListItem } from "@/actions/partner-vendor-actions";
import { parseRegions } from "@/app/(fornecedor)/_lib/vendor-panel";
import { toast } from "sonner";
import { UserImage } from "@/components/ui/user-image";
import { cn } from "@/lib/utils";

const ALL = "TODOS";

const CATEGORIES = [ALL, "Espaço", "Fotografia", "Buffet", "Decoração", "DJ & Som", "Vestidos", "Doces & Bolo"];

const ALL_REGIONS = "TODAS";

const REGIONS = [
  ALL_REGIONS,
  "São Paulo - Capital",
  "Grande SP",
  "Litoral Norte",
  "Campinas e Região",
  "Vale do Paraíba",
  "Brasil Todo",
];

// Teto de "a partir de", em reais.
const BUDGETS = [
  { value: "", label: "Qualquer valor" },
  { value: "5000", label: "Até R$ 5.000" },
  { value: "10000", label: "Até R$ 10.000" },
  { value: "20000", label: "Até R$ 20.000" },
  { value: "50000", label: "Até R$ 50.000" },
];

type SortKey = "relevance" | "price" | "rating";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Mais relevantes" },
  { value: "price", label: "Menor preço" },
  { value: "rating", label: "Mais avaliados" },
];

// Campos do design: 44px de altura, borda forte, raio de 12px.
const field =
  "min-h-11 w-full rounded-[12px] border border-linha-forte bg-papel px-4 text-base leading-6 text-tinta transition-colors duration-150 hover:border-tinta-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ameixa";
const fieldLabel = "text-sm font-semibold leading-5 text-tinta";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

interface PublicVendorsViewProps {
  /** Já filtrados pelo servidor quando há data do casamento (sem quem está ocupado nela). */
  initialPartners: PublicVendorListItem[];
  /** Filtro "Data do casamento" em vigor ("AAAA-MM-DD" ou ""). */
  weddingDate?: string;
  todayIso: string;
}

function formatIsoDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Cidades e regiões atendidas, em uma linha curta ("A, B e mais 2"). */
function regionsLabel(serviceRegions: PublicVendorListItem["serviceRegions"]) {
  const regions = parseRegions(serviceRegions);
  if (regions.length === 0) return null;
  if (regions.length <= 2) return regions.join(" e ");
  return `${regions.slice(0, 2).join(", ")} e mais ${regions.length - 2}`;
}

export function PublicVendorsView({ initialPartners, weddingDate: activeDate = "", todayIso }: PublicVendorsViewProps) {
  const partners = initialPartners;
  const router = useRouter();
  const [dateInput, setDateInput] = useState(activeDate);
  const [isPendingDate, startTransitionDate] = useTransition();
  const [selectedCategory, setSelectedCategory] = useState(ALL);
  const [selectedRegion, setSelectedRegion] = useState(ALL_REGIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [budget, setBudget] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sort, setSort] = useState<SortKey>("relevance");
  // No celular, data e valor ficam recolhidos atrás de "Mais filtros".
  const [moreOpen, setMoreOpen] = useState(false);

  // Modal de Agendamento de Reunião & Lead
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PublicVendorListItem | null>(null);
  const [coupleName, setCoupleName] = useState("");
  const [couplePhone, setCouplePhone] = useState("");
  const [coupleEmail, setCoupleEmail] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [meetingType, setMeetingType] = useState<"ONLINE" | "PRESENTIAL">("ONLINE");
  const [leadMessage, setLeadMessage] = useState("");
  // Pedido enviado: a confirmação fica na janela (um aviso passageiro some antes de ser lido).
  const [leadSent, setLeadSent] = useState<{ vendor: string; first: string; whatsapp: string | null; text: string } | null>(null);
  const [isPendingLead, startTransitionLead] = useTransition();

  const term = searchTerm.trim().toLowerCase();
  const budgetCents = budget ? Number(budget) * 100 : null;

  const matching = partners.filter((p) => {
    const matchesCategory = selectedCategory === ALL || p.category === selectedCategory;

    let matchesRegion = true;
    if (selectedRegion !== ALL_REGIONS) {
      const regions = parseRegions(p.serviceRegions);
      matchesRegion = regions.includes(selectedRegion) || regions.includes("Brasil Todo");
    }

    const matchesSearch =
      !term ||
      p.companyName.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term);

    // Sem preço inicial informado, o fornecedor não entra num teto de valor.
    const matchesBudget = budgetCents === null || (!!p.startingPrice && p.startingPrice > 0 && p.startingPrice <= budgetCents);
    const matchesVerified = !onlyVerified || p.isVerified;

    return matchesCategory && matchesRegion && matchesSearch && matchesBudget && matchesVerified;
  });

  // A lista já chega ordenada pelo plano (Master, Pro, Gratuito): "Mais relevantes" mantém essa ordem.
  const filteredPartners =
    sort === "relevance"
      ? matching
      : [...matching].sort((a, b) => {
          if (sort === "price") {
            const pa = a.startingPrice && a.startingPrice > 0 ? a.startingPrice : Infinity;
            const pb = b.startingPrice && b.startingPrice > 0 ? b.startingPrice : Infinity;
            return pa === pb ? 0 : pa - pb;
          }
          return b.rating - a.rating || b.reviewCount - a.reviewCount;
        });

  // Master: faixa "Em destaque" no topo (eles continuam na lista, que já vem ordenada pelo plano).
  const featuredPartners = matching.filter((p) => p.planTier === "MASTER").slice(0, 6);

  const hasFilters =
    selectedCategory !== ALL || selectedRegion !== ALL_REGIONS || !!term || !!budget || onlyVerified || !!activeDate;

  const clearFilters = () => {
    setSelectedCategory(ALL);
    setSelectedRegion(ALL_REGIONS);
    setSearchTerm("");
    setBudget("");
    setOnlyVerified(false);
    if (activeDate) applyDate("");
  };

  // A data vai para a URL (?data=): o servidor devolve só quem está livre nesse dia.
  function applyDate(value: string) {
    setDateInput(value);
    if (value && value < todayIso) return;
    startTransitionDate(() => {
      router.replace(value ? `/fornecedores?data=${value}` : "/fornecedores", { scroll: false });
    });
  }

  const handleOpenLeadModal = (partner: PublicVendorListItem) => {
    setSelectedPartner(partner);
    setLeadSent(null);
    setLeadModalOpen(true);
  };

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || !coupleName || !couplePhone) {
      toast.error("Preencha seu nome e WhatsApp para o fornecedor poder responder.");
      return;
    }

    startTransitionLead(async () => {
      const res = await createVendorLead({
        vendorId: selectedPartner.id,
        coupleName,
        couplePhone,
        coupleEmail,
        guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
        weddingDate: weddingDate ? new Date(weddingDate) : undefined,
        message: leadMessage,
        meetingType,
      });

      if (res.success) {
        // WhatsApp direto é recurso do Pro/Master (o servidor nem envia o número dos demais).
        const whatsapp = selectedPartner.planTier !== "FREE" ? selectedPartner.whatsapp?.replace(/\D/g, "") || null : null;
        setLeadSent({
          vendor: selectedPartner.companyName,
          first: coupleName.split(" ")[0],
          whatsapp,
          text: `Olá! Sou ${coupleName} e acabei de pedir um orçamento pelo Aceito${weddingDate ? ` para o casamento em ${new Date(weddingDate).toLocaleDateString("pt-BR")}` : ""}.`,
        });
        // Reseta form
        setCoupleName("");
        setCouplePhone("");
        setCoupleEmail("");
        setGuestCount("");
        setLeadMessage("");
      } else {
        toast.error(res.error || "Não conseguimos enviar o pedido. Tente de novo.");
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-linho font-sans text-tinta">
      <LandingHeader />

      {/* Abertura: sobretítulo, título e a barra de busca sobre a faixa sálvia */}
      <section className="bg-salvia-suave">
        <div className={cn(container, "flex flex-col gap-6 py-10 sm:py-16")}>
          <div className="flex max-w-[720px] flex-col gap-3">
            <p className={cn(overline, "text-salvia")}>Vitrine de fornecedores</p>
            <h1 className="font-display text-[34px] font-normal leading-[40px] tracking-[-0.02em] text-tinta sm:text-5xl sm:leading-[1.05] lg:text-6xl">
              Quem faz o seu dia acontecer
            </h1>
            <p className="text-[17px] leading-[26px] text-tinta-suave sm:text-lg sm:leading-7">
              Fornecedores com curadoria, trabalho de verdade e preço inicial à vista.
            </p>
          </div>

          <form
            role="search"
            aria-label="Buscar fornecedores"
            onSubmit={(e) => e.preventDefault()}
            className="grid grid-cols-1 gap-3 rounded-[16px] border border-linha bg-papel p-4 shadow-aceito-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="filtro-busca" className={fieldLabel}>
                O que você procura?
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
                <input
                  id="filtro-busca"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Espaço, fotógrafo, buffet..."
                  className={cn(field, "pl-10")}
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="filtro-regiao" className={fieldLabel}>
                Onde vai ser?
              </Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
                <select
                  id="filtro-regiao"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className={cn(field, "pl-10")}
                >
                  {REGIONS.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg === ALL_REGIONS ? "Todas as regiões" : reg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={cn("min-w-0 flex-col gap-2 sm:flex", moreOpen || dateInput ? "flex" : "hidden")}>
              <Label htmlFor="filtro-data" className={fieldLabel}>
                Data do casamento
              </Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
                <input
                  id="filtro-data"
                  type="date"
                  min={todayIso}
                  value={dateInput}
                  onChange={(e) => applyDate(e.target.value)}
                  aria-describedby="filtro-data-dica"
                  className={cn(field, "pl-10 pr-11")}
                />
                {isPendingDate ? (
                  <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-tinta-suave" aria-label="Atualizando" />
                ) : dateInput ? (
                  <button
                    type="button"
                    onClick={() => applyDate("")}
                    aria-label="Limpar data do casamento"
                    className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-tinta-suave hover:bg-areia hover:text-tinta"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <p id="filtro-data-dica" className="sr-only">
                Mostra só fornecedores com a data livre na agenda.
              </p>
            </div>

            <div className={cn("min-w-0 flex-col gap-2 sm:flex", moreOpen || budget || dateInput ? "flex" : "hidden")}>
              <Label htmlFor="filtro-valor" className={fieldLabel}>
                Até quanto?
              </Label>
              <select id="filtro-valor" value={budget} onChange={(e) => setBudget(e.target.value)} className={field}>
                {BUDGETS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className={cn(btn.quiet, "justify-self-start sm:hidden")}
            >
              {moreOpen ? "Menos filtros" : "Mais filtros"}
            </button>
          </form>

          {/* Categorias: faixa rolável de chips */}
          <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
            <div role="group" aria-label="Categorias" className="flex gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    aria-pressed={isSelected}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-[8px] px-4 text-sm font-semibold transition-colors duration-150",
                      isSelected ? "bg-salvia text-on-ameixa" : "bg-papel text-tinta hover:bg-areia",
                    )}
                  >
                    {cat === ALL ? "Todos" : cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <main className={cn(container, "flex flex-1 flex-col gap-8 pb-20 pt-10 sm:pb-24 sm:pt-12")}>
        {/* Resultado, filtro de verificados e ordenação */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-base text-tinta-suave">
            <strong className="font-semibold text-tinta">
              {selectedCategory === ALL ? "Todos os fornecedores" : selectedCategory}
            </strong>{" "}
            · {filteredPartners.length} {filteredPartners.length === 1 ? "fornecedor" : "fornecedores"}
            {activeDate ? <> com a data {formatIsoDate(activeDate)} livre na agenda</> : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyVerified((v) => !v)}
              aria-pressed={onlyVerified}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-[8px] px-3 text-sm font-semibold transition-colors duration-150 sm:min-h-9",
                onlyVerified ? "bg-salvia-suave text-salvia" : "bg-areia text-tinta-suave hover:text-tinta",
              )}
            >
              {onlyVerified ? <Check className="size-4" aria-hidden="true" /> : null}
              Só com curadoria
            </button>
            <label className="sr-only" htmlFor="ordenar">
              Ordenar por
            </label>
            <select
              id="ordenar"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={cn(field, "min-h-11 w-auto py-0 text-sm sm:min-h-9")}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Em destaque: fornecedores Master */}
        {featuredPartners.length > 0 ? (
          <section aria-labelledby="em-destaque" className="flex flex-col gap-3">
            <h2 id="em-destaque" className="flex items-center gap-2 font-display text-[22px] font-medium leading-7 text-tinta">
              <Sparkles className="size-5 text-champanhe" aria-hidden="true" />
              Em destaque
            </h2>
            <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6">
              {featuredPartners.map((partner) => (
                <li key={partner.id} className="w-64 shrink-0 snap-start">
                  <Link
                    href={`/fornecedores/${partner.id}`}
                    className="group flex flex-col gap-3 rounded-[16px] border border-linha bg-papel p-3 shadow-aceito-1 transition-colors hover:border-ameixa"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[12px] bg-salvia-suave">
                      {partner.coverUrl ? (
                        <UserImage src={partner.coverUrl} alt="" sizes="256px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-tinta-suave">
                          <Building2 className="size-8" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 px-1 pb-1">
                      <p className="line-clamp-1 font-display text-lg font-medium leading-6 text-tinta group-hover:text-ameixa">
                        {partner.companyName}
                      </p>
                      <p className="flex items-center justify-between gap-2 text-sm text-tinta-suave">
                        <span>{partner.category}</span>
                        {partner.reviewCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-tinta">
                            <Star className="size-4 fill-champanhe text-champanhe" aria-hidden="true" />
                            {partner.rating.toFixed(1)}
                            <span className="sr-only">de 5 estrelas</span>
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Lista de fornecedores */}
        {filteredPartners.length === 0 ? (
          <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-[16px] border border-linha bg-papel px-6 py-12 text-center shadow-aceito-1">
            <Building2 className="size-10 text-tinta-suave" aria-hidden="true" />
            <h2 className="font-display text-[26px] font-medium leading-8 text-tinta">Nenhum fornecedor por aqui</h2>
            <p className="max-w-md text-base leading-6 text-tinta-suave">
              {activeDate
                ? "Ninguém com esses filtros está livre nessa data. Tente outra data ou mude os filtros."
                : "Tente outra região ou categoria para ver mais fornecedores."}
            </p>
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className={cn(btn.secondary)}>
                Limpar filtros
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPartners.map((partner, index) => {
              const isMaster = partner.planTier === "MASTER";
              const where = regionsLabel(partner.serviceRegions);
              const price = partner.startingPrice && partner.startingPrice > 0 ? brl.format(partner.startingPrice / 100) : null;

              return (
                <Reveal as="li" key={partner.id} delay={(index % 3) * 90} className="flex">
                  <article className="flex w-full flex-col gap-3">
                    <Link
                      href={`/fornecedores/${partner.id}`}
                      aria-label={`Ver perfil de ${partner.companyName}`}
                      tabIndex={-1}
                      className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-salvia-suave"
                    >
                      {partner.coverUrl ? (
                        <UserImage
                          src={partner.coverUrl}
                          alt=""
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-sm text-tinta-suave">
                          <Building2 className="size-10" aria-hidden="true" />
                          Sem foto ainda
                        </span>
                      )}
                    </Link>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex min-h-7 items-center rounded-[6px] bg-salvia-suave px-3 text-sm font-semibold text-salvia">
                        {partner.category}
                      </span>
                      {partner.isVerified ? (
                        <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-sucesso-suave pl-2 pr-3 text-sm font-semibold text-sucesso">
                          <Check className="size-4" aria-hidden="true" />
                          Com curadoria
                        </span>
                      ) : null}
                      {isMaster ? (
                        <span className="inline-flex min-h-7 items-center gap-1 rounded-[6px] bg-ameixa-suave pl-2 pr-3 text-sm font-semibold text-ameixa">
                          <Sparkles className="size-4" aria-hidden="true" />
                          Destaque
                        </span>
                      ) : null}
                    </div>

                    <h2 className="font-display text-[22px] font-medium leading-7 text-tinta [font-variation-settings:'opsz'_28]">
                      <Link href={`/fornecedores/${partner.id}`} className="hover:text-ameixa">
                        {partner.companyName}
                      </Link>
                    </h2>

                    <div className="flex flex-col gap-1 text-sm leading-5 text-tinta-suave">
                      {where ? (
                        <p className="flex items-center gap-2">
                          <MapPin className="size-4 shrink-0" aria-hidden="true" />
                          {where}
                        </p>
                      ) : null}
                      {partner.reviewCount > 0 ? (
                        <p className="flex items-center gap-2">
                          <Star className="size-4 shrink-0 fill-champanhe text-champanhe" aria-hidden="true" />
                          <span>
                            <strong className="font-semibold text-tinta">{partner.rating.toFixed(1)}</strong>
                            <span className="sr-only"> de 5 estrelas,</span> ({partner.reviewCount}{" "}
                            {partner.reviewCount === 1 ? "avaliação" : "avaliações"})
                          </span>
                        </p>
                      ) : null}
                      {partner.offersOnlineMeet ? (
                        <p className="flex items-center gap-2">
                          <Video className="size-4 shrink-0" aria-hidden="true" />
                          Atende por vídeo
                        </p>
                      ) : null}
                    </div>

                    {price ? (
                      <p className="text-sm leading-5 text-tinta">
                        A partir de <strong className="font-semibold">{price}</strong>
                      </p>
                    ) : null}

                    {/* Ação principal: pedido de orçamento (registra o contato do casal) */}
                    <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                      <Link href={`/fornecedores/${partner.id}`} className={cn(btn.secondary, btn.sm)}>
                        Ver perfil
                      </Link>
                      <button type="button" onClick={() => handleOpenLeadModal(partner)} className={cn(btn.primary, btn.sm)}>
                        Pedir orçamento
                      </button>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </ul>
        )}
      </main>

      {/* Convite para fornecedores */}
      <section className="border-t border-linha bg-papel">
        <div className={cn(container, "flex flex-wrap items-center justify-between gap-6 py-12 sm:py-16")}>
          <div className="flex flex-1 basis-[420px] flex-col gap-2">
            <h2 className="font-display text-[28px] font-medium leading-9 text-tinta sm:text-[34px] sm:leading-10">Você é fornecedor?</h2>
            <p className="text-base leading-6 text-tinta-suave">
              Crie seu perfil grátis e receba pedidos de orçamento de casais da sua região. Todo perfil passa por uma curadoria antes de aparecer aqui.
            </p>
          </div>
          <Link href="/cadastro?tipo=fornecedor&plano=pro" className={btn.primary}>
            Cadastrar meu negócio
          </Link>
        </div>
      </section>

      {/* Modal de Agendamento de Reunião e Orçamento */}
      <Dialog open={leadModalOpen} onOpenChange={setLeadModalOpen}>
        <DialogContent className="sm:max-w-md bg-papel rounded-[16px] p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-tinta">
              {leadSent ? "Pedido enviado" : "Pedir orçamento ou reunião"}
            </DialogTitle>
            <DialogDescription className="text-sm text-tinta-suave mt-1">
              {leadSent ? (
                <>Recebemos os seus dados, {leadSent.first}.</>
              ) : (
                <>Os seus dados vão direto para <strong>{selectedPartner?.companyName}</strong>, que responde pelo WhatsApp.</>
              )}
            </DialogDescription>
          </DialogHeader>

          {leadSent ? (
            <div role="status" className="space-y-3 pt-2 text-sm text-tinta">
              <p className="flex items-start gap-2 rounded-2xl bg-sucesso-suave p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sucesso" aria-hidden="true" />
                <span>{leadSent.vendor} recebeu o seu pedido e vai entrar em contato pelo WhatsApp que você informou.</span>
              </p>
              {leadSent.whatsapp ? (
                <a
                  href={`https://wa.me/${leadSent.whatsapp}?text=${encodeURIComponent(leadSent.text)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-12 items-center justify-center rounded-full bg-tinta px-4 font-bold text-papel"
                >
                  Conversar agora no WhatsApp
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              ) : null}
              <Button type="button" variant="ghost" className="h-11 w-full rounded-full font-semibold text-ameixa" onClick={() => setLeadModalOpen(false)}>
                Voltar aos fornecedores
              </Button>
            </div>
          ) : (
          <form onSubmit={handleSubmitLead} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="vl-nome" className="text-sm font-semibold text-tinta">Seu nome ou o nome do casal</Label>
              <Input
                id="vl-nome"
                name="name"
                autoComplete="name"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="Ex.: Giovanna e Lucas"
                required
                className="rounded-2xl h-11 text-sm bg-linho"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vl-telefone" className="text-sm font-semibold text-tinta">WhatsApp com DDD</Label>
                <Input
                  id="vl-telefone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={couplePhone}
                  onChange={(e) => setCouplePhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                  className="rounded-2xl h-11 text-sm bg-linho"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vl-email" className="text-sm font-semibold text-tinta">E-mail <span className="font-normal text-tinta-suave">(opcional)</span></Label>
                <Input
                  id="vl-email"
                  name="email"
                  autoComplete="email"
                  type="email"
                  value={coupleEmail}
                  onChange={(e) => setCoupleEmail(e.target.value)}
                  placeholder="noivos@email.com"
                  className="rounded-2xl h-11 text-sm bg-linho"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vl-convidados" className="text-sm font-semibold text-tinta">Nº de convidados</Label>
                <Input
                  id="vl-convidados"
                  inputMode="numeric"
                  min={1}
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="Ex: 150"
                  className="rounded-2xl h-11 text-sm bg-linho"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-tinta">Data do casamento</Label>
                <DatePicker
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  placeholder="Escolher"
                  className="rounded-2xl h-11 text-sm bg-linho"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-tinta">Como prefere conversar?</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={meetingType === "ONLINE"}
                  onClick={() => setMeetingType("ONLINE")}
                  className={`min-h-11 p-3 rounded-2xl border text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    meetingType === "ONLINE"
                      ? "bg-brand-50 border-brand text-brand"
                      : "bg-linho border-linha text-tinta-suave"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Por vídeo</span>
                </button>

                <button
                  type="button"
                  aria-pressed={meetingType === "PRESENTIAL"}
                  onClick={() => setMeetingType("PRESENTIAL")}
                  className={`min-h-11 p-3 rounded-2xl border text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    meetingType === "PRESENTIAL"
                      ? "bg-brand-50 border-brand text-brand"
                      : "bg-linho border-linha text-tinta-suave"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Presencial</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vl-mensagem" className="text-sm font-semibold text-tinta">Recado para o fornecedor <span className="font-normal text-tinta-suave">(opcional)</span></Label>
              <Textarea
                id="vl-mensagem"
                value={leadMessage}
                onChange={(e) => setLeadMessage(e.target.value)}
                placeholder="Conte o estilo do casamento ou tire uma dúvida"
                className="rounded-2xl text-sm bg-linho resize-none h-20"
              />
            </div>

            <Button
              type="submit"
              disabled={isPendingLead}
              className="w-full bg-brand hover:bg-brand-600 text-white rounded-full font-bold h-12 text-sm shadow-md gap-2 mt-2"
            >
              {isPendingLead ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Enviar pedido</span>
                </>
              )}
            </Button>
          </form>
          )}
        </DialogContent>
      </Dialog>

      <LandingFooter />
    </div>
  );
}
