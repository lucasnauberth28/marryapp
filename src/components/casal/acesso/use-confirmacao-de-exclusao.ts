import { useState } from "react";

/** Guarda a exclusão pedida e só a executa quando a pessoa confirma na janela. */
export function useConfirmacaoDeExclusao() {
  const [aberto, setAberto] = useState(false);
  const [acao, setAcao] = useState<(() => void) | null>(null);

  const pedir = (executar: () => void) => {
    setAcao(() => executar);
    setAberto(true);
  };
  const confirmar = () => {
    setAberto(false);
    acao?.();
  };

  return { aberto, fechar: () => setAberto(false), pedir, confirmar };
}
