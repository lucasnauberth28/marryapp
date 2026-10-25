// Resumo do casamento (sem banco nem Next): datas de calendário "AAAA-MM-DD" e rótulos de dia.
import { pluralizar } from "../formatacao/plural.ts";
import { formatarDataCivilCurta, formatarDataCivilLonga, formatarDataCivilSemAno } from "../formatacao/data.ts";

export const FUSO_DE_BRASILIA = "America/Sao_Paulo";

const formatoDaChaveDoDia = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_DE_BRASILIA });

/** Hoje no fuso do casal, "AAAA-MM-DD". */
export function chaveDeHojeDe(now: Date): string {
  return formatoDaChaveDoDia.format(now);
}

/** Dia de calendário gravado numa data do banco (datas do casamento, prazos e vencimentos valem em UTC). */
export function chaveDoDiaDe(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Dias de calendário de `from` até `to` (negativo quando `to` já passou). */
export function diasEntreChaves(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}


/** "26 de outubro"; com o ano quando não é o ano de hoje. */
export function rotuloDoDia(key: string, todayKey: string): string {
  const date = new Date(`${key}T00:00:00Z`);
  return key.slice(0, 4) === todayKey.slice(0, 4) ? formatarDataCivilSemAno(date) : formatarDataCivilLonga(date);
}

/** "26 out" (sem ponto). */
export function rotuloCurtoDoDia(key: string): string {
  return formatarDataCivilCurta(new Date(`${key}T00:00:00Z`)).replace(" de ", " ").replace(".", "");
}

export const rotuloDeConvites = (n: number) => pluralizar(n, "convite", "convites");
export const rotuloDePessoas = (n: number) => pluralizar(n, "pessoa", "pessoas");
