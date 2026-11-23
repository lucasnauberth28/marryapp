// A escolha de quem recebe uma mensagem: um grupo ou pessoas escolhidas, e a busca na lista.
import { useMemo, useState } from "react";
import type { Guest } from "@prisma/client";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import type { Publico } from "./tipos";
import { idsPara } from "./utilitarios";

const GRUPOS: Exclude<Publico, "custom">[] = ["pending", "unsent", "confirmed", "all"];

export function useEnvioDaMensagem(convidados: Guest[]) {
  const contagens = useMemo(() => Object.fromEntries(GRUPOS.map((g) => [g, idsPara(g, convidados).length])) as Record<Exclude<Publico, "custom">, number>, [convidados]);
  const primeiroGrupo: Publico = contagens.pending > 0 ? "pending" : "all";
  const [publico, setPublico] = useState<Publico>(primeiroGrupo);
  const [escolhidos, setEscolhidos] = useState<string[]>(() => idsPara(primeiroGrupo, convidados));
  const [busca, setBusca] = useState("");

  const exibidos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return convidados;
    const digitos = somenteDigitos(q);
    return convidados.filter((g) => g.name.toLowerCase().includes(q) || (digitos.length >= 3 && !!g.phone && somenteDigitos(g.phone).includes(digitos)));
  }, [convidados, busca]);

  const mudarPublico = (proximo: Publico) => {
    setPublico(proximo);
    if (proximo !== "custom") setEscolhidos(idsPara(proximo, convidados));
  };

  const alternarConvidado = (id: string) => {
    setPublico("custom");
    setEscolhidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const exemplo = convidados.find((g) => g.id === escolhidos[0])?.name ?? convidados[0]?.name ?? "Nome do convidado";
  return { contagens, publico, mudarPublico, escolhidos, alternarConvidado, busca, setBusca, exibidos, primeiroNomeDoExemplo: exemplo.split(" ")[0] };
}

export type EnvioDaMensagem = ReturnType<typeof useEnvioDaMensagem>;
