// A busca pelo nome, para quem está sem o código QR. Respostas antigas são ignoradas.
import { useRef, useState } from "react";
import { pesquisarConvidadosParaEntrada, type InformacoesDoConvidadoNaEntrada } from "../lookup-actions";

export function useBuscaPorNome() {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<InformacoesDoConvidadoNaEntrada[] | null>(null);
  const [searching, setSearching] = useState(false);
  const sequence = useRef(0);

  const buscar = async (value: string) => {
    setQuery(value);
    const seq = ++sequence.current;
    if (value.trim().length < 2) {
      setMatches(null);
      return setSearching(false);
    }
    setSearching(true);
    try {
      const list = await pesquisarConvidadosParaEntrada(value);
      if (seq === sequence.current) setMatches(list);
    } finally {
      if (seq === sequence.current) setSearching(false);
    }
  };

  const limpar = () => {
    setQuery("");
    setMatches(null);
  };

  return { query, matches, searching, buscar, limpar };
}

export type BuscaPorNome = ReturnType<typeof useBuscaPorNome>;
