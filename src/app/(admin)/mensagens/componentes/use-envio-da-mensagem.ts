// O envio de uma mensagem: para quem vai (grupo ou pessoas escolhidas), a busca na lista e o resultado.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Guest } from "@prisma/client";
import { toast } from "sonner";
import { enviarModeloAosConvidados } from "@/actions/mensagens/envio";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import type { ModeloDeMensagem, Publico } from "./tipos";
import { idsPara } from "./utilitarios";

const GRUPOS: Exclude<Publico, "custom">[] = ["pending", "unsent", "confirmed", "all"];

export function useEnvioDaMensagem(modelo: ModeloDeMensagem, convidados: Guest[]) {
  const router = useRouter();
  const contagens = useMemo(() => Object.fromEntries(GRUPOS.map((g) => [g, idsPara(g, convidados).length])) as Record<Exclude<Publico, "custom">, number>, [convidados]);
  const primeiroGrupo: Publico = contagens.pending > 0 ? "pending" : "all";
  const [publico, setPublico] = useState<Publico>(primeiroGrupo);
  const [escolhidos, setEscolhidos] = useState<string[]>(() => idsPara(primeiroGrupo, convidados));
  const [busca, setBusca] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; text: string } | null>(null);

  const exibidos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return convidados;
    const digitos = somenteDigitos(q);
    return convidados.filter((g) => g.name.toLowerCase().includes(q) || (digitos.length >= 3 && !!g.phone && somenteDigitos(g.phone).includes(digitos)));
  }, [convidados, busca]);

  const mudarPublico = (proximo: Publico) => {
    setPublico(proximo);
    if (proximo !== "custom") setEscolhidos(idsPara(proximo, convidados));
    setResultado(null);
  };

  const alternarConvidado = (id: string) => {
    setPublico("custom");
    setEscolhidos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setResultado(null);
  };

  const enviar = async () => {
    if (escolhidos.length === 0) return;
    setEnviando(true);
    setResultado(null);
    const idDoAviso = toast.loading(`Enviando para ${escolhidos.length} ${escolhidos.length === 1 ? "pessoa" : "pessoas"}...`);
    const resposta = await enviarModeloAosConvidados(modelo.id, escolhidos);
    if (resposta.success) {
      setResultado({ ok: true, text: resposta.message || "Mensagens enviadas." });
      toast.success(resposta.message || "Mensagens enviadas.", { id: idDoAviso });
      router.refresh();
    } else {
      setResultado({ ok: false, text: resposta.error || "Não deu para enviar agora. Tente de novo." });
      toast.error(resposta.error || "Não deu para enviar agora.", { id: idDoAviso });
    }
    setEnviando(false);
  };

  const exemplo = convidados.find((g) => g.id === escolhidos[0])?.name ?? convidados[0]?.name ?? "Nome do convidado";
  return { contagens, publico, mudarPublico, escolhidos, alternarConvidado, busca, setBusca, exibidos, enviando, resultado, enviar, primeiroNomeDoExemplo: exemplo.split(" ")[0] };
}

export type EnvioDaMensagem = ReturnType<typeof useEnvioDaMensagem>;
