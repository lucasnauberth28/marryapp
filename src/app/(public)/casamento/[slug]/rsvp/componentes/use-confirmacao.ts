// O fluxo de confirmação de presença: achar o convite pelo WhatsApp e responder (com acompanhantes e restrições).
import { useState } from "react";
import { acharConvidadoPeloTelefone, confirmarPresencaPublica } from "@/actions/convidados/rsvp";
import { lembrarConvidado } from "@/lib/convidados/use-saved-guest";
import { mensagemDaBusca } from "@/lib/convidados/rsvp-lookup";
import type { ConvidadoDaConfirmacao, RespostaDoConvite } from "./tipos";

function useAcompanhantes() {
  const [count, setCount] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const [dietary, setDietary] = useState("");
  const mudarNome = (index: number, val: string) => setNames((atual) => atual.map((n, i) => (i === index ? val : n)));
  const iniciar = (found: ConvidadoDaConfirmacao) => {
    setCount(0);
    setNames(Array(found.allowedCompanions).fill(""));
    setDietary(found.dietaryRestrictions || "");
  };
  return { count, setCount, names, mudarNome, dietary, setDietary, iniciar };
}

export function useConfirmacao(slug: string) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState<ConvidadoDaConfirmacao | null>(null);
  const [submitLoading, setSubmitLoading] = useState<RespostaDoConvite | null>(null);
  const [successStatus, setSuccessStatus] = useState<RespostaDoConvite | null>(null);
  const acompanhantes = useAcompanhantes();

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGuest(null);
    setLoading(true);
    try {
      const result = await acharConvidadoPeloTelefone(slug, phone);
      if (result.status === "found") {
        setGuest(result.guest);
        acompanhantes.iniciar(result.guest);
      } else setError(mensagemDaBusca(result) ?? ""); // cada situação tem a sua mensagem: limite de tentativas não é "convite não encontrado"
    } catch {
      setError("Não conseguimos buscar o convite agora. Tente de novo em instantes.");
    } finally {
      setLoading(false);
    }
  };

  const confirmar = async (status: RespostaDoConvite) => {
    if (!guest) return;
    setSubmitLoading(status);
    setError("");
    // Une os nomes preenchidos dos acompanhantes ativos
    const nomes = acompanhantes.names.slice(0, acompanhantes.count).filter((n) => n.trim() !== "").join(", ");
    try {
      const res = await confirmarPresencaPublica(slug, guest.id, status, status === "CONFIRMED" ? acompanhantes.count : 0, status === "CONFIRMED" ? nomes : "", acompanhantes.dietary);
      if (res.success) {
        // Quem respondeu ao convite não precisa digitar nome e WhatsApp de novo se for dar um presente (só nesta aba).
        lembrarConvidado(slug, { name: guest.name, phone });
        setSuccessStatus(status);
      } else setError(res.error || "Não conseguimos salvar a sua resposta. Tente de novo.");
    } catch {
      setError("Sem conexão com o servidor. Confira a internet e tente de novo.");
    } finally {
      setSubmitLoading(null);
    }
  };

  const stage = successStatus ?? (guest ? "convite" : "busca");
  return { phone, setPhone, loading, error, guest, submitLoading, stage, voltarAoConvite: () => setSuccessStatus(null), acompanhantes, buscar, confirmar };
}

export type Confirmacao = ReturnType<typeof useConfirmacao>;
