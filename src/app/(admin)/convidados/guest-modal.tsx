"use client";

import { useState, useTransition } from "react";
import { GuestLocal as Guest, RsvpStatus } from "@/types/local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomModal } from "@/components/ui/custom-modal";
import { createGuest, updateGuest } from "@/actions/guest-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const GUEST_CATEGORIES = [
  "Padrinho/Madrinha",
  "Participantes de cerimônia",
  "Pais",
  "Família",
  "Amigo/Colega",
] as const;

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest?: Guest | null;
  allGuests?: Guest[];
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <Input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="bg-white border-zinc-200"
      />
    </div>
  );
}

export function GuestModal({ isOpen, onClose, guest, allGuests = [] }: GuestModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(guest?.category ?? "");
  const [parentGuestId, setParentGuestId] = useState<string>(guest?.parentGuestId ?? "none");
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(
    guest?.rsvpStatus ?? RsvpStatus.PENDING
  );

  const isEditing = !!guest;

  // Filtrar o próprio convidado para não se auto-vincular
  const availableParents = allGuests.filter((g) => !guest || g.id !== guest.id);

  function handleSubmit(formData: FormData) {
    if (isEditing) formData.set("rsvpStatus", rsvpStatus);
    formData.set("category", category);
    formData.set("parentGuestId", parentGuestId === "none" ? "" : parentGuestId);

    setError(null);

    startTransition(async () => {
      const result = isEditing
        ? await updateGuest(guest.id, formData)
        : await createGuest(formData);

      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Erro desconhecido.");
      }
    });
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Convidado" : "Novo Convidado"}
      description={
        isEditing
          ? "Atualize as informações do convidado."
          : "Cadastre um novo convidado no planejamento."
      }
      size="md"
    >
      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field
              label="Nome completo"
              name="name"
              placeholder="Ex: João Silva"
              defaultValue={guest?.name}
              required
            />
          </div>

          <div>
            <Field
              label="Telefone (WhatsApp)"
              name="phone"
              placeholder="5511999998888"
              defaultValue={guest?.phone ?? ""}
            />
          </div>

          <div>
            <Field
              label="Limite de Acompanhantes"
              name="allowedCompanions"
              type="number"
              placeholder="0"
              defaultValue={guest?.allowedCompanions ?? 0}
            />
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Tipo de Convidado
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-white border-zinc-200">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {GUEST_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Vincular a Convidado (Família)
            </label>
            <Select value={parentGuestId} onValueChange={setParentGuestId}>
              <SelectTrigger className="bg-white border-zinc-200">
                <SelectValue placeholder="Sem vínculo (Titular)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (Convidado Principal)</SelectItem>
                {availableParents.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.category ? `(${p.category})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Field
              label="E-mail"
              name="email"
              type="email"
              placeholder="joao@email.com"
              defaultValue={guest?.email ?? ""}
            />
          </div>

          {isEditing && (
            <>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Status RSVP
                </label>
                <Select
                  value={rsvpStatus}
                  onValueChange={(v) => setRsvpStatus(v as RsvpStatus)}
                >
                  <SelectTrigger className="bg-white border-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RsvpStatus.PENDING}>⏳ Pendente</SelectItem>
                    <SelectItem value={RsvpStatus.CONFIRMED}>✅ Confirmado</SelectItem>
                    <SelectItem value={RsvpStatus.DECLINED}>❌ Recusado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {rsvpStatus === RsvpStatus.CONFIRMED && (
                <>
                  <div>
                    <Field
                      label="Acomp. Confirmados"
                      name="confirmedCompanions"
                      type="number"
                      placeholder="0"
                      defaultValue={guest?.confirmedCompanions ?? 0}
                    />
                  </div>
                  <div>
                    <Field
                      label="Restrições Alimentares"
                      name="dietaryRestrictions"
                      placeholder="Sem glúten, vegano..."
                      defaultValue={guest?.dietaryRestrictions ?? ""}
                    />
                  </div>
                  <div className="col-span-2">
                    <Field
                      label="Nomes dos Acompanhantes"
                      name="companionsNames"
                      placeholder="Nome 1, Nome 2..."
                      defaultValue={guest?.companionsNames ?? ""}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm"
          >
            {isPending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Adicionar Convidado"}
          </Button>
        </div>
      </form>
    </CustomModal>
  );
}
