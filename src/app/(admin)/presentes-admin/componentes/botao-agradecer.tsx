"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { alternarAgradecimentoEnviado } from "@/actions/financas/transacoes";
import { Botao } from "@/components/ui/button";
import { somenteDigitos } from "@/lib/formatacao/telefone";
import type { PagamentoDoPresente } from "./tipos";

/** Abre a conversa do WhatsApp com a mensagem de agradecimento já escrita. */
function abrirAgradecimentoNoWhatsapp(p: PagamentoDoPresente) {
  const primeiroNome = p.from.split(" ")[0] || "Querido(a)";
  const texto = encodeURIComponent(`Oi, ${primeiroNome}! Passando para agradecer pelo presente (${p.giftTitle}). Foi muito especial para nós. Obrigado de coração!`);
  window.open(`https://wa.me/55${somenteDigitos(p.phone)}?text=${texto}`, "_blank");
}

/** "Agradecer": abre o WhatsApp com o texto pronto e marca como agradecido; tocar de novo desmarca. */
export function BotaoAgradecer({ pagamento }: { pagamento: PagamentoDoPresente }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState("");
  const agradecido = pagamento.thankYouSent;

  const alternar = () =>
    iniciar(async () => {
      setErro("");
      const res = await alternarAgradecimentoEnviado(pagamento.id, agradecido);
      if (!res.success) return setErro(res.error || "Não deu para atualizar o agradecimento. Tente de novo.");
      if (!agradecido && pagamento.phone) abrirAgradecimentoNoWhatsapp(pagamento);
      router.refresh();
    });

  return (
    <div className="flex flex-col items-start gap-1">
      <Botao size="sm" variant={agradecido ? "secondary" : "outline"} onClick={alternar} loading={pendente} aria-label={`${agradecido ? "Desmarcar agradecimento a" : "Agradecer a"} ${pagamento.from}`} className="h-11 rounded-xl px-4 text-sm font-semibold sm:h-9">
        <Heart className={`mr-1 size-3.5 ${agradecido ? "fill-ameixa text-ameixa" : ""}`} aria-hidden="true" />
        {agradecido ? "Agradecido" : "Agradecer"}
      </Botao>
      {erro ? (
        <p role="alert" className="text-xs font-semibold text-perigo">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
