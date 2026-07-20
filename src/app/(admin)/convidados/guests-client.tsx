"use client";

import { useState, useTransition } from "react";
import { GuestLocal as Guest } from "@/types/local";
import { deleteGuest, sendInvite } from "@/actions/guest-actions";
import { sendRsvpReminders, sendInitialInvites } from "@/actions/whatsapp-actions";
import { GuestModal } from "./guest-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";
import {
  Trash2,
  Pencil,
  Send,
  MessageSquare,
  Bell,
  Mail,
  Download,
  Users,
} from "lucide-react";

interface GuestsClientProps {
  initialGuests: Guest[];
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

export function GuestsClient({ initialGuests }: GuestsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Estados para Confirmações Customizadas
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
        startTransition(async () => {
          const res = await deleteGuest(id);
          if (res.success) {
            toast.success("Convidado removido com sucesso!");
          } else {
            toast.error(res.error || "Erro ao remover convidado.");
          }
        });
      }
    );
  }

  async function handleSendInvite(id: string) {
    startTransition(async () => {
      const result = await sendInvite(id);
      if (result.success) {
        toast.success("Convite enviado com sucesso via WhatsApp!");
      } else {
        toast.error(`Erro ao enviar convite: ${result.error}`);
      }
    });
  }

  async function handleBulkReminder() {
    setBulkStatus("⏳ Disparando lembretes...");
    startTransition(async () => {
      try {
        const result = await sendRsvpReminders();
        setBulkStatus(`✅ ${result.message}`);
        toast.success(result.message);
        setTimeout(() => setBulkStatus(null), 6000);
      } catch (err) {
        setBulkStatus("❌ Erro ao disparar");
        toast.error("Erro de comunicação ao disparar lembretes.");
      }
    });
  }

  async function handleSendInitialInvites() {
    triggerConfirm(
      "Disparar Convites Iniciais",
      `Deseja realmente enviar os convites no WhatsApp para todas as ${notInvited} pessoas que ainda não receberam?`,
      async () => {
        setBulkStatus("⏳ Enviando convites iniciais...");
        startTransition(async () => {
          try {
            const result = await sendInitialInvites();
            setBulkStatus(`✅ ${result.message}`);
            toast.success(result.message);
            setTimeout(() => setBulkStatus(null), 6000);
          } catch (err) {
            setBulkStatus("❌ Erro ao disparar");
            toast.error("Erro ao enviar convites iniciais.");
          }
        });
      }
    );
  }

  // Estatísticas corrigidas refletindo acompanhantes de fato confirmados
  const confirmedMain = initialGuests.filter((g) => g.rsvpStatus === "CONFIRMED").length;
  const confirmedCompanions = initialGuests
    .filter((g) => g.rsvpStatus === "CONFIRMED")
    .reduce((acc, g) => acc + (g.confirmedCompanions || 0), 0);
  const totalPeopleConfirmed = confirmedMain + confirmedCompanions;

  const pending = initialGuests.filter((g) => g.rsvpStatus === "PENDING").length;
  const notInvited = initialGuests.filter((g) => !g.hasReceivedMessage && g.phone).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-zinc-400" />
            Convidados
          </h2>
          <p className="text-zinc-500 mt-1">
            Gerencie sua lista e automatize a comunicação via WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="shadow-sm flex items-center gap-2 text-zinc-700"
          >
            <a href="/api/export/guests" download="convidados.csv">
              <Download className="w-4 h-4" />
              Exportar (CSV)
            </a>
          </Button>
          <Button
            onClick={openAdd}
            className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Novo Convidado
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Convites", value: initialGuests.length, color: "text-zinc-900" },
          { label: "Titulares Confirmados", value: confirmedMain, color: "text-zinc-700" },
          { label: "Confirmados (Total)", value: totalPeopleConfirmed, color: "text-emerald-600" },
          { label: "Pendentes", value: pending, color: "text-amber-600" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-zinc-200/80 shadow-sm p-5"
          >
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {s.label}
            </p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-col gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
        <div className="flex items-center gap-2 text-zinc-700">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-semibold">Automação WhatsApp</span>
          {bulkStatus && (
            <span className="text-sm text-zinc-600 ml-auto font-normal">{bulkStatus}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendInitialInvites}
            disabled={isPending || notInvited === 0}
            className="text-blue-700 border-blue-200 hover:bg-blue-50 gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            Enviar Convites ({notInvited} sem convite)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkReminder}
            disabled={isPending || pending === 0}
            className="text-amber-700 border-amber-200 hover:bg-amber-50 gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            Lembrar Pendentes ({pending})
          </Button>
        </div>
      </div>

      {/* Guests Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden animate-in fade-in duration-300">
        {initialGuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Users className="w-10 h-10 mb-3 text-zinc-200" />
            <p className="font-medium text-zinc-500">Nenhum convidado cadastrado</p>
            <p className="text-sm mt-1">Clique em "Novo Convidado" para começar.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-zinc-50/80 border-b border-zinc-100">
              <tr>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3">
                  Nome
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                  WhatsApp
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                  Acomp. Confirmados
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                  Convite
                </th>
                <th className="w-16 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {initialGuests.map((guest) => {
                const rsvp = rsvpConfig[guest.rsvpStatus];
                return (
                  <tr
                    key={guest.id}
                    className="group border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900">{guest.name}</span>
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
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {guest.phone ? (
                        <span className="text-sm text-zinc-600 font-mono">
                          +{guest.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Não informado</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-sm text-zinc-600">
                        {guest.rsvpStatus === "CONFIRMED" 
                          ? `${guest.confirmedCompanions || 0} / ${guest.allowedCompanions}`
                          : `0 / ${guest.allowedCompanions}`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="outline"
                        className={`font-medium text-xs ${rsvp.className}`}
                      >
                        {rsvp.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {guest.hasReceivedMessage ? (
                        <Badge
                          variant="outline"
                          className="text-xs font-normal text-zinc-400 border-zinc-200"
                        >
                          Enviado
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!guest.phone || isPending}
                          onClick={() => handleSendInvite(guest.id)}
                          className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 gap-1.5 h-7 px-2.5 text-xs"
                        >
                          <Send className="w-3 h-3" />
                          Enviar
                        </Button>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-400 hover:text-zinc-900"
                          onClick={() => openEdit(guest)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(guest.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <GuestModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGuest(null);
        }}
        guest={editingGuest}
      />

      {/* Modal de Confirmação Customizado */}
      {confirmData && (
        <ConfirmModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            confirmData.onConfirm();
          }}
          title={confirmData.title}
          description={confirmData.description}
          isLoading={isPending}
        />
      )}
    </div>
  );
}
