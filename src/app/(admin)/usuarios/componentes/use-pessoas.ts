// O formulário de usuários (criar, editar), o salvamento e a exclusão.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { atualizarPessoa, criarPessoa, excluirPessoa } from "@/actions/acesso/pessoas";
import { useConfirmacaoDeExclusao } from "@/components/casal/acesso/use-confirmacao-de-exclusao";
import type { DadosDaPessoa, ItemDePessoa, OpcaoDePerfil } from "./tipos";

export function usePessoas(perfis: OpcaoDePerfil[]) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [editing, setEditing] = useState<ItemDePessoa | null>(null);
  const [formData, setFormData] = useState<DadosDaPessoa>({ name: "", username: "", password: "", roleId: "" });
  const [formAberto, setFormAberto] = useState(false);
  const exclusao = useConfirmacaoDeExclusao();

  const abrir = (pessoa: ItemDePessoa | null) => {
    setEditing(pessoa);
    // A senha não vem do banco: o campo fica vazio
    setFormData(pessoa ? { name: pessoa.name, username: pessoa.username, password: "", roleId: pessoa.roleId } : { name: "", username: "", password: "", roleId: perfis[0]?.id || "" });
    setFormAberto(true);
  };

  function salvar() {
    if (!formData.name || !formData.username || !formData.roleId) return toast.error("Preencha nome, login e perfil.");
    if (!editing && !formData.password) return toast.error("Defina uma senha para o novo usuário.");
    const toastId = toast.loading(editing ? "Salvando o usuário..." : "Criando o usuário...");
    startTransition(async () => {
      const result = editing ? await atualizarPessoa(editing.id, formData) : await criarPessoa(formData);
      if (!result.success) return void toast.error(result.error || "Não deu para salvar o usuário. Tente de novo.", { id: toastId, duration: 6000 });
      toast.success(editing ? "Usuário atualizado." : "Usuário criado.", { id: toastId });
      router.refresh();
    });
  }

  const excluir = (id: string) =>
    exclusao.pedir(() => {
      const toastId = toast.loading("Excluindo o usuário...");
      startTransition(async () => {
        const result = await excluirPessoa(id);
        if (!result.success) return void toast.error(result.error || "Não deu para excluir o usuário. Tente de novo.", { id: toastId, duration: 6000 });
        toast.success("Usuário excluído.", { id: toastId });
        router.refresh();
      });
    });

  return {
    editing, formData, formAberto, isPending, exclusao, abrir, salvar, excluir, fecharFormulario: () => setFormAberto(false),
    mudar: <C extends keyof DadosDaPessoa>(campo: C, valor: DadosDaPessoa[C]) => setFormData((f) => ({ ...f, [campo]: valor })),
  };
}

export type GestaoDePessoas = ReturnType<typeof usePessoas>;
