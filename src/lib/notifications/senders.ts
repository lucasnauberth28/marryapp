import "server-only";
import { DEFAULT_PREFS, type NotificationChannel } from "./preferences.ts";
import type { FanOutDeps, FanOutItem } from "./fanout.ts";

/**
 * Envios reais de cada canal. Cada um devolve true se entregou ao serviço do canal e false se não
 * havia para onde enviar (sem aparelho cadastrado, sem telefone, serviço não configurado).
 */
const senders: Record<NotificationChannel, (item: FanOutItem) => Promise<boolean>> = {
  push: async () => false,
  whatsapp: async () => false,
  email: async () => false,
};

export function realFanOutDeps(): FanOutDeps {
  return {
    now: () => new Date(),
    loadPrefs: async () => new Map(),
    send: senders,
    defaults: DEFAULT_PREFS,
  };
}
