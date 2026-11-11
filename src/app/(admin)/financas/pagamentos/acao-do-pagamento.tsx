// A ação de cada pagamento: agradecer (recebido). Pix em confirmação espera o Mercado Pago ou a equipe do Aceito.
import { Heart } from "lucide-react";
import type { TransacaoComPresente } from "@/actions/financas/transacoes";
import { Botao } from "@/components/ui/button";
import type { AcoesDosPagamentos } from "./use-acoes-dos-pagamentos";

function BotaoDeAgradecer({ tx, acoes }: { tx: TransacaoComPresente; acoes: AcoesDosPagamentos }) {
  return (
    <Botao
      size="sm"
      variant={tx.thankYouSent ? "secondary" : "outline"}
      onClick={() => acoes.alternarAgradecimento({ idDaTransacao: tx.id, jaAgradecido: tx.thankYouSent, telefone: tx.guest?.phone, nomeDoConvidado: tx.guest?.name, presente: tx.gift.title })}
      loading={acoes.pendente && acoes.agradecendoId === tx.id}
      disabled={acoes.pendente}
      className={`h-11 rounded-xl px-4 text-sm font-semibold disabled:opacity-50 sm:h-9 ${tx.thankYouSent ? "border-transparent bg-ameixa-suave text-ameixa hover:bg-ameixa-suave" : "border-linha-forte text-tinta hover:bg-ameixa-suave"}`}
    >
      <Heart className={`w-3.5 h-3.5 mr-1 ${tx.thankYouSent ? "fill-ameixa text-ameixa" : ""}`} />
      {tx.thankYouSent ? "Agradecido" : "Agradecer"}
    </Botao>
  );
}

export function AcaoDoPagamento({ tx, acoes }: { tx: TransacaoComPresente; acoes: AcoesDosPagamentos }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {tx.status === "PENDING" && tx.paymentMethod === "PIX" ? (
        <span className="text-xs text-tinta-suave">Em confirmação</span>
      ) : tx.status === "APPROVED" ? (
        <BotaoDeAgradecer tx={tx} acoes={acoes} />
      ) : (
        <span className="text-tinta-suave text-xs">—</span>
      )}
    </div>
  );
}
