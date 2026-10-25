// Presentes e dinheiro no Resumo: um extrato só (recebido bruto, taxa do Aceito, líquido e a conferir).
import { Check, Clock } from "lucide-react";
import { formatarReaisDeSaida, formatarReaisSemSinal } from "@/lib/resumo/dinheiro";
import type { ExtratoDePresentes, LinhaDePresente } from "@/lib/resumo/presentes";
import { pluralizar } from "@/lib/formatacao/plural";
import type { PlanoDaTaxaDoPresente } from "@/lib/pagamento/gift-fee";
import { BlocoDoPainel, Etiqueta, LinkDeTexto, ValorEmDinheiro, classeDaDica, classeDoRotulo } from "../../ui";
import { Extrato, LinhaDoExtrato, notaDaTaxa } from "./extrato";
import { SemPresentesRecebidos } from "./sem-presentes";
import { TabelaDePresentes } from "./tabela-de-presentes";

function LinhaDoQueFalta({ statement }: { statement: ExtratoDePresentes }) {
  const aConferir = statement.toCheckCount > 0;
  return (
    <LinhaDoExtrato
      tone="conferir"
      term={
        aConferir ? (
          <>
            <Etiqueta tone="aviso" icon={Clock}>
              A conferir
            </Etiqueta>
            Pix que vocês ainda não conferiram
          </>
        ) : (
          <Etiqueta tone="ok" icon={Check}>
            Tudo conferido
          </Etiqueta>
        )
      }
      meta={aConferir ? `${statement.toCheckCount} Pix` : undefined}
      value={formatarReaisSemSinal(statement.toCheckCents)}
    />
  );
}

function ExtratoDosPresentes({ statement, plan }: { statement: ExtratoDePresentes; plan: PlanoDaTaxaDoPresente }) {
  return (
    <Extrato
      label="Extrato dos presentes"
      rows={
        <>
          <LinhaDoExtrato term="Recebido (bruto)" note="O que os convidados pagaram" meta={pluralizar(statement.approvedCount, "presente", "presentes")} value={formatarReaisSemSinal(statement.grossCents)} />
          <LinhaDoExtrato term="Taxa do Aceito" note={notaDaTaxa(plan)} value={statement.feeCents > 0 ? formatarReaisDeSaida(statement.feeCents) : formatarReaisSemSinal(0)} tone="saida" />
          <LinhaDoExtrato term="Líquido para vocês" value={formatarReaisSemSinal(statement.netCents)} total />
          <LinhaDoQueFalta statement={statement} />
        </>
      }
    />
  );
}

interface PropriedadesDoBlocoDeDinheiro {
  statement: ExtratoDePresentes;
  lines: LinhaDePresente[];
  plan: PlanoDaTaxaDoPresente;
  giftCount: number;
  canOpenGifts: boolean;
  /** O perfil abre as Configurações (onde fica "Onde receber"). */
  canReceive: boolean;
  /** O perfil confere Pix (mesma permissão de Finanças). */
  canConfer: boolean;
  className?: string;
}

export function BlocoDeDinheiro({ statement, lines, plan, giftCount, canOpenGifts, canReceive, canConfer, className = "" }: PropriedadesDoBlocoDeDinheiro) {
  const empty = statement.approvedCount === 0 && statement.toCheckCount === 0;
  const aside = (
    <>
      {canReceive && <LinkDeTexto href="/configuracoes/recebimento">Onde receber</LinkDeTexto>}
      {canOpenGifts && !empty && <LinkDeTexto href="/presentes-admin">Ver presentes</LinkDeTexto>}
    </>
  );
  return (
    <BlocoDoPainel id="dinheiro" title="Presentes e dinheiro" aside={aside} className={className}>
      {empty ? (
        <SemPresentesRecebidos plan={plan} giftCount={giftCount} canOpenGifts={canOpenGifts} />
      ) : (
        <>
          <div className="grid gap-1">
            <span className={classeDoRotulo}>Líquido para vocês</span>
            <ValorEmDinheiro cents={statement.netCents} className="text-[36px] leading-[1.1]" />
            <span className={classeDaDica}>
              {statement.approvedCount === 0
                ? "Nenhum presente conferido ainda"
                : `${pluralizar(statement.approvedCount, "presente recebido", "presentes recebidos")} · ${statement.pixCount} por Pix e ${statement.cardCount} por cartão`}
            </span>
          </div>
          <ExtratoDosPresentes statement={statement} plan={plan} />
          <p className={classeDaDica}>Um Pix a conferir entra no recebido quando vocês confirmam que ele caiu na conta.</p>
          {lines.length > 0 && <TabelaDePresentes lines={lines} canConfer={canConfer} />}
        </>
      )}
    </BlocoDoPainel>
  );
}
