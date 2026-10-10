"use client";

import { useId, useState, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { GuestLocal as Guest, RsvpStatus } from "@/types/local";
import { CustomModal } from "@/components/ui/custom-modal";
import { createGuest, updateGuest } from "@/actions/guest-actions";
import { formatPhoneBR } from "@/lib/wedding-format";
import { btn, btnDanger, errorBox, hint, input, label } from "@/components/painel/styles";

export const GUEST_CATEGORIES = [
  "Padrinho/Madrinha",
  "Participantes de cerimônia",
  "Pais",
  "Família",
  "Amigo/Colega",
] as const;

const MAX_SEATS = 20;

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest?: Guest | null;
  allGuests?: Guest[];
  /** Quando informado, a edição mostra o botão de excluir (útil no celular, sem a lixeira da linha). */
  onDelete?: (guest: Guest) => void;
}

function Field({
  label: text,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required,
  hint: help,
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
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className={label}>
        {text} {required && <span className="text-perigo" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-describedby={help ? `${id}-dica` : undefined}
        className={input}
      />
      {help && (
        <p id={`${id}-dica`} className={hint}>
          {help}
        </p>
      )}
    </div>
  );
}

export function GuestModal({ isOpen, onClose, guest, allGuests = [], onDelete }: GuestModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(guest?.category ?? "");
  const [parentGuestId, setParentGuestId] = useState<string>(guest?.parentGuestId ?? "none");
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(guest?.rsvpStatus ?? RsvpStatus.PENDING);
  // Lugares reservados = o convidado + os acompanhantes que ele pode levar
  const [seats, setSeats] = useState<number>(1 + (guest?.allowedCompanions ?? 0));
  // Troca a chave do formulário para limpar os campos ao salvar e adicionar outro
  const [formKey, setFormKey] = useState(0);
  const [addAnother, setAddAnother] = useState(false);

  const ids = { category: useId(), seats: useId(), rsvp: useId(), parent: useId() };

  const isEditing = !!guest;

  // Resetar todos os campos ao abrir o modal ou trocar de convidado (ajuste durante o render, sem efeito)
  const [synced, setSynced] = useState({ isOpen, guest });
  if (synced.isOpen !== isOpen || synced.guest !== guest) {
    setSynced({ isOpen, guest });
    if (isOpen) {
      setCategory(guest?.category ?? "");
      setParentGuestId(guest?.parentGuestId ?? "none");
      setRsvpStatus(guest?.rsvpStatus ?? RsvpStatus.PENDING);
      setSeats(1 + (guest?.allowedCompanions ?? 0));
      setFormKey((k) => k + 1);
      setError(null);
    }
  }

  // Filtrar o próprio convidado para não se auto-vincular
  const availableParents = allGuests.filter((g) => !guest || g.id !== guest.id);

  const parentOptions = useMemo(
    () => [
      { value: "none", label: "Não, convida a si mesmo" },
      ...availableParents.map((p) => ({
        value: p.id,
        label: p.category ? `${p.name} (${p.category})` : p.name,
      })),
    ],
    [availableParents]
  );

  function handleSubmit(formData: FormData) {
    if (isEditing) formData.set("rsvpStatus", rsvpStatus);
    formData.set("category", category);
    formData.set("parentGuestId", parentGuestId === "none" ? "" : parentGuestId);
    formData.set("allowedCompanions", String(Math.max(0, seats - 1)));

    setError(null);

    const toastId = toast.loading(isEditing ? "Salvando as alterações..." : "Adicionando à lista...");
    startTransition(async () => {
      const result = isEditing ? await updateGuest(guest.id, formData) : await createGuest(formData);

      if (result.success) {
        toast.success(isEditing ? "Alterações salvas." : "Convidado adicionado à lista.", { id: toastId });
        if (!isEditing && addAnother) {
          // Fica no formulário, limpo, para o próximo convidado
          setCategory("");
          setParentGuestId("none");
          setSeats(1);
          setFormKey((k) => k + 1);
        } else {
          onClose();
        }
      } else {
        toast.error(result.error ?? "Não deu para salvar. Tente de novo.", { id: toastId });
        setError(result.error ?? "Não deu para salvar. Tente de novo.");
      }
    });
  }

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar convidado" : "Adicionar convidado"}
      description={isEditing ? "Atualize as informações deste convidado." : "Só o nome é obrigatório. O resto dá para completar depois."}
      size="md"
      className="max-h-[92vh] overflow-y-auto"
    >
      <form key={formKey} action={handleSubmit} className="flex flex-col gap-5">
        <Field
          label="Nome no convite"
          name="name"
          placeholder="Ex.: Família Teixeira"
          autoComplete="off"
          defaultValue={guest?.name}
          hint="É assim que a pessoa vai se encontrar no convite."
          required
        />

        <Field
          label="WhatsApp"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          hint="Com DDD, por exemplo (11) 99999-8888. É por ele que o convite é enviado."
          placeholder="(11) 90000-0000"
          defaultValue={guest?.phone ? formatPhoneBR(guest.phone) : ""}
        />

        <Field label="E-mail (opcional)" name="email" type="email" inputMode="email" autoComplete="off" placeholder="nome@exemplo.com" defaultValue={guest?.email ?? ""} />

        <div className="flex flex-col gap-2">
          <span className={label} id={ids.seats}>
            Lugares reservados
          </span>
          <div role="group" aria-labelledby={ids.seats} className="flex items-center gap-3">
            <button type="button" aria-label="Menos um lugar" disabled={seats <= 1} onClick={() => setSeats((n) => Math.max(1, n - 1))} className={`${btn.secondary} w-12 !px-0`}>
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <output aria-live="polite" className="min-w-12 text-center font-display text-[28px] leading-8 text-tinta [font-variant-numeric:lining-nums]">
              {seats}
            </output>
            <button type="button" aria-label="Mais um lugar" disabled={seats >= MAX_SEATS} onClick={() => setSeats((n) => Math.min(MAX_SEATS, n + 1))} className={`${btn.secondary} w-12 !px-0`}>
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
          <p className={hint}>Conta a própria pessoa e quem ela pode levar.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor={ids.category} className={label}>
              Grupo
            </label>
            <select id={ids.category} value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
              <option value="">Sem grupo</option>
              {category && !GUEST_CATEGORIES.some((c) => c === category) && <option value={category}>{category}</option>}
              {GUEST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={ids.parent} className={label}>
              Vem junto com outro convidado?
            </label>
            <select id={ids.parent} value={parentGuestId} onChange={(e) => setParentGuestId(e.target.value)} className={input}>
              {parentOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isEditing && (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor={ids.rsvp} className={label}>
                Resposta ao convite
              </label>
              <select id={ids.rsvp} value={rsvpStatus} onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)} className={input}>
                <option value={RsvpStatus.PENDING}>Sem resposta</option>
                <option value={RsvpStatus.CONFIRMED}>Confirmado</option>
                <option value={RsvpStatus.DECLINED}>Não vai</option>
              </select>
            </div>

            {rsvpStatus === RsvpStatus.CONFIRMED ? (
              <Field label="Restrições alimentares" name="dietaryRestrictions" placeholder="Sem glúten, vegano..." defaultValue={guest?.dietaryRestrictions ?? ""} />
            ) : (
              <input type="hidden" name="dietaryRestrictions" value={guest?.dietaryRestrictions ?? ""} />
            )}

            {/* Dados que o convidado informa ao responder: seguem como estão ao salvar */}
            <input type="hidden" name="confirmedCompanions" value={guest?.confirmedCompanions ?? 0} />
            <input type="hidden" name="companionsNames" value={guest?.companionsNames ?? ""} />
          </>
        )}

        {error && (
          <p role="alert" className={errorBox}>
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 border-t border-linha pt-4">
          <button type="submit" disabled={isPending} onClick={() => setAddAnother(false)} className={`${btn.primary} ${btn.block}`}>
            {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Salvar convidado"}
          </button>
          {isEditing ? (
            <>
              <button type="button" onClick={onClose} disabled={isPending} className={`${btn.quiet} ${btn.block}`}>
                Cancelar
              </button>
              {onDelete && guest && (
                <button type="button" onClick={() => onDelete(guest)} disabled={isPending} className={`${btnDanger} w-full`}>
                  Excluir convidado
                </button>
              )}
            </>
          ) : (
            <button type="submit" disabled={isPending} onClick={() => setAddAnother(true)} className={`${btn.quiet} ${btn.block}`}>
              Salvar e adicionar outro
            </button>
          )}
        </div>
      </form>
    </CustomModal>
  );
}
