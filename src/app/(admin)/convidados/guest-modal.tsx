"use client";

import { useState, useTransition } from "react";
import { Guest, RsvpStatus } from "@prisma/client";
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

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest?: Guest | null; // Se fornecido, entra em modo de edição
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

export function GuestModal({ isOpen, onClose, guest }: GuestModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(
    guest?.rsvpStatus ?? RsvpStatus.PENDING
  );

  const isEditing = !!guest;

  function handleSubmit(formData: FormData) {
    if (isEditing) formData.set("rsvpStatus", rsvpStatus);
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
          : "Adicione um novo convidado à lista."
      }
      size="md"
    >
      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field
              label="Nome completo"
              name="name"
              placeholder="Ana e João Silva"
              defaultValue={guest?.name}
              required
            />
          </div>
          <Field
            label="Telefone (WhatsApp)"
            name="phone"
            placeholder="5511999998888"
            defaultValue={guest?.phone ?? ""}
            required
          />
          <Field
            label="Acompanhantes"
            name="allowedCompanions"
            type="number"
            placeholder="0"
            defaultValue={guest?.allowedCompanions ?? 0}
          />
          <div className="col-span-2">
            <Field
              label="E-mail"
              name="email"
              type="email"
              placeholder="ana@email.com"
              defaultValue={guest?.email ?? ""}
            />
          </div>
          {isEditing && (
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
