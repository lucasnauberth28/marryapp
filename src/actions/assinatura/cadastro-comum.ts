// Cadastro de conta pelo plano: tipos, validação e ajudas (não são ações; as ações ficam em cadastro.ts).
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { limparUrl } from "@/lib/security/sanitize";
import { enviarImagemDeDataUrl } from "@/lib/supabase";
import { textoOpcional } from "@/lib/zod-textos";
import { somenteDigitos } from "@/lib/formatacao/telefone";

/** Perfil das contas de fornecedor (o mesmo criado pelo seed). */
export const NOME_DO_PAPEL_DE_FORNECEDOR = "Fornecedor";

export interface DadosDoCadastroDoPlano {
  planType: "COUPLE" | "VENDOR";
  planId: "basic" | "classic" | "vip" | "start" | "pro" | "master" | "custom";
  modules?: string[]; // módulos do plano personalizado
  planName: string;
  amount: number; // informativo: o servidor recalcula o preço a partir do plano
  // Dados do usuário
  name: string;
  email: string;
  phone: string;
  password?: string;
  // Extras Casal
  slug?: string;
  weddingDate?: Date | null;
  // Extras Fornecedor
  companyName?: string;
  vendorCategory?: string;
  vendorRegion?: string;
  logoUrl?: string;
  coverUrl?: string;
  galleryImages?: string[];
  startingPrice?: number; // em centavos
  averageTicket?: number; // em centavos
  priceRange?: string; // "$", "$$", "$$$", "$$$$"
  documentType?: string; // "CNPJ" | "CPF"
  documentNumber?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
}

export const EsquemaDoCadastro = z.object({
  planId: z.string(),
  modules: z.array(z.string().max(40)).max(20).optional(),
  name: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido.").max(200),
  phone: z
    .string()
    .transform((v) => somenteDigitos(v))
    .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido."),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(200),
  slug: textoOpcional(100),
  weddingDate: z.coerce.date().optional().nullable(),
  companyName: textoOpcional(120),
  vendorCategory: textoOpcional(60),
  vendorRegion: textoOpcional(80),
  logoUrl: z.string().max(8_000_000).optional(),
  coverUrl: z.string().max(8_000_000).optional(),
  galleryImages: z.array(z.string().max(8_000_000)).max(8).optional(),
  startingPrice: z.coerce.number().int().min(0).max(1_000_000_00).optional(),
  averageTicket: z.coerce.number().int().min(0).max(1_000_000_00).optional(),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
  documentType: z.enum(["CNPJ", "CPF"]).optional(),
  documentNumber: textoOpcional(20),
  instagram: textoOpcional(80),
  tiktok: textoOpcional(80),
  website: textoOpcional(200),
});

/**
 * Calcula a faixa de preço ($ / $$ / $$$ / $$$$) baseado no ticket médio / valor inicial
 */
export function calcularFaixaDePreco(avgTicketInCents?: number, startingPriceInCents?: number): string {
  const value = (avgTicketInCents || startingPriceInCents || 0) / 100;
  if (value <= 3000) return "$";
  if (value <= 8000) return "$$";
  if (value <= 20000) return "$$$";
  return "$$$$";
}

/**
 * Imagens chegam como data URL do formulário público: valida tipo/tamanho e envia ao storage.
 * Também aceita URLs https já hospedadas.
 */
export async function guardarImagem(value: string | undefined, folder: string): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("data:")) {
    const upload = await enviarImagemDeDataUrl(value, folder);
    if (!upload.success) throw new Error(upload.error);
    return upload.url;
  }
  const url = limparUrl(value);
  return url && url.startsWith("https://") ? url : null;
}

/** Depois de mexer no plano, as telas do fornecedor e a vitrine pública mostram o novo estado. */
export function atualizarPaginasDoPlano() {
  revalidatePath("/fornecedor", "layout");
  revalidatePath("/fornecedores");
}

/** Data do casamento do cadastro: só datas plausíveis (o resto vira "ainda sem data"). */
export function dataDeCasamentoValida(date: Date | null | undefined): Date | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const now = new Date().getUTCFullYear();
  return year >= now - 1 && year <= now + 10 ? date : null;
}
