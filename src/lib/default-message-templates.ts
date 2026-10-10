// Modelos de mensagem que todo casal novo recebe. Sem dependências (testável).
// Só vale para casamentos sem nenhum modelo: os modelos que o casal já tem nunca são trocados.

export interface DefaultMessageTemplate {
  name: string;
  type: "INITIAL_INVITE" | "RSVP_REMINDER";
  content: string;
  buttons: string;
}

const CONFIRM_LINKS = JSON.stringify([
  { id: "confirm", text: "✅ Confirmar Presença" },
  { id: "decline", text: "❌ Não poderei ir" },
]);

/** Na ordem em que aparecem na lista (o convite primeiro). */
export const DEFAULT_MESSAGE_TEMPLATES: DefaultMessageTemplate[] = [
  {
    name: "Convite para o casamento",
    type: "INITIAL_INVITE",
    content:
      "💍 *Você está convidado!*\n\nOlá, *{nome}*! 🎉\n\nTemos a honra de convidá-lo(a) para o nosso casamento!\n\nPor favor, confirme sua presença pelo link abaixo:",
    buttons: CONFIRM_LINKS,
  },
  {
    name: "Lembrete para quem ainda não respondeu",
    type: "RSVP_REMINDER",
    content:
      "🔔 *Lembrete de Presença*\n\nOlá, *{nome}*! Tudo bem? 😊\n\nPercebemos que ainda não recebemos a sua confirmação para o nosso casamento.\n\nPor favor, confirme pelo link abaixo:",
    buttons: CONFIRM_LINKS,
  },
];

/** Modelos padrão a criar: todos quando o casamento ainda não tem nenhum, senão nenhum. */
export function defaultTemplatesToCreate(existingCount: number): DefaultMessageTemplate[] {
  return existingCount === 0 ? DEFAULT_MESSAGE_TEMPLATES : [];
}
