// O passo a passo da entrada: ler o convite, conferir quem é e registrar a chegada.
import { useState } from "react";
import { registrarEntradaDoConvidado } from "@/actions/convidados/entrada";
import { buscarConvidadoParaEntrada, type InformacoesDoConvidadoNaEntrada } from "../lookup-actions";
import type { EtapaDoFluxo, MensagemDaEntrada } from "./tipos";

export function useFluxoDaEntrada(chegaramInicial: number) {
  const [stage, setStage] = useState<EtapaDoFluxo>("idle");
  const [arrived, setArrived] = useState(chegaramInicial);
  const [found, setFound] = useState<InformacoesDoConvidadoNaEntrada | null>(null);
  const [message, setMessage] = useState<MensagemDaEntrada | null>(null);
  const [confirming, setConfirming] = useState(false);

  const voltar = (mensagem: MensagemDaEntrada | null = null) => {
    setMessage(mensagem);
    setFound(null);
    setStage("idle");
  };
  const mostrarConvidado = (convidado: InformacoesDoConvidadoNaEntrada) => {
    setFound(convidado);
    setMessage(null);
    setStage("found");
  };

  const aoLerCodigo = async (text: string) => {
    if (!text.startsWith("GUEST:")) return voltar({ ok: false, text: "Esse código QR não é de um convite do Aceito." });
    setStage("loading");
    try {
      const res = await buscarConvidadoParaEntrada(text.replace("GUEST:", ""));
      if (res.success) mostrarConvidado(res.guest);
      else voltar({ ok: false, text: res.error });
    } catch {
      voltar({ ok: false, text: "Não deu para conferir o convite. Verifique a internet e tente de novo." });
    }
  };

  const confirmarEntrada = async () => {
    if (!found) return;
    setConfirming(true);
    try {
      const res = await registrarEntradaDoConvidado(found.id);
      if (res.success) setArrived((n) => n + 1);
      setMessage(res.success ? { ok: true, text: `Entrada registrada: ${res.guestName}.` } : { ok: false, text: res.error || "Não deu para registrar a entrada. Tente de novo." });
    } catch {
      setMessage({ ok: false, text: "Não deu para registrar a entrada. Verifique a internet e tente de novo." });
    }
    setConfirming(false);
    setFound(null);
    setStage("idle");
  };

  return { stage, arrived, found, message, confirming, setStage, setMessage, voltar, mostrarConvidado, aoLerCodigo, confirmarEntrada };
}

export type FluxoDaEntrada = ReturnType<typeof useFluxoDaEntrada>;
