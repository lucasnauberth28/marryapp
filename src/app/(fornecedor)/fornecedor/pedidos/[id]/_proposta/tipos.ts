import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface PropostaSalva {
  /** "hoje, 14:20" */
  sentAtLabel: string;
  /** Texto pronto para o casal (WhatsApp ou copiar). */
  text: string;
  whatsappUrl: string | null;
  /** Link público para o casal ver e aceitar a proposta. */
  publicUrl: string | null;
  /** Registro do aceite digital (nome digitado pelo casal e quando). */
  accepted: { name: string; atLabel: string } | null;
}

export interface ValoresDaProposta {
  amount: string;
  validUntil: string;
  details: string;
}

const ESTILO_DO_BOTAO =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";
export const BOTAO_PRINCIPAL = cn(ESTILO_DO_BOTAO, "bg-ameixa text-on-ameixa hover:bg-ameixa-hover");
export const BOTAO_SECUNDARIO = cn(ESTILO_DO_BOTAO, "border border-linha-forte bg-papel text-tinta hover:bg-areia");

export async function copiarTexto(text: string, done = "Texto da proposta copiado.") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(done);
  } catch {
    toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
  }
}
