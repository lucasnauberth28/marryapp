// O contrato escolhido no aparelho (PDF ou imagem de até 8 MB), lido como texto para o envio.
import { useState } from "react";
import { toast } from "sonner";

const TAMANHO_MAXIMO_EM_BYTES = 8 * 1024 * 1024;

export function useArquivoDoContrato() {
  const [base64, setBase64] = useState("");
  const [nome, setNome] = useState("");
  // Trocar a chave refaz o campo de arquivo e limpa a escolha anterior
  const [chave, setChave] = useState(0);

  const limpar = () => {
    setBase64("");
    setNome("");
    setChave((k) => k + 1);
  };

  const aoEscolher = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > TAMANHO_MAXIMO_EM_BYTES) return void toast.error("O arquivo deve ter no máximo 8 MB.");
    const reader = new FileReader();
    reader.onload = (event) => {
      setBase64(event.target?.result as string);
      setNome(file.name);
    };
    reader.readAsDataURL(file);
  };

  return { base64, nome, chave, limpar, aoEscolher };
}

export type ArquivoDoContrato = ReturnType<typeof useArquivoDoContrato>;
