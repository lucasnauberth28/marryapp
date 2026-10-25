// Regras puras da administração de fornecedores (sem banco nem Next, testadas isoladamente).

export type VisaoDaCuradoria = "approved" | "pending" | "adjust" | "suspended";

/** Situação mostrada na lista: suspenso tem precedência; recusado aparece como "Ajustes" (a mensagem fica em curationNotes). */
export function visaoDaCuradoria(vendor: { curationStatus: string; suspendedAt: Date | null }): VisaoDaCuradoria {
  if (vendor.suspendedAt) return "suspended";
  if (vendor.curationStatus === "APPROVED") return "approved";
  if (vendor.curationStatus === "REJECTED") return "adjust";
  return "pending";
}

export const ROTULO_DA_CURADORIA: Record<VisaoDaCuradoria, string> = {
  approved: "Aprovado",
  pending: "Em análise",
  adjust: "Ajustes",
  suspended: "Suspenso",
};

/** Motivos prontos para recusar um cadastro; a mensagem é editável antes de enviar. */
export const MOTIVOS_DE_RECUSA = [
  { value: "price", label: "Sem preço inicial", message: "Para aparecer na vitrine, informe um preço inicial no seu perfil. Assim que ajustar, a gente analisa de novo." },
  { value: "photos", label: "Poucas fotos ou fotos fracas", message: "Envie pelo menos 3 fotos nítidas do seu trabalho. Assim que ajustar, a gente analisa de novo." },
  { value: "document", label: "Documento com problema", message: "Não conseguimos conferir o seu CPF ou CNPJ. Confira o número no perfil e envie de novo." },
  { value: "description", label: "Descrição incompleta", message: "Conte um pouco mais sobre o seu serviço na descrição do perfil. Assim que ajustar, a gente analisa de novo." },
  { value: "other", label: "Outro motivo", message: "" },
] as const;
export function mensagemDeRecusaPara(value: string): string {
  return MOTIVOS_DE_RECUSA.find((r) => r.value === value)?.message ?? "";
}

export const ABAS_DE_FORNECEDORES = ["todos", "curadoria", "pro-master", "vencendo", "denuncias"] as const;
export type AbaDeFornecedores = (typeof ABAS_DE_FORNECEDORES)[number];

export const ORDENACOES_DE_FORNECEDORES = ["espera", "nota", "recentes"] as const;
export type OrdenacaoDeFornecedores = (typeof ORDENACOES_DE_FORNECEDORES)[number];

/** Quantos dias de plano cortesia a administração pode conceder de uma vez. */
export const DIAS_DE_CONCESSAO = [7, 15, 30, 60, 90] as const;

const UM_DIA_EM_MS = 86_400_000;

/** "em 6 dias", "amanhã", "vence hoje", "venceu" para a coluna "Plano vence" (data em instante UTC). */
export function tomDoVencimentoDoPlano(expiresAt: Date | null, now: Date): "soon" | "normal" | "none" {
  if (!expiresAt) return "none";
  return expiresAt.getTime() - now.getTime() <= 7 * UM_DIA_EM_MS ? "soon" : "normal";
}

/** Regiões atendidas guardadas como texto JSON (["Campinas","Grande SP"]); texto ruim vira lista vazia. */
export function interpretarRegioes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((r): r is string => typeof r === "string" && r.trim() !== "").map((r) => r.trim()) : [];
  } catch {
    return [];
  }
}

/** Galeria guardada como texto JSON; só URLs https, no máximo `max`. Sem galeria, usa a capa. */
export function fotosDaGaleria(raw: string | null | undefined, cover: string | null | undefined, max = 3): string[] {
  let photos: string[] = [];
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    photos = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string" && p.startsWith("https://")) : [];
  } catch {
    photos = [];
  }
  if (photos.length === 0 && cover?.startsWith("https://")) photos = [cover];
  return photos.slice(0, max);
}
/** Plano pago em vigor (mesma regra de /assinaturas): não-gratuito e sem data ou com data no futuro. */
export function ehPagoEAtivo(vendor: { planTier: string; planExpiresAt: Date | null }, now: Date): boolean {
  return vendor.planTier !== "FREE" && (vendor.planExpiresAt === null || vendor.planExpiresAt.getTime() > now.getTime());
}

/** Fim do plano cortesia: hoje mais N dias (nunca encurta um plano pago que já vai além). */
export function fimDoPlanoConcedido(now: Date, days: number, currentEnd: Date | null, sameOrHigherTier: boolean): Date {
  const proposed = new Date(now.getTime() + days * UM_DIA_EM_MS);
  return sameOrHigherTier && currentEnd && currentEnd.getTime() > proposed.getTime() ? currentEnd : proposed;
}

/** Ordenação de destaque na vitrine: destacados primeiro, depois plano efetivo (estável). */
export function posicaoNaVitrine(a: { featured: boolean; tierRank: number; index: number }, b: { featured: boolean; tierRank: number; index: number }): number {
  return Number(b.featured) - Number(a.featured) || b.tierRank - a.tierRank || a.index - b.index;
}
