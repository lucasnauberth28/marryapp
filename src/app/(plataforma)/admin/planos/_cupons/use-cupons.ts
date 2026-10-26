// O estado da tela de cupons: qual está aberto no formulário, o rascunho, salvar e excluir.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { criarCupom, excluirCupom, atualizarCupom, type CamposDoCupom } from "@/actions/coupon-actions";
import { reaisParaCentavos } from "@/lib/formatacao/dinheiro";
import { RASCUNHO_VAZIO_DO_CUPOM, rascunhoDe, type LinhaDeCupom, type RascunhoDoCupom } from "./tipos";

/** Os campos do formulário já no formato da ação, ou o texto do erro quando o valor não serve. */
function camposDoCupom(draft: RascunhoDoCupom): CamposDoCupom | string {
  const value = draft.kind === "percent" ? Number(draft.value) : reaisParaCentavos(draft.value);
  if (!value || !Number.isFinite(value) || value <= 0) return draft.kind === "percent" ? "Informe o percentual de 1 a 100." : "Informe o valor do desconto, por exemplo 20,00.";
  return {
    kind: draft.kind,
    value,
    planIds: draft.planIds as CamposDoCupom["planIds"],
    maxRedemptions: draft.maxRedemptions.trim() ? Number(draft.maxRedemptions) : null,
    expiresAt: draft.expiresAt || null,
    active: draft.active,
  };
}

export function useCupons() {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<RascunhoDoCupom>(RASCUNHO_VAZIO_DO_CUPOM);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = (target: LinhaDeCupom | "new") => {
    setError("");
    setDeleting(null);
    setDraft(target === "new" ? RASCUNHO_VAZIO_DO_CUPOM : rascunhoDe(target));
    setEditing(target === "new" ? "new" : target.id);
  };

  const save = () => {
    setError("");
    const fields = camposDoCupom(draft);
    if (typeof fields === "string") return setError(fields);
    startTransition(async () => {
      const res = editing === "new" ? await criarCupom({ code: draft.code, ...fields }) : await atualizarCupom(editing ?? "", fields);
      if (res.success) {
        toast.success(editing === "new" ? `Cupom ${draft.code.trim().toUpperCase()} criado.` : "Cupom atualizado.");
        setEditing(null);
        router.refresh();
      } else setError(res.error);
    });
  };

  const remove = (c: LinhaDeCupom) =>
    startTransition(async () => {
      const res = await excluirCupom(c.id);
      if (res.success) {
        toast.success(`Cupom ${c.code} excluído.`);
        setDeleting(null);
        router.refresh();
      } else toast.error(res.error);
    });

  const togglePlan = (id: string) => setDraft((d) => ({ ...d, planIds: d.planIds.includes(id) ? d.planIds.filter((p) => p !== id) : [...d.planIds, id] }));

  return { editing, setEditing, draft, setDraft, error, deleting, setDeleting, isPending, open, save, remove, togglePlan };
}

export type EstadoDosCupons = ReturnType<typeof useCupons>;
