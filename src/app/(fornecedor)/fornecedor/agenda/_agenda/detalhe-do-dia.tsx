"use client";
import Link from "next/link";
import { CalendarPlus, CalendarX2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarHoraDoPainel } from "../../../_lib/datas-do-painel";
import { type TipoDeEventoDoFornecedor } from "../../../_lib/pedidos";
import { BotaoDeExcluirEvento } from "./botao-de-excluir-evento";
import { PILULA_DO_CALENDARIO } from "./cores-do-calendario";
import { ESTILO_DO_BOTAO_DISCRETO, ESTILO_DO_BOTAO_PRIMARIO, ESTILO_DO_BOTAO_SECUNDARIO, type ItemDoDia } from "./tipos";

function tituloDoItem(item: ItemDoDia) {
  if (item.type === "WEDDING") return `Casamento de ${item.title}`;
  if (item.type === "BLOCKED") return "Data bloqueada";
  return `${item.title}${item.time ? ` · ${formatarHoraDoPainel(item.time)}` : ""}`;
}

function ItemDoDetalhe({ item, aoExcluir }: { item: ItemDoDia; aoExcluir: () => void }) {
  return (
    <li className="flex flex-col gap-1 rounded-xl border border-linha p-3">
      <span className="flex items-start gap-2">
        <span aria-hidden="true" className={cn("mt-1.5 size-3 shrink-0 rounded", PILULA_DO_CALENDARIO[item.type])} />
        <span className="flex min-w-0 flex-col">
          <strong className="font-semibold break-words">{tituloDoItem(item)}</strong>
          {item.type === "WEDDING" && item.location ? <span className="text-sm text-tinta-suave">{item.location}</span> : null}
          {item.type === "BLOCKED" && item.title !== "Data bloqueada" ? <span className="text-sm text-tinta-suave">{item.title}</span> : null}
          {item.type === "MEETING" && item.notes ? <span className="text-sm whitespace-pre-line break-words text-tinta-suave">{item.notes}</span> : null}
        </span>
      </span>
      <span className="flex flex-wrap gap-1">
        {item.type === "WEDDING" || item.leadId ? (
          <Link href={`/fornecedor/pedidos/${item.type === "WEDDING" ? item.id : item.leadId}`} className={cn(ESTILO_DO_BOTAO_DISCRETO, "px-3 text-sm text-ameixa")}>
            Ver pedido
          </Link>
        ) : null}
        {item.type !== "WEDDING" ? <BotaoDeExcluirEvento eventId={item.id} label={item.type === "BLOCKED" ? "Desbloquear" : "Excluir"} onDeleted={aoExcluir} /> : null}
      </span>
    </li>
  );
}

interface PropriedadesDoDetalhe {
  itens: ItemDoDia[];
  aoExcluir: () => void;
  aoNovo: (kind: TipoDeEventoDoFornecedor) => void;
}

/** O que há no dia tocado e as ações de marcar reunião ou bloquear a data. */
export function DetalheDoDia({ itens, aoExcluir, aoNovo }: PropriedadesDoDetalhe) {
  const bloqueado = itens.some((i) => i.type === "BLOCKED");
  return (
    <>
      {itens.length === 0 ? (
        <p className="text-tinta-suave">Nenhum compromisso neste dia.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {itens.map((item) => (
            <ItemDoDetalhe key={`${item.type}-${item.id}`} item={item} aoExcluir={aoExcluir} />
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 border-t border-linha pt-4">
        <button type="button" onClick={() => aoNovo("MEETING")} className={ESTILO_DO_BOTAO_PRIMARIO}>
          <CalendarPlus aria-hidden="true" className="size-[18px]" />
          Nova reunião neste dia
        </button>
        {!bloqueado ? (
          <button type="button" onClick={() => aoNovo("BLOCKED")} className={ESTILO_DO_BOTAO_SECUNDARIO}>
            <CalendarX2 aria-hidden="true" className="size-[18px]" />
            Bloquear este dia
          </button>
        ) : null}
      </div>
    </>
  );
}
