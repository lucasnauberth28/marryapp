"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Clock, Download, HeartHandshake, MessageCircle, Plus, Search, Trash2, Upload, UserCheck, Users, X } from "lucide-react";
import { GuestLocal as Guest } from "@/types/local";
import { deleteGuest } from "@/actions/guest-actions";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PageHeader } from "@/components/admin/page-header";
import { RsvpChip } from "@/components/painel/status-chip";
import { btn, btnIconDanger, card, input, overline } from "@/components/painel/styles";
import { formatPhoneBR } from "@/lib/wedding-format";
import { GuestModal, GUEST_CATEGORIES } from "./guest-modal";
import { ImportGuestsModal } from "./import-guests-modal";

export type GuestRow = Guest & { table?: { name: string } | null };

interface GuestsClientProps {
  initialGuests: GuestRow[];
  /** Prazo para confirmar já formatado (ex.: "15 de março de 2027"), quando o casal definiu. */
  deadlineLabel: string | null;
  /** O plano do casal inclui o WhatsApp: só então o atalho para lembrar quem não respondeu aparece. */
  canRemind: boolean;
}

type Filter = "all" | "CONFIRMED" | "PENDING" | "DECLINED";

// Quantos convidados aparecem por vez; "Carregar mais" mostra o resto aos poucos.
const PAGE_SIZE = 30;

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function seats(g: Guest) {
  return 1 + (g.allowedCompanions || 0);
}

function seatsLabel(g: Guest) {
  const n = seats(g);
  return `${n} ${n === 1 ? "lugar" : "lugares"}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "")).toUpperCase();
}

function LinkBadge({ guest }: { guest: Guest }) {
  if (guest.parentGuest?.name) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-tinta-suave">
        <HeartHandshake className="size-4 shrink-0" aria-hidden="true" />
        Com {guest.parentGuest.name}
      </span>
    );
  }
  if (guest.linkedGuests && guest.linkedGuests.length > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-tinta-suave">
        <UserCheck className="size-4 shrink-0" aria-hidden="true" />
        Titular de {guest.linkedGuests.length} {guest.linkedGuests.length === 1 ? "pessoa" : "pessoas"}
      </span>
    );
  }
  return null;
}

export function GuestsClient({ initialGuests, deadlineLabel, canRemind }: GuestsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [, startTransition] = useTransition();

  const [filter, setFilter] = useState<Filter>("all");
  const [group, setGroup] = useState("");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toRemove, setToRemove] = useState<Guest | null>(null);

  const counts = useMemo(() => {
    const c = { all: initialGuests.length, CONFIRMED: 0, PENDING: 0, DECLINED: 0 };
    for (const g of initialGuests) c[g.rsvpStatus] += 1;
    return c;
  }, [initialGuests]);

  const groups = useMemo(() => {
    const set = new Set<string>(GUEST_CATEGORIES);
    for (const g of initialGuests) if (g.category) set.add(g.category);
    return [...set];
  }, [initialGuests]);

  const filtered = useMemo(() => {
    const q = plain(query.trim());
    const digits = query.replace(/\D/g, "");
    return initialGuests.filter((g) => {
      if (filter !== "all" && g.rsvpStatus !== filter) return false;
      if (group && g.category !== group) return false;
      if (!q) return true;
      if (plain(g.name).includes(q)) return true;
      if (g.email && plain(g.email).includes(q)) return true;
      if (g.companionsNames && plain(g.companionsNames).includes(q)) return true;
      return digits.length >= 3 && !!g.phone && g.phone.replace(/\D/g, "").includes(digits);
    });
  }, [initialGuests, filter, group, query]);

  const shown = filtered.slice(0, visible);

  function changeFilter(next: Filter) {
    setFilter(next);
    setVisible(PAGE_SIZE);
  }

  function openAdd() {
    setEditingGuest(null);
    setIsModalOpen(true);
  }

  function openEdit(guest: Guest) {
    setEditingGuest(guest);
    setIsModalOpen(true);
  }

  function askRemove(guest: Guest) {
    setToRemove(guest);
    setConfirmOpen(true);
  }

  function remove(id: string) {
    const toastId = toast.loading("Removendo convidado...");
    startTransition(async () => {
      const res = await deleteGuest(id);
      if (res.success) {
        toast.success("Convidado removido.", { id: toastId });
      } else {
        toast.error(res.error || "Não deu para remover agora. Tente de novo.", { id: toastId, duration: 6000 });
      }
    });
  }

  const chips: Array<{ value: Filter; label: string; tone: string; icon?: React.ReactNode }> = [
    { value: "all", label: "Todos", tone: "bg-areia text-tinta" },
    { value: "CONFIRMED", label: "Confirmados", tone: "bg-sucesso-suave text-sucesso", icon: <Check className="size-4" aria-hidden="true" /> },
    { value: "PENDING", label: "Sem resposta", tone: "bg-aviso-suave text-aviso", icon: <Clock className="size-4" aria-hidden="true" /> },
    { value: "DECLINED", label: "Não vão", tone: "bg-perigo-suave text-perigo", icon: <X className="size-4" aria-hidden="true" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Convidados"
        title="Lista de convidados"
        description={deadlineLabel ? `Prazo para confirmar: ${deadlineLabel}` : "Quem vocês convidam, quantos lugares cada um tem e quem já respondeu."}
        actions={
          <>
            <button type="button" onClick={() => setImportOpen(true)} className={btn.secondary}>
              <Upload className="size-4" aria-hidden="true" />
              Importar lista
            </button>
            {initialGuests.length > 0 && (
              <a href="/api/export/guests" download="convidados.csv" className={btn.secondary}>
                <Download className="size-4" aria-hidden="true" />
                Exportar CSV
              </a>
            )}
            <button type="button" onClick={openAdd} className={`${btn.primary} max-md:hidden`}>
              <Plus className="size-4" aria-hidden="true" />
              Adicionar convidado
            </button>
          </>
        }
      />

      {initialGuests.length === 0 ? (
        <div className={`${card} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
          <span className="grid size-12 place-items-center rounded-full bg-ameixa-suave text-ameixa">
            <Users className="size-6" aria-hidden="true" />
          </span>
          <h2 className="font-display text-[26px] font-medium leading-8 text-tinta">Ainda não tem ninguém aqui</h2>
          <p className="max-w-md text-tinta-suave">
            Adicionem os convidados um a um ou tragam a lista de uma planilha (CSV). Cada um recebe o convite e confirma a presença pelo link, sem criar conta.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={openAdd} className={btn.primary}>
              Adicionar o primeiro convidado
            </button>
            <button type="button" onClick={() => setImportOpen(true)} className={btn.secondary}>
              <Upload className="size-4" aria-hidden="true" />
              Importar lista
            </button>
          </div>
        </div>
      ) : (
        <>
          <div role="group" aria-label="Filtrar por resposta" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
            {chips.map((c) => {
              const active = filter === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => changeFilter(c.value)}
                  className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors md:min-h-10 ${
                    active ? "bg-ameixa text-on-ameixa" : `${c.tone} hover:brightness-95`
                  }`}
                >
                  {!active && c.icon}
                  {c.label} · {counts[c.value]}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-tinta-suave" aria-hidden="true" />
              <input
                type="search"
                aria-label="Buscar convidado"
                placeholder="Buscar por nome ou telefone"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                className={`${input} pl-10`}
              />
            </div>
            <select
              aria-label="Grupo"
              value={group}
              onChange={(e) => {
                setGroup(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              className={`${input} sm:w-52 sm:flex-none`}
            >
              <option value="">Todos os grupos</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {canRemind && filter === "PENDING" && counts.PENDING > 0 && (
            <Link href="/mensagens" className={`${btn.secondary} w-full md:w-fit`}>
              <MessageCircle className="size-4" aria-hidden="true" />
              Lembrar os {counts.PENDING} no WhatsApp
            </Link>
          )}

          {filtered.length === 0 ? (
            <div className={`${card} px-6 py-12 text-center text-tinta-suave`}>Ninguém com esta busca. Tente outro nome, filtro ou grupo.</div>
          ) : (
            <>
              {/* Computador: tabela com linhas de 56px */}
              <div className={`${card} hidden overflow-hidden md:block`}>
                <table className="w-full border-collapse text-left text-[15px]">
                  <thead>
                    <tr className="border-b border-linha">
                      <th scope="col" className={`${overline} px-4 py-3`}>Nome</th>
                      <th scope="col" className={`${overline} px-2 py-3`}>Grupo</th>
                      <th scope="col" className={`${overline} px-2 py-3`}>Lugares</th>
                      <th scope="col" className={`${overline} px-2 py-3`}>Resposta</th>
                      <th scope="col" className={`${overline} px-2 py-3`}>Mesa</th>
                      <th scope="col" className="px-4 py-3">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((g) => (
                      <tr key={g.id} className="border-b border-linha last:border-b-0 hover:bg-ameixa-suave/40">
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => openEdit(g)} className="block cursor-pointer rounded text-left font-semibold text-tinta hover:text-ameixa">
                            {g.name}
                          </button>
                          <span className="block text-sm text-tinta-suave tabular-nums">{g.phone ? formatPhoneBR(g.phone) : "Sem telefone"}</span>
                          <LinkBadge guest={g} />
                          {g.companionsNames && <span className="block text-sm text-tinta-suave">Acompanhantes: {g.companionsNames}</span>}
                          {g.dietaryRestrictions && <span className="block text-sm text-aviso">Restrição: {g.dietaryRestrictions}</span>}
                        </td>
                        <td className="px-2 py-3 text-tinta-suave">{g.category || "Sem grupo"}</td>
                        <td className="px-2 py-3 tabular-nums">{seats(g)}</td>
                        <td className="px-2 py-3">
                          <RsvpChip status={g.rsvpStatus} />
                        </td>
                        <td className="px-2 py-3 text-tinta-suave">{g.table?.name ?? "Sem mesa"}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => openEdit(g)} className={`${btn.quiet} ${btn.sm}`} aria-label={`Editar ${g.name}`}>
                              Editar
                            </button>
                            <button type="button" onClick={() => askRemove(g)} className={btnIconDanger} aria-label={`Excluir ${g.name}`}>
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Celular: um cartão por convidado, o toque abre a edição */}
              <ul className="flex flex-col gap-2 md:hidden">
                {shown.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      aria-label={`Editar ${g.name}`}
                      className={`${card} flex min-h-14 w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left`}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-areia text-sm font-semibold text-tinta" aria-hidden="true">
                        {initials(g.name)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate font-semibold text-tinta">{g.name}</strong>
                        <span className="text-sm text-tinta-suave">{[g.category, seatsLabel(g)].filter(Boolean).join(" · ")}</span>
                      </span>
                      <RsvpChip status={g.rsvpStatus} />
                    </button>
                  </li>
                ))}
              </ul>

              <p className="text-sm text-tinta-suave">
                Mostrando {shown.length} de {filtered.length}
                {filtered.length !== counts.all && ` (${counts.all} no total)`}
                {shown.length < filtered.length && (
                  <>
                    {" · "}
                    <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-ameixa underline underline-offset-2 hover:text-ameixa-hover md:min-h-0">
                      Carregar mais
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </>
      )}

      {/* Botão de adicionar no celular, acima da barra inferior */}
      <button
        type="button"
        onClick={openAdd}
        aria-label="Adicionar convidado"
        className="fixed bottom-24 right-4 z-30 grid size-14 cursor-pointer place-items-center rounded-full bg-ameixa text-on-ameixa shadow-[var(--shadow-aceito-2)] transition-colors hover:bg-ameixa-hover md:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>

      <ImportGuestsModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        existing={initialGuests.map((g) => ({ name: g.name, phone: g.phone ?? null }))}
      />

      <GuestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        guest={editingGuest}
        allGuests={initialGuests}
        onDelete={(g) => {
          setIsModalOpen(false);
          askRemove(g);
        }}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          if (toRemove) remove(toRemove.id);
        }}
        title="Remover convidado"
        description={toRemove ? `Remover ${toRemove.name} da lista? Não dá para desfazer.` : ""}
        confirmText="Remover"
      />
    </div>
  );
}
