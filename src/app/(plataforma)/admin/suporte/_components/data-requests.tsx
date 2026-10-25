"use client";

import { useState } from "react";
import { AlertTriangle, Plus, ShieldCheck } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao } from "@/components/plataforma/status-chip";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { estiloDoBotao } from "@/components/landing/styles";
import { ROTULO_DO_TIPO_DE_SOLICITACAO_DE_DADOS } from "@/lib/platform/support";
import { NovaSolicitacao } from "../_dados/nova-solicitacao";
import { SITUACAO_DO_ITEM, type ItemDeSolicitacaoDeDados } from "../_dados/tipos";
import { TratarSolicitacao } from "../_dados/tratar-solicitacao";

export type { ItemDeSolicitacaoDeDados };

function ItemDaSolicitacao({ r, aberto, aoAlternar }: { r: ItemDeSolicitacaoDeDados; aberto: boolean; aoAlternar: () => void }) {
  const s = SITUACAO_DO_ITEM[r.status];
  return (
    <li>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-5 text-tinta">
            {ROTULO_DO_TIPO_DE_SOLICITACAO_DE_DADOS[r.type]} · {r.requesterName}
          </p>
          <p className="text-sm leading-5 text-tinta-suave">
            Pedido em {r.receivedLabel} · prazo {r.dueLabel}
            {r.linked ? "" : " · sem conta ligada"}
          </p>
          {r.dueText && <p className={r.dueTone === "perigo" ? "text-sm font-semibold leading-5 text-perigo" : "text-sm leading-5 text-tinta-suave"}>{r.dueText}</p>}
        </div>
        <div className="flex items-center gap-2">
          <EtiquetaDeSituacao tone={s.tone} icon={s.icon}>
            {s.label}
          </EtiquetaDeSituacao>
          <button type="button" aria-expanded={aberto} onClick={aoAlternar} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm}`}>
            {aberto ? "Fechar" : "Atender"}
          </button>
        </div>
      </div>
      {aberto && <TratarSolicitacao item={r} onDone={aoAlternar} />}
    </li>
  );
}

export function SolicitacoesDeDados({ rows, urgent }: { rows: ItemDeSolicitacaoDeDados[]; urgent: string | null }) {
  const [formOpen, setFormOpen] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Painel
      title="Pedidos sobre dados pessoais"
      aside={
        <div className="flex flex-wrap items-center gap-2">
          {urgent && (
            <EtiquetaDeSituacao tone="perigo" icon={AlertTriangle}>
              {urgent}
            </EtiquetaDeSituacao>
          )}
          {!formOpen && (
            <button type="button" onClick={() => setFormOpen(true)} className={`${estiloDoBotao.secondary} ${estiloDoBotao.sm}`}>
              <Plus className="size-4" aria-hidden="true" /> Registrar pedido
            </button>
          )}
        </div>
      }
    >
      {formOpen && <NovaSolicitacao onDone={() => setFormOpen(false)} />}
      {rows.length === 0 ? (
        <EstadoVazio icon={ShieldCheck} compact title="Nenhum pedido de titular registrado">
          Pedidos de exportação, exclusão ou correção de dados chegam por e-mail ou WhatsApp: registre aqui para acompanhar o prazo. O que a própria pessoa faz em Minha conta não aparece nesta lista.
        </EstadoVazio>
      ) : (
        <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
          {rows.map((r) => (
            <ItemDaSolicitacao key={r.id} r={r} aberto={open === r.id} aoAlternar={() => setOpen(open === r.id ? null : r.id)} />
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-tinta-suave">Exportação e exclusão têm prazo de 15 dias para responder. Confirme o prazo com o jurídico.</p>
    </Painel>
  );
}
