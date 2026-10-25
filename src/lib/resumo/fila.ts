// Resumo do casamento: a fila "O que fazer agora" (a sugestão da Liz primeiro, depois por importância).
import { pluralizar } from "../formatacao/plural.ts";
import { diasEntreChaves, rotuloDePessoas, rotuloDoDia } from "./datas.ts";
import type { Orcamento } from "./orcamento.ts";

export type TipoDeItemDaFila = "liz" | "pix" | "despesa" | "data" | "tarefa" | "mesas";

export interface ItemDaFila {
  id: string;
  kind: TipoDeItemDaFila;
  text: string;
  /** Botão ou link do item; sem ele o item só informa. */
  action?: { label: string; href: string };
  /** A sugestão da Liz com prazo apertado (a pose muda). */
  urgent?: boolean;
}

export interface EntradaDaFila {
  todayKey: string;
  /** Sugestão da Liz (lib/liz/tip), já decidida. */
  tip: { id: string; text: string; action: string; href: string; urgent: boolean } | null;
  pendingPix: number;
  budget: Orcamento;
  hasWeddingDate: boolean;
  /** Tarefa aberta mais próxima (por prazo), ou null. */
  task: { title: string; dueKey: string | null } | null;
  /** Pessoas confirmadas sem mesa, e se há mesas cadastradas. */
  unseatedPeople: number;
  hasTables: boolean;
  can: (path: string) => boolean;
}

const DIAS_PARA_DESPESA_PROXIMA = 10;
const DIAS_PARA_TAREFA_PROXIMA = 14;

type Podem = (path: string) => boolean;

function itemDaDespesa(input: EntradaDaFila, can: Podem): ItemDaFila | null {
  const next = input.budget.upcoming[0];
  // Quando a sugestão da Liz já é a despesa vencida, não repete
  if (!next || next.days > DIAS_PARA_DESPESA_PROXIMA || input.tip?.id === "despesa-vencida") return null;
  const what = next.detail ? `${next.name}, ${next.detail}` : next.name;
  const when = rotuloDoDia(next.dueKey, input.todayKey);
  const text =
    next.days < 0
      ? `A despesa ${what} está com o vencimento atrasado desde ${when}.`
      : next.days === 0
        ? `A despesa ${what} vence hoje.`
        : `A despesa ${what} vence em ${when}, daqui a ${pluralizar(next.days, "dia", "dias")}.`;
  return { id: "despesa", kind: "despesa", text, action: can("/financas") ? { label: "Ver despesa", href: "#orcamento" } : undefined };
}

function itemDaTarefa(input: EntradaDaFila, can: Podem): ItemDaFila | null {
  if (!input.task?.dueKey) return null;
  const days = diasEntreChaves(input.todayKey, input.task.dueKey);
  if (days > DIAS_PARA_TAREFA_PROXIMA) return null;
  const when = rotuloDoDia(input.task.dueKey, input.todayKey);
  return {
    id: "tarefa",
    kind: "tarefa",
    text: days < 0 ? `A tarefa “${input.task.title}” passou do prazo, em ${when}.` : `Tarefa: ${input.task.title}, até ${when}.`,
    action: can("/pendencias") ? { label: "Ver tarefa", href: "/pendencias" } : undefined,
  };
}

/** Até `max` itens, a sugestão da Liz primeiro; os outros por importância (Pix, despesa, data, tarefa, mesas). */
export function montarFila(input: EntradaDaFila, max = 3): ItemDaFila[] {
  const { can } = input;
  const items: ItemDaFila[] = [];

  if (input.tip) items.push({ id: input.tip.id, kind: "liz", text: input.tip.text, action: { label: input.tip.action, href: input.tip.href }, urgent: input.tip.urgent });

  if (input.pendingPix > 0) {
    items.push({
      id: "pix",
      kind: "pix",
      text: `${input.pendingPix === 1 ? "1 Pix de presente espera" : `${input.pendingPix} Pix de presente esperam`} a conferência de vocês.`,
      action: can("/financas") ? { label: "Conferir Pix", href: "#dinheiro" } : undefined,
    });
  }

  const despesa = itemDaDespesa(input, can);
  if (despesa) items.push(despesa);

  if (!input.hasWeddingDate) {
    items.push({
      id: "data",
      kind: "data",
      text: "Vocês ainda não definiram a data do casamento. Com ela, o painel mostra quantos dias faltam.",
      action: can("/site-builder") ? { label: "Adicionar a data", href: "/site-builder" } : undefined,
    });
  }

  const tarefa = itemDaTarefa(input, can);
  if (tarefa) items.push(tarefa);

  if (input.hasTables && input.unseatedPeople > 0) {
    items.push({
      id: "mesas",
      kind: "mesas",
      text: `${rotuloDePessoas(input.unseatedPeople)} ${input.unseatedPeople === 1 ? "confirmada ainda está" : "confirmadas ainda estão"} sem mesa.`,
      action: can("/mesas") ? { label: "Abrir mesas", href: "/mesas" } : undefined,
    });
  }

  return items.slice(0, max);
}
