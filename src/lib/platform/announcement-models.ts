// Comunicados: modelos prontos (textos editáveis que preenchem o formulário; conteúdo, não dado de exemplo).
import type { Canal } from "./announcement-audience.ts";

/** Modelos prontos: textos editáveis que preenchem o formulário (conteúdo, não dado de exemplo). */
export interface ModeloDeComunicado {
  id: string;
  name: string;
  hint: string;
  title: string;
  body: string;
  service: boolean;
  channels: Canal[];
}

export const MODELOS_DE_COMUNICADO: ModeloDeComunicado[] = [
  {
    id: "manutencao",
    name: "Manutenção programada",
    hint: "Dia, hora e quanto tempo fica fora do ar",
    title: "Manutenção programada",
    body: "No dia [dia], das [hora] às [hora], o Aceito fica fora do ar por alguns minutos para melhorias. Seus dados estão seguros.",
    service: true,
    channels: ["PANEL", "EMAIL"],
  },
  {
    id: "novidade",
    name: "Novidade no Aceito",
    hint: "Conte o que mudou e como usar",
    title: "Novidade no Aceito",
    body: "Temos uma novidade para vocês: [conte o que mudou]. Para usar, é só abrir o painel e [explique o caminho].",
    service: false,
    channels: ["PANEL", "PUSH"],
  },
  {
    id: "plano",
    name: "Plano vencendo",
    hint: "Lembrete amigável, 7 dias antes",
    title: "Seu plano vence em breve",
    body: "Seu plano vence em 7 dias. Para continuar com tudo liberado, renove em Planos no seu painel. Se já renovou, pode ignorar este aviso.",
    service: true,
    channels: ["PANEL", "EMAIL"],
  },
];
