// Ações sobre as despesas já cadastradas: marcar a parcela como paga ou pendente e excluir (com confirmação).
import { useState } from "react";
import { toast } from "sonner";
import { atualizarSituacaoDaDespesa, excluirDespesa } from "@/actions/expense-actions";
import type { SituacaoDaDespesa } from "@/types/local";
import type { ItemDeDespesa } from "./tipos";

export function useAcoesDasDespesas(despesas: ItemDeDespesa[], definirDespesas: (novas: ItemDeDespesa[]) => void) {
  // Parcelas cuja situação está sendo trocada: o chip fica esmaecido e sem clique até a resposta chegar
  const [alternando, setAlternando] = useState<Record<string, true>>({});
  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false);
  const [acaoConfirmada, setAcaoConfirmada] = useState<(() => void) | null>(null);

  const alternarSituacao = async (id: string, situacaoAtual: string) => {
    if (alternando[id]) return;
    const nova = situacaoAtual === "PAID" ? "PENDING" : "PAID";
    setAlternando((prev) => ({ ...prev, [id]: true }));
    const resposta = await atualizarSituacaoDaDespesa(id, nova as SituacaoDaDespesa).finally(() =>
      setAlternando((prev) => {
        const resto = { ...prev };
        delete resto[id];
        return resto;
      }),
    );
    if (!resposta.success) {
      toast.error(resposta.error || "Não deu para atualizar a despesa. Tente de novo.");
      return;
    }
    definirDespesas(despesas.map((e) => (e.id === id ? { ...e, status: nova } : e)));
    toast.success(nova === "PAID" ? "Parcela marcada como paga." : "Parcela marcada como pendente.");
  };

  const pedirExclusao = (id: string) => {
    setAcaoConfirmada(() => async () => {
      const idDoAviso = toast.loading("Excluindo despesa...");
      const resposta = await excluirDespesa(id);
      if (resposta.success) {
        definirDespesas(despesas.filter((e) => e.id !== id));
        toast.success("Despesa excluída.", { id: idDoAviso });
      } else {
        toast.error(resposta.error || "Não deu para excluir a despesa. Tente de novo.", { id: idDoAviso, duration: 6000 });
      }
    });
    setConfirmacaoAberta(true);
  };

  const confirmarExclusao = () => {
    setConfirmacaoAberta(false);
    acaoConfirmada?.();
  };

  return { alternando, alternarSituacao, pedirExclusao, confirmacaoAberta, fecharConfirmacao: () => setConfirmacaoAberta(false), confirmarExclusao };
}

export type AcoesDasDespesas = ReturnType<typeof useAcoesDasDespesas>;
