// Os campos controlados do modal do convidado e o reinício ao abrir ou trocar de convidado.
import { useId, useMemo, useState } from "react";
import { SituacaoDaConfirmacao, type ConvidadoLocal } from "@/types/local";

interface CamposControlados {
  category: string;
  parentGuestId: string;
  rsvpStatus: SituacaoDaConfirmacao;
  /** Lugares reservados = o convidado + os acompanhantes que ele pode levar. */
  seats: number;
}

const valoresIniciais = (g?: ConvidadoLocal | null): CamposControlados => ({
  category: g?.category ?? "",
  parentGuestId: g?.parentGuestId ?? "none",
  rsvpStatus: g?.rsvpStatus ?? SituacaoDaConfirmacao.PENDING,
  seats: 1 + (g?.allowedCompanions ?? 0),
});

interface EntradaDosCampos {
  isOpen: boolean;
  guest?: ConvidadoLocal | null;
  allGuests: ConvidadoLocal[];
}

export function useCamposDoConvidado({ isOpen, guest, allGuests }: EntradaDosCampos) {
  const [campos, setCampos] = useState(valoresIniciais(guest));
  const [error, setError] = useState<string | null>(null);
  // Troca a chave do formulário para limpar os campos ao salvar e adicionar outro
  const [formKey, setFormKey] = useState(0);
  const [addAnother, setAddAnother] = useState(false);
  const ids = { category: useId(), seats: useId(), rsvp: useId(), parent: useId() };

  // Resetar todos os campos ao abrir o modal ou trocar de convidado (ajuste durante o render, sem efeito)
  const [synced, setSynced] = useState({ isOpen, guest });
  if (synced.isOpen !== isOpen || synced.guest !== guest) {
    setSynced({ isOpen, guest });
    if (isOpen) {
      setCampos(valoresIniciais(guest));
      setFormKey((k) => k + 1);
      setError(null);
    }
  }

  // Filtrar o próprio convidado para não se auto-vincular
  const parentOptions = useMemo(
    () => [
      { value: "none", label: "Não, convida a si mesmo" },
      ...allGuests.filter((g) => !guest || g.id !== guest.id).map((p) => ({ value: p.id, label: p.category ? `${p.name} (${p.category})` : p.name })),
    ],
    [allGuests, guest],
  );

  const mudar = <C extends keyof CamposControlados>(campo: C, valor: CamposControlados[C]) => setCampos((c) => ({ ...c, [campo]: valor }));
  const limpar = () => {
    setCampos(valoresIniciais(null));
    setFormKey((k) => k + 1);
  };

  return { ...campos, ids, isEditing: !!guest, error, setError, formKey, addAnother, setAddAnother, parentOptions, mudar, limpar };
}

export type CamposDoConvidado = ReturnType<typeof useCamposDoConvidado>;
