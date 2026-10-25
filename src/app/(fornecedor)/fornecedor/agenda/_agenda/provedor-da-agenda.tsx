"use client";
// Os botões do topo e o calendário abrem o mesmo formulário.
import { createContext, useContext, useState } from "react";
import { CalendarPlus, CalendarX2 } from "lucide-react";
import type { TipoDeEventoDoFornecedor } from "../../../_lib/vendor-panel";
import { FormularioDoEvento, type PedidoDoFormulario } from "./formulario-do-evento";
import { JanelaDaAgenda } from "./janela-da-agenda";
import { ESTILO_DO_BOTAO_PRIMARIO, ESTILO_DO_BOTAO_SECUNDARIO, type OpcaoDePedido } from "./tipos";

const ContextoDaAgenda = createContext<{ openForm: (kind: TipoDeEventoDoFornecedor, date?: string) => void } | null>(null);

export function useAgenda() {
  const ctx = useContext(ContextoDaAgenda);
  if (!ctx) throw new Error("useAgenda precisa do AgendaProvider.");
  return ctx;
}

export function ProvedorDaAgenda({ todayIso, leads, children }: { todayIso: string; leads: OpcaoDePedido[]; children: React.ReactNode }) {
  const [request, setRequest] = useState<PedidoDoFormulario | null>(null);
  return (
    <ContextoDaAgenda.Provider value={{ openForm: (kind, date) => setRequest({ kind, date: date ?? todayIso }) }}>
      {children}
      <JanelaDaAgenda open={request !== null} onClose={() => setRequest(null)} title={request?.kind === "BLOCKED" ? "Bloquear data" : "Nova reunião"}>
        {request ? <FormularioDoEvento key={`${request.kind}-${request.date}`} request={request} leads={leads} onDone={() => setRequest(null)} /> : null}
      </JanelaDaAgenda>
    </ContextoDaAgenda.Provider>
  );
}

export function BotaoDeNovoEvento({ kind }: { kind: TipoDeEventoDoFornecedor }) {
  const { openForm } = useAgenda();
  const Icon = kind === "BLOCKED" ? CalendarX2 : CalendarPlus;
  return (
    <button type="button" onClick={() => openForm(kind)} className={kind === "BLOCKED" ? ESTILO_DO_BOTAO_SECUNDARIO : ESTILO_DO_BOTAO_PRIMARIO}>
      <Icon aria-hidden="true" className="size-[18px]" />
      {kind === "BLOCKED" ? "Bloquear data" : "Nova reunião"}
    </button>
  );
}
