// Chaves, formato e padrões das configurações da plataforma e da Madrinha (tabela platform_settings).
// Sem dependências do servidor: roda nos testes. A leitura e a gravação (com auditoria) ficam em settings.ts.
// Regra: só entra aqui o que o sistema de fato usa ou vai usar quando a Madrinha for ativada. Valor fora do
// formato (linha editada na mão, versão antiga) nunca quebra a tela: volta ao padrão.
import { z } from "zod";

const money = z.number().int().min(0).max(100_000_00); // centavos
const percent = z.number().int().min(0).max(100);
const count = z.number().int().min(0).max(1_000_000);

/** Limites de mensagens e custo por tipo de assinatura da Madrinha. */
const madrinhaPlanLimits = z.object({
  perDay: count,
  perMonth: count,
  /** Teto de custo por casal no mês, em centavos. */
  costCapCents: money,
  /** Avisa ao chegar neste % do teto. */
  warnPercent: percent,
  /** Bloqueia sozinha ao atingir o teto (o casal vê um aviso gentil e volta no mês seguinte). */
  autoBlock: z.boolean(),
});

export const SETTING_DEFS = {
  /** Modo de manutenção: casais e convidados veem um aviso e o painel fica só para leitura. */
  maintenance: {
    schema: z.object({
      enabled: z.boolean(),
      message: z.string().trim().max(300),
      /** Quando volta, ISO 8601 (data e hora de Brasília já convertidas). */
      backAt: z.string().datetime({ offset: true }).nullable(),
    }),
    default: { enabled: false, message: "Estamos melhorando o Aceito. Voltamos em alguns minutos.", backAt: null as string | null },
  },
  /** Política de reembolso exibida na hora de pagar e usada pela administração ao decidir. */
  refundPolicy: {
    schema: z.object({
      days: z.number().int().min(0).max(90),
      decidedBy: z.enum(["ADMIN", "AUTO"]),
      text: z.string().trim().max(1000),
    }),
    default: {
      days: 7,
      decidedBy: "ADMIN" as "ADMIN" | "AUTO",
      text: "Você pode pedir o dinheiro de volta em até 7 dias depois do pagamento, se ainda não usou os recursos do plano.",
    },
  },
  /** Remetente dos e-mails do Aceito (hoje o remetente vem da variável EMAIL_FROM; isto a sobrepõe quando preenchido). */
  emailSender: {
    schema: z.object({
      fromName: z.string().trim().max(80),
      fromEmail: z.string().trim().email().max(200).or(z.literal("")),
      replyTo: z.string().trim().email().max(200).or(z.literal("")),
    }),
    default: { fromName: "Aceito", fromEmail: "", replyTo: "" },
  },
  /** Alertas por e-mail da Saúde do sistema (só vale se o envio de alertas for implementado). */
  healthAlerts: {
    schema: z.object({
      mercadoPagoFailures: z.boolean(),
      whatsappDisconnected: z.boolean(),
      routineMissed: z.boolean(),
      errorRate: z.boolean(),
      sendTo: z.string().trim().email().max(200).or(z.literal("")),
    }),
    default: { mercadoPagoFailures: true, whatsappDisconnected: true, routineMissed: true, errorRate: false, sendTo: "" },
  },

  // ---------- Madrinha: só configuração (a IA ainda não está conectada; nada aqui simula conversa ou custo) ----------
  /** Interruptor geral. Fica travado em desligado até existir a conexão com a API; `pausedAt` é o "Pausar para todos". */
  "madrinha.master": {
    schema: z.object({
      enabled: z.boolean(),
      pausedAt: z.string().datetime({ offset: true }).nullable(),
      pausedReason: z.string().trim().max(300).nullable(),
    }),
    default: { enabled: false, pausedAt: null as string | null, pausedReason: null as string | null },
  },
  /** O que a Madrinha pode fazer (ligado/desligado por recurso). "Enviar mensagens sozinha" nunca liga: o casal sempre aprova. */
  "madrinha.capabilities": {
    schema: z.object({
      draftReminder: z.boolean(),
      suggestTasks: z.boolean(),
      buildTimeline: z.boolean(),
      compareQuotes: z.boolean(),
    }),
    default: { draftReminder: true, suggestTasks: true, buildTimeline: true, compareQuotes: false },
  },
  /** Limites por tipo de assinatura. */
  "madrinha.limits": {
    schema: z.object({ subscription: madrinhaPlanLimits, trial: madrinhaPlanLimits }),
    default: {
      subscription: { perDay: 25, perMonth: 300, costCapCents: 1200, warnPercent: 80, autoBlock: true },
      trial: { perDay: 10, perMonth: 50, costCapCents: 200, warnPercent: 80, autoBlock: true },
    },
  },
  /** Teto mensal de custo de toda a Madrinha. */
  "madrinha.globalCap": {
    schema: z.object({ monthlyCostCapCents: money, warnPercent: percent, pauseAtCap: z.boolean() }),
    default: { monthlyCostCapCents: 30000, warnPercent: 80, pauseAtCap: true },
  },
  /** Bloqueio por abuso (uso como chat comum, fuga de tema). */
  "madrinha.abuse": {
    schema: z.object({
      perHour: count,
      blockHours: z.number().int().min(1).max(24 * 30),
      blockOffTopic: z.boolean(),
      offTopicBeforeBlock: z.number().int().min(1).max(100),
    }),
    default: { perHour: 40, blockHours: 24, blockOffTopic: true, offTopicBeforeBlock: 5 },
  },
} as const;

export type SettingKey = keyof typeof SETTING_DEFS;
export type SettingValue<K extends SettingKey> = z.infer<(typeof SETTING_DEFS)[K]["schema"]>;

export const SETTING_KEYS = Object.keys(SETTING_DEFS) as SettingKey[];

export function isSettingKey(key: string): key is SettingKey {
  return Object.prototype.hasOwnProperty.call(SETTING_DEFS, key);
}

/** Valor salvo se estiver no formato; senão o padrão (nunca lança). */
export function parseSetting<K extends SettingKey>(key: K, raw: unknown): SettingValue<K> {
  const def = SETTING_DEFS[key];
  if (raw === undefined || raw === null) return structuredClone(def.default) as SettingValue<K>;
  const parsed = def.schema.safeParse(raw);
  return (parsed.success ? parsed.data : structuredClone(def.default)) as SettingValue<K>;
}
