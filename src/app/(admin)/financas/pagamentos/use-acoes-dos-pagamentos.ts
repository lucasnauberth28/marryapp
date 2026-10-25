// Ações sobre um pagamento de presente: confirmar o Pix e marcar/desmarcar o agradecimento (abrindo o WhatsApp).
import { useState, useTransition } from "react";
import { alternarAgradecimentoEnviado, aprovarTransacaoPix } from "@/actions/finance-actions";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import type { AvisoDaTabela } from "./aviso-temporario";

const TEMPO_DO_AVISO_EM_MS = 4000;

interface DadosDoAgradecimento {
  idDaTransacao: string;
  jaAgradecido: boolean;
  telefone?: string | null;
  nomeDoConvidado?: string | null;
  presente?: string | null;
}

/** Abre a conversa do WhatsApp com a mensagem de agradecimento já escrita. */
function abrirAgradecimentoNoWhatsapp(d: DadosDoAgradecimento) {
  const primeiroNome = d.nomeDoConvidado ? d.nomeDoConvidado.split(" ")[0] : "Querido(a)";
  const texto = encodeURIComponent(`Oi, ${primeiroNome}! Passando para agradecer pelo presente (${d.presente}). Foi muito especial para nós. Obrigado de coração!`);
  window.open(`https://wa.me/55${somenteDigitos(d.telefone)}?text=${texto}`, "_blank");
}

export function useAcoesDosPagamentos() {
  const [pendente, iniciarTransicao] = useTransition();
  const [aprovandoId, setAprovandoId] = useState<string | null>(null);
  const [agradecendoId, setAgradecendoId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<AvisoDaTabela | null>(null);

  const mostrarAviso = (novo: AvisoDaTabela) => {
    setAviso(novo);
    setTimeout(() => setAviso(null), TEMPO_DO_AVISO_EM_MS);
  };

  const confirmarPix = (idDaTransacao: string, idDoPresente: string) => {
    setAprovandoId(idDaTransacao);
    iniciarTransicao(async () => {
      const resultado = await aprovarTransacaoPix(idDaTransacao, idDoPresente);
      mostrarAviso(resultado.success ? { message: "Pix confirmado. O presente foi marcado como pago.", type: "success" } : { message: resultado.error || "Não deu para confirmar o Pix. Tente de novo.", type: "error" });
      setAprovandoId(null);
    });
  };

  const alternarAgradecimento = (dados: DadosDoAgradecimento) => {
    setAgradecendoId(dados.idDaTransacao);
    iniciarTransicao(async () => {
      const resultado = await alternarAgradecimentoEnviado(dados.idDaTransacao, dados.jaAgradecido);
      if (!resultado.success) mostrarAviso({ message: resultado.error || "Não deu para atualizar o agradecimento. Tente de novo.", type: "error" });
      else if (!dados.jaAgradecido && dados.telefone) {
        abrirAgradecimentoNoWhatsapp(dados);
        mostrarAviso({ message: "Mensagem de agradecimento preparada no WhatsApp. Falta enviar por lá.", type: "success" });
      } else mostrarAviso({ message: dados.jaAgradecido ? "Agradecimento desmarcado." : "Marcado como agradecido.", type: "success" });
      setAgradecendoId(null);
    });
  };

  return { pendente, aprovandoId, agradecendoId, aviso, fecharAviso: () => setAviso(null), confirmarPix, alternarAgradecimento };
}

export type AcoesDosPagamentos = ReturnType<typeof useAcoesDosPagamentos>;
