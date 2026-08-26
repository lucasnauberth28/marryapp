"use client";

import { useState, useTransition } from "react";
import { GuestLocal as Guest } from "@/types/local";
import { deleteGuest } from "@/actions/guest-actions";
import { GuestModal } from "./guest-modal";
import { TablesClient } from "../mesas/tables-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";
import {
  Trash2,
  Pencil,
  Download,
  Users,
  LayoutGrid,
  HeartHandshake,
  UserCheck,
} from "lucide-react";

interface GuestsClientProps {
  initialGuests: Guest[];
  initialTables: any[];
  initialUnassigned: any[];
}

const rsvpConfig = {
  PENDING: {
    label: "Pendente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  CONFIRMED: {
    label: "Confirmado",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  DECLINED: {
    label: "Recusado",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function GuestsClient({
  initialGuests,
  initialTables,
  initialUnassigned,
}: GuestsClientProps) {
  const [activeTab, setActiveTab] = useState<"guests" | "tables">("guests");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados para Confirmação de Exclusão
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmData({ title, description, onConfirm });
    setConfirmOpen(true);
  };

  function openAdd() {
    setEditingGuest(null);
    setIsModalOpen(true);
  }

  function openEdit(guest: Guest) {
    setEditingGuest(guest);
    setIsModalOpen(true);
  }

  function handleDelete(id: string) {
    triggerConfirm(
      "Remover Convidado",
      "Tem certeza que deseja remover este convidado da lista? Esta ação não pode ser desfeita.",
      async () => {
        const toastId = toast.loading("Removendo convidado...");
        startTransition(async () => {
          const res = await deleteGuest(id);
          if (res.success) {
            toast.success("Convidado removido com sucesso!", { id: toastId });
          } else {
            toast.error(res.error || "Erro ao realizar operação.", {
              id: toastId,
              duration: 6000,
              description: "Ocorreu um erro inesperado no servidor.",
            });
          }
        });
      }
    );
  }

  // Métricas
  const confirmedMain = initialGuests.filter((g) => g.rsvpStatus === "CONFIRMED").length;
  const confirmedCompanions = initialGuests
    .filter((g) => g.rsvpStatus === "CONFIRMED")
    .reduce((acc, g) => acc + (g.confirmedCompanions || 0), 0);
  const totalPeopleConfirmed = confirmedMain + confirmedCompanions;

  const pending = initialGuests.filter((g) => g.rsvpStatus === "PENDING").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header com Navegação por Abas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#8C6D45] font-serif italic tracking-tight">
            Gestão de Convidados & Mesas
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Gerencie sua lista de convidados, tipos, vínculos de família e alocação de lugares nas mesas.
          </p>
        </div>

        {/* Abas */}
        <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("guests")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "guests"
                ? "bg-white text-zinc-900 shadow-sm font-semibold"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Users className="w-4 h-4 text-[#8C6D45]" />
            Lista de Convidados ({initialGuests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tables")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "tables"
                ? "bg-white text-zinc-900 shadow-sm font-semibold"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-[#8C6D45]" />
            Organização de Mesas ({initialTables.length})
          </button>
        </div>
      </div>

      {/* ABA 1: LISTA DE CONVIDADOS */}
      {activeTab === "guests" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Tabela de Convidados com DataTable */}
          <DataTable
            data={initialGuests}
            pageSize={15}
            keyExtractor={(g) => g.id}
            searchPlaceholder="Buscar por nome, e-mail, telefone..."
            emptyMessage="Nenhum convidado encontrado."
            topRightElement={
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="shadow-sm flex items-center gap-2 text-zinc-700 h-10"
                >
                  <a href="/api/export/guests" download="convidados.csv">
                    <Download className="w-4 h-4" />
                    Exportar (CSV)
                  </a>
                </Button>
                <Button
                  onClick={openAdd}
                  className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm flex items-center gap-2 h-10"
                >
                  <span className="text-lg leading-none">+</span> Novo Convidado
                </Button>
              </div>
            }
            columns={[
              {
                key: "name",
                header: "Nome / Detalhes",
                sortable: true,
                accessor: (g) => g.name,
                cell: (guest) => (
                  <div className="flex flex-col">
                    <span className="font-semibold text-zinc-900">{guest.name}</span>
                    {guest.email && (
                      <span className="text-xs text-zinc-400 mt-0.5">{guest.email}</span>
                    )}
                    {guest.companionsNames && (
                      <span className="text-xs text-zinc-500 mt-1 font-normal">
                        Acomp: <span className="italic text-zinc-700">{guest.companionsNames}</span>
                      </span>
                    )}
                    {guest.dietaryRestrictions && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 w-fit mt-1.5 font-medium">
                        Restrição: {guest.dietaryRestrictions}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: "category",
                header: "Tipo",
                sortable: true,
                className: "hidden md:table-cell",
                headerClassName: "hidden md:table-cell",
                accessor: (g) => g.category || "",
                cell: (guest) =>
                  guest.category ? (
                    <Badge variant="outline" className="bg-amber-50/80 text-amber-900 border-amber-200/80 font-medium">
                      {guest.category}
                    </Badge>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Não definido</span>
                  ),
              },
              {
                key: "parentGuest",
                header: "Vínculo Familiar",
                sortable: true,
                className: "hidden lg:table-cell",
                headerClassName: "hidden lg:table-cell",
                accessor: (g) => g.parentGuest?.name || (g.linkedGuests && g.linkedGuests.length > 0 ? "Titular" : ""),
                cell: (guest) => {
                  const parentName = guest.parentGuest?.name;
                  const hasLinked = guest.linkedGuests && guest.linkedGuests.length > 0;
                  return parentName ? (
                    <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 border border-purple-200/70 px-2 py-1 rounded-md w-fit font-medium">
                      <HeartHandshake className="w-3.5 h-3.5" />
                      Família de: {parentName}
                    </div>
                  ) : hasLinked ? (
                    <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-1 rounded-md w-fit font-medium">
                      <UserCheck className="w-3.5 h-3.5" />
                      Convidado Principal ({guest.linkedGuests?.length} vínc.)
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Titular</span>
                  );
                },
              },
              {
                key: "phone",
                header: "WhatsApp",
                sortable: true,
                className: "hidden md:table-cell",
                headerClassName: "hidden md:table-cell",
                accessor: (g) => g.phone || "",
                cell: (guest) =>
                  guest.phone ? (
                    <span className="text-sm text-zinc-600 font-mono">+{guest.phone}</span>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Não informado</span>
                  ),
              },
              {
                key: "confirmedCompanions",
                header: "Acomp. Confirmados",
                sortable: true,
                className: "hidden lg:table-cell",
                headerClassName: "hidden lg:table-cell",
                accessor: (g) => g.confirmedCompanions || 0,
                cell: (guest) => (
                  <span className="text-sm text-zinc-600">
                    {guest.rsvpStatus === "CONFIRMED"
                      ? `${guest.confirmedCompanions || 0} / ${guest.allowedCompanions}`
                      : `0 / ${guest.allowedCompanions}`}
                  </span>
                ),
              },
              {
                key: "rsvpStatus",
                header: "Status",
                sortable: true,
                accessor: (g) => rsvpConfig[g.rsvpStatus]?.label || "",
                cell: (guest) => {
                  const rsvp = rsvpConfig[guest.rsvpStatus];
                  return (
                    <Badge variant="outline" className={rsvp.className}>
                      {rsvp.label}
                    </Badge>
                  );
                },
              },
              {
                key: "actions",
                header: "Ações",
                sortable: false,
                searchable: false,
                className: "text-right",
                headerClassName: "text-right w-20",
                cell: (guest) => (
                  <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(guest)}
                      className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(guest.id)}
                      className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {/* ABA 2: ORGANIZAÇÃO DE MESAS */}
      {activeTab === "tables" && (
        <div className="animate-in fade-in duration-300">
          <TablesClient
            initialTables={initialTables}
            initialUnassigned={initialUnassigned}
          />
        </div>
      )}

      {/* Modais */}
      <GuestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        guest={editingGuest}
        allGuests={initialGuests}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          confirmData?.onConfirm();
        }}
        title={confirmData?.title || ""}
        description={confirmData?.description || ""}
      />
    </div>
  );
}
