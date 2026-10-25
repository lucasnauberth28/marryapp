// Passos 1 e 2 do cadastro: o tipo da despesa e os detalhes (descrição, origem, forma de pagamento, foto).
import { useState } from "react";
import { toast } from "sonner";
import type { TipoDeDespesa } from "./tipos";

const TAMANHO_MAXIMO_DA_FOTO = 5 * 1024 * 1024;

export function useDadosDaDespesa() {
  const [tipo, setTipo] = useState<TipoDeDespesa>("CONTRACT");
  const [descricao, setDescricao] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [loja, setLoja] = useState("");
  const [link, setLink] = useState("");
  const [formaDePagamento, setFormaDePagamento] = useState("pix_balance");
  const [formaPersonalizada, setFormaPersonalizada] = useState("");
  const [imagem, setImagem] = useState("");
  const [nomeDaImagem, setNomeDaImagem] = useState("");

  const aoEscolherImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (arquivo.size > TAMANHO_MAXIMO_DA_FOTO) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }
    const leitor = new FileReader();
    leitor.onload = (evento) => {
      setImagem(evento.target?.result as string);
      setNomeDaImagem(arquivo.name);
    };
    leitor.readAsDataURL(arquivo);
  };

  const reiniciar = () => {
    setTipo("CONTRACT");
    setDescricao("");
    setFornecedorId("");
    setLoja("");
    setLink("");
    setFormaDePagamento("pix_balance");
    setFormaPersonalizada("");
    setImagem("");
    setNomeDaImagem("");
  };

  return {
    tipo, setTipo, descricao, setDescricao, fornecedorId, setFornecedorId, loja, setLoja, link, setLink,
    formaDePagamento, setFormaDePagamento, formaPersonalizada, imagem, setImagem, nomeDaImagem,
    aoEscolherImagem, reiniciar,
  };
}

export type DadosDaDespesa = ReturnType<typeof useDadosDaDespesa>;
