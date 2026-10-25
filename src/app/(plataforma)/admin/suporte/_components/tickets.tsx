"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Plus, Clock, CheckCircle2, MessageCircle, Lock } from "lucide-react";
import { Painel } from "@/components/plataforma/panel";
import { EtiquetaDeSituacao, type TomDaSituacao } from "@/components/plataforma/status-chip";
import { EstadoVazio } from "@/components/plataforma/empty-state";
import { estiloDoBotao } from "@/components/landing/styles";
import { ROTULO_DA_SITUACAO_DO_CHAMADO } from "@/lib/platform/support";
import { EditorDeChamado, NovoChamado } from "../_chamados/formularios";
import type { ItemDeChamado, PreenchimentoDoChamado } from "../_chamados/tipos";

export type { ItemDeChamado, PreenchimentoDoChamado };

const TONS_DA_ETIQUETA: Record<ItemDeChamado["status"], { tone: TomDaSituacao; icon: typeof Clock }> = {
  NEW: { tone: "aviso", icon: Clock },
  IN_PROGRESS: { tone: "aviso", icon: Clock },
  ANSWERED: { tone: "salvia", icon: CheckCircle2 },
  CLOSED: { tone: "neutro", icon: Lock },
};

function ItemDoChamado({ t, aberto, aoAlternar }: { t: ItemDeChamado; aberto: boolean; aoAlternar: () => void }) {
  const s = TONS_DA_ETIQUETA[t.status];
  return (
    <li>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-5 text-tinta">
            <span className="text-tinta-suave">#{t.number}</span> {t.subject}
          </p>
          <p className="text-sm leading-5 text-tinta-suave">
            {t.requesterName} · {t.whenLabel} · {t.assigneeName ? `Responsável: ${t.mine ? "você" : t.assigneeName.split(" ")[0]}` : "Sem responsável"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EtiquetaDeSituacao tone={s.tone} icon={s.icon}>
            {ROTULO_DA_SITUACAO_DO_CHAMADO[t.status]}
          </EtiquetaDeSituacao>
          <button type="button" aria-expanded={aberto} onClick={aoAlternar} className={`${estiloDoBotao.quiet} ${estiloDoBotao.sm}`}>
            {aberto ? "Fechar" : "Abrir"}
          </button>
        </div>
      </div>
      {aberto && <EditorDeChamado ticket={t} onDone={aoAlternar} />}
    </li>
  );
}

export function Chamados({ rows, newCount, closedCount, showClosed, prefill, openForm }: { rows: ItemDeChamado[]; newCount: number; closedCount: number; showClosed: boolean; prefill: PreenchimentoDoChamado | null; openForm: boolean }) {
  const [formOpen, setFormOpen] = useState(openForm);
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <Painel
      title="Pedidos de ajuda"
      aside={
        <div className="flex flex-wrap items-center gap-2">
          {newCount > 0 && (
            <EtiquetaDeSituacao tone="aviso" icon={Bell}>
              {newCount} {newCount === 1 ? "novo" : "novos"}
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
      <div id="chamados" className="scroll-mt-24" />
      {formOpen && <NovoChamado prefill={prefill} onDone={() => setFormOpen(false)} />}
      {rows.length === 0 ? (
        <EstadoVazio icon={MessageCircle} compact title={showClosed ? "Nenhum pedido registrado" : "Nenhum pedido em aberto"}>
          Não há formulário público: registre aqui os pedidos que chegarem por WhatsApp ou e-mail.
        </EstadoVazio>
      ) : (
        <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
          {rows.map((t) => (
            <ItemDoChamado key={t.id} t={t} aberto={editing === t.id} aoAlternar={() => setEditing(editing === t.id ? null : t.id)} />
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-tinta-suave">
        {showClosed ? (
          <Link href="/admin/suporte#chamados" className="font-semibold text-ameixa underline underline-offset-2">
            Esconder os encerrados
          </Link>
        ) : closedCount > 0 ? (
          <Link href="/admin/suporte?encerrados=1#chamados" className="font-semibold text-ameixa underline underline-offset-2">
            Mostrar os {closedCount} encerrados
          </Link>
        ) : null}
      </p>
    </Painel>
  );
}

