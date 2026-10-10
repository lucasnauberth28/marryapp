"use client";

import { useId, useState, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { GuestLocal as Guest, RsvpStatus } from "@/types/local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomModal } from "@/components/ui/custom-modal";
import { createGuest, updateGuest } from "@/actions/guest-actions";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
  hint,
  inputMode,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  required?: boolean;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-tinta">
        {label} {required && <span className="text-perigo" aria-hidden="true">*</span>}
      </label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-describedby={hint ? `${id}-dica` : undefined}
        className="h-11 border-linha-forte bg-papel sm:h-10"
      />
      {hint && (
        <p id={`${id}-dica`} className="text-xs text-tinta-suave">
          {hint}
        </p>
      )}
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

  // Resetar todos os campos ao abrir o modal ou trocar de convidado (ajuste durante o render, sem efeito)
  const [synced, setSynced] = useState({ isOpen, guest });
  if (synced.isOpen !== isOpen || synced.guest !== guest) {
    setSynced({ isOpen, guest });
    if (isOpen) {
      setCategory(guest?.category ?? "");
      setParentGuestId(guest?.parentGuestId ?? "none");
      setRsvpStatus(guest?.rsvpStatus ?? RsvpStatus.PENDING);
      setError(null);
    }
  }

  // Filtrar o próprio convidado para não se auto-vincular
  const availableParents = allGuests.filter((g) => !guest || g.id !== guest.id);

  const parentOptions = useMemo(() => [
    { value: "none", label: "Não, convida a si mesmo" },
    ...availableParents.map((p) => ({
      value: p.id,
      label: p.name,
      sublabel: p.category ? `(${p.category})` : undefined,
    })),
  ], [availableParents]);

  function handleSubmit(formData: FormData) {
    if (isEditing) formData.set("rsvpStatus", rsvpStatus);
    formData.set("category", category);
    formData.set("parentGuestId", parentGuestId === "none" ? "" : parentGuestId);

    setError(null);

    const toastId = toast.loading(isEditing ? "Atualizando dados do convidado..." : "Cadastrando novo convidado...");
    startTransition(async () => {
      const result = isEditing
        ? await updateGuest(guest.id, formData)
        : await createGuest(formData);

      if (result.success) {
        toast.success(isEditing ? "Convidado atualizado com sucesso!" : "Convidado adicionado à lista!", {
          id: toastId,
        });
        onClose();
      } else {
        toast.error(result.error ?? "Erro ao salvar dados do convidado.", { id: toastId });
        setError(result.error ?? "Erro desconhecido.");
      }
    });
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar convidado" : "Novo convidado"}
      description={
        isEditing
          ? "Atualize as informações do convidado."
          : "Só o nome é obrigatório. O resto dá para completar depois."
      }
      size="md"
    >
      <form action={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field
              label="Nome completo"
              name="name"
              placeholder="Ex.: João Silva" autoComplete="off"
              defaultValue={guest?.name}
              required
            />
          </div>

          <div className="col-span-2">
            <Field
              label="WhatsApp"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              hint="Com DDD, por exemplo (11) 99999-8888. É por ele que o convite é enviado."
              placeholder="(11) 99999-8888"
              defaultValue={guest?.phone ?? ""}
            />
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-1.5">
            <label htmlFor="guest-category" className="text-sm font-semibold text-tinta">
              Tipo de convidado
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="guest-category" className="h-11 w-full border-linha-forte bg-papel sm:h-10">
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
            <label className="text-sm font-semibold text-tinta">
              Vem junto com outro convidado?
            </label>
            <SearchableSelect
              options={parentOptions}
              value={parentGuestId}
              onValueChange={setParentGuestId}
              placeholder="Não, convida a si mesmo"
              searchPlaceholder="Buscar convidado..."
              emptyMessage="Nenhum convidado encontrado."
            />
          </div>

          {isEditing && (
            <>
              <div className="col-span-2 space-y-1.5">
                <label htmlFor="guest-rsvp" className="text-sm font-semibold text-tinta">
                  Resposta ao convite
                </label>
                <Select
                  value={rsvpStatus}
                  onValueChange={(v) => setRsvpStatus(v as RsvpStatus)}
                >
                  <SelectTrigger id="guest-rsvp" className="h-11 w-full border-linha-forte bg-papel sm:h-10">
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
                <div className="col-span-2">
                  <Field
                    label="Restrições alimentares"
                    name="dietaryRestrictions"
                    placeholder="Sem glúten, vegano..."
                    defaultValue={guest?.dietaryRestrictions ?? ""}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="text-sm text-perigo bg-perigo-suave border border-perigo/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="h-11 px-4 sm:h-9">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 bg-zinc-900 px-4 text-white hover:bg-zinc-800 shadow-sm sm:h-9"
          >
            {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar convidado"}
          </Button>
        </div>
      </form>
    </CustomModal>
  );
}
