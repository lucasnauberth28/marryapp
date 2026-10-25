// Regras puras da configuração da Liz (limites, tetos, instruções): sem banco nem Next, roda nos testes.
// A IA ainda não está conectada: nada aqui simula conversa, custo ou recusa; só guarda o que o dono configurou.
import { z } from "zod";

/** Texto inicial sugerido das instruções (conteúdo editável, não dado de exemplo). */
export const INSTRUCOES_PADRAO_DA_MADRINHA = [
  "Você é a Liz, a assistente do Aceito. Só responde sobre casamento, sobre o painel do Aceito e sobre o casamento do casal que está conversando com você.",
  "Se a pergunta for de outro assunto, diga com gentileza que só pode ajudar com o casamento e convide a voltar ao tema.",
  "Nunca envie mensagens por conta própria. Prepare um rascunho e deixe o casal aprovar.",
  "Nunca peça nem repita dados pessoais de convidados além do necessário.",
  "Fale por vocês, com frases curtas e carinho. Sem exagero de emojis.",
].join("\n");

const TAMANHO_MAXIMO_DAS_INSTRUCOES = 8000;
const TAMANHO_MAXIMO_DO_TITULO_DO_ARTIGO = 120;
const TAMANHO_MAXIMO_DO_CONTEUDO_DO_ARTIGO = 8000;

/** "12,00" -> 1200, "1.200,5" -> 120050, "300" -> 30000. Devolve null se não for um valor em reais válido. */
export function interpretarReaisEmCentavos(input: string): number | null {
  const text = input.trim().replace(/^R\$\s*/i, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(text)) return null;
  const [whole, frac = ""] = text.replace(/\./g, "").split(",");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

/** 1200 -> "12,00" (para o campo de reais, sem o "R$" que o campo já mostra). */
export function centavosParaCampoDeReais(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Número inteiro de um campo de texto ("25" -> 25); null se vazio ou não numérico. */
export function interpretarCampoInteiro(input: string): number | null {
  const text = input.trim();
  if (!/^\d{1,9}$/.test(text)) return null;
  return Number(text);
}

export interface FormularioDeLimitesDoPlano {
  perDay: string;
  perMonth: string;
  /** Em reais, como a pessoa digita ("12,00"). */
  costCap: string;
  warnPercent: string;
  autoBlock: boolean;
}

export type ErrosDosCampos<K extends string> = Partial<Record<K, string>>;

/** Converte o formulário de limites de um plano (textos) nos números guardados (centavos). */
export function interpretarLimitesDoPlano(
  form: FormularioDeLimitesDoPlano,
): { ok: true; value: { perDay: number; perMonth: number; costCapCents: number; warnPercent: number; autoBlock: boolean } } | { ok: false; errors: ErrosDosCampos<"perDay" | "perMonth" | "costCap" | "warnPercent"> } {
  const errors: ErrosDosCampos<"perDay" | "perMonth" | "costCap" | "warnPercent"> = {};
  const perDay = interpretarCampoInteiro(form.perDay);
  const perMonth = interpretarCampoInteiro(form.perMonth);
  const costCapCents = interpretarReaisEmCentavos(form.costCap);
  const warnPercent = interpretarCampoInteiro(form.warnPercent);
  if (perDay === null || perDay > 10_000) errors.perDay = "Use um número inteiro, até 10.000.";
  if (perMonth === null || perMonth > 100_000) errors.perMonth = "Use um número inteiro, até 100.000.";
  if (perDay !== null && perMonth !== null && perDay > perMonth && !errors.perDay) errors.perDay = "Por dia não pode passar do total do mês.";
  if (costCapCents === null || costCapCents > 100_000_00) errors.costCap = "Use um valor em reais, como 12,00.";
  if (warnPercent === null || warnPercent > 100) errors.warnPercent = "Use de 0 a 100.";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { perDay: perDay!, perMonth: perMonth!, costCapCents: costCapCents!, warnPercent: warnPercent!, autoBlock: form.autoBlock } };
}

/** Texto das instruções: sem controle estranho, quebras de linha normalizadas e sem sobra nas pontas. */
export function normalizarInstrucoes(text: string): string {
  let out = "";
  for (const ch of text.replace(/\r\n?/g, "\n")) {
    const code = ch.charCodeAt(0);
    if (code < 32 && ch !== "\n" && ch !== "\t") continue; // caracteres de controle não entram
    out += ch;
  }
  return out.trim();
}

export const entradaDasInstrucoes = z.object({
  content: z.string().transform(normalizarInstrucoes).pipe(z.string().min(20, "Escreva pelo menos uma frase de instrução.").max(TAMANHO_MAXIMO_DAS_INSTRUCOES, "Texto longo demais.")),
  changeNote: z.string().trim().min(3, "Diga em poucas palavras o que mudou.").max(160, "Use até 160 caracteres."),
});

export const entradaDoArtigo = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, "Dê um título ao texto.").max(TAMANHO_MAXIMO_DO_TITULO_DO_ARTIGO, "Título longo demais."),
  content: z.string().transform(normalizarInstrucoes).pipe(z.string().min(10, "Escreva o texto de ajuda.").max(TAMANHO_MAXIMO_DO_CONTEUDO_DO_ARTIGO, "Texto longo demais.")),
});

/** Número da próxima versão das instruções. */
export function proximaVersao(existing: readonly number[]): number {
  return existing.length === 0 ? 1 : Math.max(...existing) + 1;
}

/** Chaves de configuração da Liz que ganham o selo "padrão sugerido" até serem salvas. */
export const CHAVES_DE_CONFIGURACAO_DA_MADRINHA = ["madrinha.limits", "madrinha.globalCap", "madrinha.abuse", "madrinha.capabilities"] as const;
