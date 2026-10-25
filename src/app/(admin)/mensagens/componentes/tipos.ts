// Tipos e opções da página de mensagens.
export interface ModeloDeMensagem {
  id: string;
  name: string;
  type?: string | null;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  buttons?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ItemDeLink = { id: string; text: string };

export type Publico = "pending" | "unsent" | "confirmed" | "all" | "custom";

export const LINKS_PADRAO: ItemDeLink[] = [
  { id: "confirm", text: "✅ Confirmar Presença" },
  { id: "decline", text: "❌ Não poderei ir" },
];

export const LINKS_DE_PRESENTE: ItemDeLink[] = [
  { id: "gifts", text: "🎁 Ver Lista de Presentes" },
  { id: "confirm", text: "✅ Confirmar Presença" },
];

export const MAXIMO_DE_LINKS = 3;

export const PUBLICOS: { id: Exclude<Publico, "custom">; label: string; help: string }[] = [
  { id: "pending", label: "Quem ainda não respondeu", help: "Convidados com o convite sem resposta." },
  { id: "unsent", label: "Quem ainda não recebeu mensagem", help: "Ninguém por aqui mandou nada para eles." },
  { id: "confirmed", label: "Quem confirmou presença", help: "Bom para avisos do dia e do local." },
  { id: "all", label: "Todos com telefone", help: "Cada pessoa recebe uma mensagem só." },
];
