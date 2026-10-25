import { toast } from "sonner";
import type { NomeDaSituacaoDoPedidoDeDominio } from "@/lib/dominio/domain-order";

export interface DadosDoPainelDoDominio {
  id: string;
  domain: string;
  status: NomeDaSituacaoDoPedidoDeDominio;
  holderDocument: string;
  canRevealDocument: boolean;
  adminNote: string | null;
  vercelState: string | null;
  canRenew: boolean;
}

export const ESTILO_DE_PERIGO = "border-perigo text-perigo hover:border-perigo hover:bg-perigo-suave";

export const hojeNoFormulario = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

export function maisUmAno(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export async function copiarTexto(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("Não foi possível copiar. Selecione e copie à mão.");
  }
}

/** Texto honesto da última situação lida da Vercel (sem inventar horário: só guardamos a situação). */
export function textoDaSituacaoNaVercel(state: string | null): string | null {
  if (!state) return null;
  if (state === "ready") return "A Vercel confirmou: domínio verificado e apontado.";
  if (state === "pending_dns") return "A Vercel ainda não encontra o DNS apontado. A propagação pode levar até 48 horas.";
  if (state === "pending_verification") return "A Vercel pede o registro TXT de verificação.";
  if (state === "manual") return "Marcado como no ar à mão.";
  if (state.startsWith("erro:")) return "A última tentativa de falar com a Vercel falhou.";
  return `Situação na Vercel: ${state}`;
}
