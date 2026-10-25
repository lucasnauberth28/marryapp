"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { obterSessao, ID_DO_SUPER_ADMIN } from "@/lib/security/auth-guard";
import { conferirLimiteDeUso } from "@/lib/security/rate-limiter";
import { GRUPOS_DE_NOTIFICACAO } from "@/lib/notifications/catalog";
import { CANAIS_DE_NOTIFICACAO, limparPreferenciasGuardadas, type PreferenciasDeNotificacao } from "@/lib/notifications/preferences";

// Escolhas de avisos da própria conta. O id do usuário vem sempre da sessão.

const LIMITE_DE_GRAVACAO = { limit: 60, windowMs: 1000 * 60 * 10 }; // 60 gravações / 10 min por conta

const horaValidaDoSilencio = z.number().int().min(0).max(23);
const marcasDoGrupo = z.object(Object.fromEntries(GRUPOS_DE_NOTIFICACAO.map((g) => [g, z.boolean()])) as Record<(typeof GRUPOS_DE_NOTIFICACAO)[number], z.ZodBoolean>);

const EsquemaDasPreferencias = z.object({
  channels: z.object(Object.fromEntries(CANAIS_DE_NOTIFICACAO.map((c) => [c, marcasDoGrupo])) as Record<(typeof CANAIS_DE_NOTIFICACAO)[number], typeof marcasDoGrupo>),
  quietHours: z.object({ enabled: z.boolean(), startHour: horaValidaDoSilencio, endHour: horaValidaDoSilencio }),
});

export type ResultadoDaGravacaoDasPreferencias = { success: true } | { success: false; error: string };

/** Salva as escolhas de avisos da conta da sessão. */
export async function salvarPreferenciasDeNotificacao(input: PreferenciasDeNotificacao): Promise<ResultadoDaGravacaoDasPreferencias> {
  const session = await obterSessao();
  if (!session) return { success: false, error: "Entre na sua conta para salvar." };
  if (session.userId === ID_DO_SUPER_ADMIN) return { success: false, error: "A conta de administração não tem avisos próprios." };

  const parsed = EsquemaDasPreferencias.safeParse(input);
  if (!parsed.success) return { success: false, error: "Não entendemos essa escolha. Recarregue a página e tente de novo." };

  try {
    const limit = await conferirLimiteDeUso({ key: `NOTIF_PREFS:${session.userId}`, ...LIMITE_DE_GRAVACAO });
    if (!limit.success) return { success: false, error: "Muitas mudanças em pouco tempo. Aguarde um instante." };

    const stored = limparPreferenciasGuardadas(parsed.data);
    if (!stored) return { success: false, error: "Não entendemos essa escolha." };
    const settings = JSON.parse(JSON.stringify(stored)) as Prisma.InputJsonObject;
    await prisma.notificationPreference.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, settings },
      update: { settings },
    });
    return { success: true };
  } catch (error) {
    console.error("[saveNotificationPreferences Error]:", error instanceof Error ? error.message : error);
    return { success: false, error: "Não conseguimos salvar agora. Tente de novo." };
  }
}
