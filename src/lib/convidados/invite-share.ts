import { somenteDigitos } from "../formatacao/telefone.ts";
import { formatarDataCivilLonga, formatarDataCivilSemAno } from "../formatacao/data.ts";
// Compartilhar o convite pelo WhatsApp do próprio casal (sem Evolution API, em todos os planos).
// Puro (sem banco nem Next): os textos e o link saem daqui para o Resumo e para os testes dizerem a mesma coisa.

const FORMATO_DO_DIA_DA_SEMANA = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });

/** "Ana & Rafael" vira "Ana e Rafael" para ler numa frase. */
export function nomesNaFrase(coupleNames: string): string {
  return coupleNames.replace(/\s*&\s*/g, " e ").replace(/\s+/g, " ").trim();
}

/** "sábado, 17 de abril de 2027" (a data é de calendário: vale o dia gravado, sem fuso). */
export function dataDoCasamentoNaFrase(date: Date | null): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  return `${FORMATO_DO_DIA_DA_SEMANA.format(date)}, ${formatarDataCivilLonga(date)}`;
}

/** "15 de março" (prazo de confirmação). */
export function prazoNaFrase(date: Date | null): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  return formatarDataCivilSemAno(date);
}

const primeiroNome = (name: string) => name.trim().split(/\s+/)[0] || name.trim();

export interface EntradaDoTextoDoConvite {
  coupleNames: string;
  weddingDate: Date | null;
  city?: string | null;
  /** Endereço do site (convite em geral) ou da página de confirmação (convite de uma pessoa). */
  url: string;
}

/** Mensagem do convite em geral, para o grupo ou para quem o casal escolher no WhatsApp. */
export function textoDoConviteGeral({ coupleNames, weddingDate, city, url }: EntradaDoTextoDoConvite): string {
  const when = dataDoCasamentoNaFrase(weddingDate);
  const where = city?.trim() ? `, em ${city.trim()}` : "";
  const head = when ? `${nomesNaFrase(coupleNames)} vão se casar no ${when}${where}.` : `${nomesNaFrase(coupleNames)} vão se casar${where}.`;
  return `${head} Confirme sua presença e veja os detalhes no site:\n${url}`;
}

/** Mensagem pessoal, com o primeiro nome de quem recebe. */
export function textoDoConvitePessoal({ guestName, coupleNames, weddingDate, url }: Omit<EntradaDoTextoDoConvite, "city"> & { guestName: string }): string {
  const when = dataDoCasamentoNaFrase(weddingDate);
  const date = when ? `, no ${when}` : "";
  return `Olá, ${primeiroNome(guestName)}! ${nomesNaFrase(coupleNames)} convidam você para o casamento${date}. Para confirmar, abra o link e informe o seu WhatsApp:\n${url}`;
}

/** Lembrete para quem ainda não respondeu; cita o prazo só quando o casal definiu um. */
export function textoDoLembrete({ guestName, coupleNames, deadline, url }: { guestName: string; coupleNames: string; deadline: Date | null; url: string }): string {
  const until = prazoNaFrase(deadline);
  const ending = until ? ` O prazo para confirmar termina em ${until}:` : " Para confirmar, abra o link:";
  return `Olá, ${primeiroNome(guestName)}! Ainda não recebemos a sua resposta para o casamento de ${nomesNaFrase(coupleNames)}.${ending}\n${url}`;
}

/**
 * Link do WhatsApp com a mensagem pronta. Com telefone (DDD + número, como o cadastro guarda), abre a conversa
 * da pessoa; sem telefone, abre o WhatsApp para o casal escolher a pessoa ou o grupo.
 */
export function linkDoWhatsapp(phone: string | null | undefined, text: string): string {
  const digits = somenteDigitos(phone);
  const full = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits.startsWith("55") && (digits.length === 12 || digits.length === 13) ? digits : "";
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}
