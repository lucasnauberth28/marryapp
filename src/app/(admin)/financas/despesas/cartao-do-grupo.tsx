// Cartão de uma dívida, contrato ou compra: quem é, quanto já foi pago, o próximo vencimento e as parcelas.
import { Building2, Calendar, CheckCircle, CheckCircle2, ChevronDown, ChevronUp, CreditCard, ExternalLink, ShoppingBag } from "lucide-react";
import { Etiqueta } from "@/components/casal/ui";
import { Botao } from "@/components/ui/button";
import { ImagemDaPessoa } from "@/components/ui/user-image";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { ParcelasDoGrupo } from "./parcelas-do-grupo";
import type { DespesaAgrupada } from "./tipos";
import type { AcoesDasDespesas } from "./use-acoes-das-despesas";

function Miniatura({ grupo, compra }: { grupo: DespesaAgrupada; compra: boolean }) {
  if (grupo.imageUrl) {
    return (
      <span className="relative block size-14 shrink-0 overflow-hidden rounded-xl border border-linha shadow-xs">
        <ImagemDaPessoa src={grupo.imageUrl} alt={grupo.baseDescription} sizes="56px" className="object-cover" />
      </span>
    );
  }
  return (
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${compra ? "bg-salvia-suave text-salvia border-transparent" : "bg-ameixa-suave text-ameixa border-transparent"}`}>
      {compra ? <ShoppingBag className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
    </div>
  );
}

function OrigemEPagamento({ grupo }: { grupo: DespesaAgrupada }) {
  return (
    <div className="flex items-center gap-3 text-xs text-tinta-suave flex-wrap">
      {grupo.paymentMethod && (
        <span className="inline-flex items-center gap-1 text-tinta-suave font-medium bg-areia px-2 py-0.5 rounded-md">
          <CreditCard className="w-3 h-3 text-tinta-suave" />
          {grupo.paymentMethod}
        </span>
      )}
      {grupo.purchaseUrl && (
        <a href={grupo.purchaseUrl} target="_blank" rel="noreferrer" className="text-salvia hover:underline inline-flex items-center gap-1 font-semibold">
          <ExternalLink className="w-3 h-3" /> Ver produto ou loja
        </a>
      )}
    </div>
  );
}

function ProgressoDoPagamento({ grupo, quitado, compra }: { grupo: DespesaAgrupada; quitado: boolean; compra: boolean }) {
  const percentual = Math.round((grupo.paidCount / grupo.totalCount) * 100) || 0;
  return (
    <div className="space-y-1 pt-1 max-w-md">
      <div className="flex justify-between text-xs font-medium text-tinta-suave">
        <span>{grupo.paidCount} de {grupo.totalCount} parcelas pagas ({percentual}%)</span>
        <span className="font-semibold text-tinta">{formatarReais(grupo.paidAmount)} de {formatarReais(grupo.totalAmount)}</span>
      </div>
      <div className="w-full h-2 bg-areia rounded-full overflow-hidden border border-linha/50">
        <div className={`h-full transition-all duration-500 rounded-full ${quitado ? "bg-sucesso" : compra ? "bg-salvia" : "bg-brand"}`} style={{ width: `${percentual}%` }} />
      </div>
    </div>
  );
}

function Identidade({ grupo, quitado, compra }: { grupo: DespesaAgrupada; quitado: boolean; compra: boolean }) {
  return (
    <div className="flex items-start gap-3.5 flex-1 min-w-0">
      <Miniatura grupo={grupo} compra={compra} />
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-base text-tinta truncate">{grupo.baseDescription}</h4>
          <Etiqueta tone={compra ? "salvia" : "neutro"} icon={compra ? ShoppingBag : Building2} className="min-h-6 text-[13px]">
            {compra ? `Compra: ${grupo.vendorName}` : grupo.vendorName}
          </Etiqueta>
          {quitado && <Etiqueta tone="sucesso" icon={CheckCircle2} className="min-h-6 text-[13px]">Quitado</Etiqueta>}
        </div>
        <OrigemEPagamento grupo={grupo} />
        <ProgressoDoPagamento grupo={grupo} quitado={quitado} compra={compra} />
      </div>
    </div>
  );
}

interface AcoesDoGrupoProps {
  grupo: DespesaAgrupada;
  quitado: boolean;
  expandido: boolean;
  aoExpandir: () => void;
  acoes: AcoesDasDespesas;
}

function ProximoVencimentoEAcoes({ grupo, quitado, expandido, aoExpandir, acoes }: AcoesDoGrupoProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-linha md:shrink-0 justify-between md:justify-end">
      {!quitado && grupo.nextDueDate && (
        <div className="w-full text-xs space-y-0.5 md:w-auto md:text-right">
          <span className="text-tinta-suave block">Próximo vencimento</span>
          <span className="font-bold text-aviso flex items-center gap-1 md:justify-end">
            <Calendar className="w-3.5 h-3.5 text-aviso" />
            {new Date(grupo.nextDueDate).toLocaleDateString("pt-BR")} ({formatarReais(grupo.nextDueAmount || 0)})
          </span>
        </div>
      )}
      {!quitado && grupo.nextDueExpenseId && (
        <Botao size="sm" onClick={() => acoes.alternarSituacao(grupo.nextDueExpenseId!, "PENDING")} loading={!!acoes.alternando[grupo.nextDueExpenseId]} className="h-11 rounded-xl bg-sucesso px-4 text-sm font-semibold text-white shadow-sm hover:bg-sucesso/90 sm:h-9" title="Marcar próxima parcela como paga">
          <CheckCircle className="w-3.5 h-3.5 mr-1" />
          Quitar a próxima
        </Botao>
      )}
      <Botao variant="outline" size="sm" onClick={aoExpandir} className="h-11 rounded-xl border-linha-forte px-3 text-sm font-semibold hover:bg-ameixa-suave sm:h-9">
        {expandido ? <><ChevronUp className="w-4 h-4 mr-1 text-tinta-suave" /> Fechar</> : <><ChevronDown className="w-4 h-4 mr-1 text-tinta-suave" /> Parcelas ({grupo.totalCount})</>}
      </Botao>
    </div>
  );
}

export function CartaoDoGrupo({ grupo, expandido, aoExpandir, acoes }: { grupo: DespesaAgrupada; expandido: boolean; aoExpandir: () => void; acoes: AcoesDasDespesas }) {
  const quitado = grupo.paidCount === grupo.totalCount, compra = grupo.type === "PURCHASE";
  return (
    <div className={`bg-papel border rounded-2xl shadow-[var(--shadow-aceito-1)] overflow-hidden transition-all duration-200 ${quitado ? "border-sucesso/30/80 bg-sucesso-suave/10" : "border-linha"}`}>
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Identidade grupo={grupo} quitado={quitado} compra={compra} />
        <ProximoVencimentoEAcoes grupo={grupo} quitado={quitado} expandido={expandido} aoExpandir={aoExpandir} acoes={acoes} />
      </div>
      {expandido && <ParcelasDoGrupo grupo={grupo} acoes={acoes} />}
    </div>
  );
}
