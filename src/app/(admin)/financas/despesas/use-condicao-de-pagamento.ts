// Passo 3 do cadastro: pagamento único ou parcelado em blocos (N parcelas de um valor, a partir de uma data).
import { useState } from "react";
import { toast } from "sonner";
import { BLOCO_INICIAL, hojeEmTextoIso, type BlocoDeParcelas } from "./tipos";

export function useCondicaoDePagamento() {
  const [modo, setModo] = useState<"single" | "installment">("single");
  const [valorUnico, setValorUnico] = useState("");
  const [vencimentoUnico, setVencimentoUnico] = useState(hojeEmTextoIso());
  const [blocos, setBlocos] = useState<BlocoDeParcelas[]>([BLOCO_INICIAL()]);

  /** Um novo bloco começa onde o anterior termina. */
  const adicionarBloco = () => {
    const ultimo = blocos[blocos.length - 1];
    let proximaData = new Date();
    if (ultimo?.startDate) {
      proximaData = new Date(ultimo.startDate);
      proximaData.setMonth(proximaData.getMonth() + (ultimo.count || 1));
    }
    setBlocos([...blocos, { id: Date.now(), count: 3, amount: "500", startDate: proximaData.toISOString().split("T")[0] }]);
  };

  const removerBloco = (id: number) => {
    if (blocos.length === 1) {
      toast.error("O parcelamento precisa ter ao menos um bloco.");
      return;
    }
    setBlocos(blocos.filter((b) => b.id !== id));
  };

  const atualizarBloco = (id: number, campo: keyof BlocoDeParcelas, valor: BlocoDeParcelas[keyof BlocoDeParcelas]) => {
    setBlocos(blocos.map((b) => (b.id === id ? { ...b, [campo]: valor } : b)));
  };

  const reiniciar = () => {
    setModo("single");
    setValorUnico("");
    setVencimentoUnico(hojeEmTextoIso());
    setBlocos([BLOCO_INICIAL()]);
  };

  return { modo, setModo, valorUnico, setValorUnico, vencimentoUnico, setVencimentoUnico, blocos, adicionarBloco, removerBloco, atualizarBloco, reiniciar };
}

export type CondicaoDePagamento = ReturnType<typeof useCondicaoDePagamento>;
