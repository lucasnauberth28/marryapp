// A janela de adicionar/editar um fornecedor: campos, contrato e envio.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { atualizarFornecedor, criarFornecedor } from "@/actions/vendor-actions";
import { FORMULARIO_VAZIO, type FormularioDoFornecedor, type FornecedorDoCasamento } from "./tipos";
import { useArquivoDoContrato } from "./use-arquivo-do-contrato";

const formularioDe = (v: FornecedorDoCasamento): FormularioDoFornecedor => ({
  name: v.name,
  category: v.category,
  contact: v.contact || "",
  notes: v.notes || "",
  contractUrl: v.contractUrl && v.contractUrl.startsWith("https://") ? v.contractUrl : "",
});

export function useFormularioDoFornecedor() {
  const router = useRouter();
  const arquivo = useArquivoDoContrato();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<FornecedorDoCasamento | null>(null);
  const [form, setForm] = useState<FormularioDoFornecedor>(FORMULARIO_VAZIO);
  const [loading, setLoading] = useState(false);

  const abrir = (fornecedor: FornecedorDoCasamento | null) => {
    setEditando(fornecedor);
    setForm(fornecedor ? formularioDe(fornecedor) : FORMULARIO_VAZIO);
    arquivo.limpar();
    setAberto(true);
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(editando ? "Salvando as mudanças..." : "Adicionando o fornecedor...");
    const formData = new FormData();
    for (const campo of ["name", "category", "contact", "notes"] as const) formData.set(campo, form[campo]);
    // Arquivo novo vale mais que o link; sem nenhum dos dois, mantém o contrato que já estava salvo
    const contract = arquivo.base64 || form.contractUrl || (editando?.contractUrl ?? "");
    if (contract) formData.set("contractUrl", contract);
    const res = editando ? await atualizarFornecedor(editando.id, formData) : await criarFornecedor(formData);
    if (res.success) {
      toast.success(editando ? "Fornecedor atualizado." : "Fornecedor adicionado.", { id: toastId });
      setAberto(false);
      router.refresh();
    } else toast.error(res.error || "Não deu para salvar o fornecedor. Tente de novo.", { id: toastId });
    setLoading(false);
  };

  return { aberto, setAberto, editando, form, setForm, loading, arquivo, abrir, enviar };
}

export type FormularioAberto = ReturnType<typeof useFormularioDoFornecedor>;
