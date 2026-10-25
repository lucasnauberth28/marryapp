// O botão de ação de cada pagamento: confirmar o Pix (a conferir) ou agradecer (recebido).
import { CheckCircle2, Heart } from "lucide-react";
import type { TransacaoComPresente } from "@/actions/finance-actions";
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
        <Botao size="sm" onClick={() => acoes.confirmarPix(tx.id, tx.gift.id)} loading={acoes.pendente && acoes.aprovandoId === tx.id} disabled={acoes.pendente} className="h-11 rounded-xl bg-sucesso px-4 text-sm font-semibold text-white shadow-sm hover:bg-sucesso/90 disabled:opacity-50 sm:h-9">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Confirmar
        </Botao>
      ) : tx.status === "APPROVED" ? (
        <BotaoDeAgradecer tx={tx} acoes={acoes} />
      ) : (
        <span className="text-tinta-suave text-xs">—</span>
      )}
    </div>
  );
}
