// O formulário de perfis (criar, editar), o salvamento e a exclusão.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { atualizarPerfil, criarPerfil, excluirPerfil } from "@/actions/acesso/perfis";
import { useConfirmacaoDeExclusao } from "@/components/casal/acesso/use-confirmacao-de-exclusao";
import { alternarCaminho, paraCaminhos, type DadosDoPerfil, type ItemDePerfil } from "./tipos";

const PERFIL_VAZIO: DadosDoPerfil = { name: "", allowedPaths: [] };

export function usePerfis() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [editing, setEditing] = useState<ItemDePerfil | null>(null);
  const [formData, setFormData] = useState<DadosDoPerfil>(PERFIL_VAZIO);
  const [formAberto, setFormAberto] = useState(false);
  const exclusao = useConfirmacaoDeExclusao();

  const abrir = (perfil: ItemDePerfil | null) => {
    setEditing(perfil);
    setFormData(perfil ? { name: perfil.name, allowedPaths: paraCaminhos(perfil.allowedPaths) } : PERFIL_VAZIO);
    setFormAberto(true);
  };

  function salvar() {
    if (!formData.name) return toast.error("Dê um nome ao perfil.");
    if (formData.allowedPaths.length === 0) return toast.error("Marque ao menos uma área.");
    const toastId = toast.loading(editing ? "Salvando o perfil..." : "Criando o perfil...");
    startTransition(async () => {
      const result = editing ? await atualizarPerfil(editing.id, formData) : await criarPerfil(formData);
      if (!result.success) return void toast.error(result.error || "Não deu para salvar o perfil. Tente de novo.", { id: toastId, duration: 6000 });
      toast.success(editing ? "Perfil atualizado." : "Perfil criado.", { id: toastId });
      router.refresh();
    });
  }

  const excluir = (id: string) =>
    exclusao.pedir(() => {
      const toastId = toast.loading("Excluindo o perfil...");
      startTransition(async () => {
        const result = await excluirPerfil(id);
        if (!result.success) return void toast.error(result.error || "Não deu para excluir o perfil. Tente de novo.", { id: toastId, duration: 6000 });
        toast.success("Perfil excluído.", { id: toastId });
        router.refresh();
      });
    });

  return {
    editing, formData, formAberto, isPending, exclusao, abrir, salvar, excluir, fecharFormulario: () => setFormAberto(false),
    mudarNome: (name: string) => setFormData((f) => ({ ...f, name })),
    alternar: (path: string) => setFormData((f) => ({ ...f, allowedPaths: alternarCaminho(f.allowedPaths, path) })),
  };
}

export type GestaoDePerfis = ReturnType<typeof usePerfis>;
