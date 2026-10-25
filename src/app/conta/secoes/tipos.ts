import type { PublicoDaNotificacao, GrupoDeNotificacao } from "@/lib/notifications/catalog";
import type { PreferenciasDeNotificacao } from "@/lib/notifications/preferences";

export interface Integrante {
  id: string;
  name: string;
  email: string;
  isYou: boolean;
  since: string;
}

export interface ConviteDaConta {
  id: string;
  email: string | null;
  createdAt: string;
  expiresAt: string;
}

export type TipoDeConta = "couple" | "vendor" | "admin";
export type CasamentoDaConta = { coupleNames: string; slug: string; members: Integrante[]; invites: ConviteDaConta[] };

export interface Propriedades {
  kind: TipoDeConta;
  account: { name: string; email: string; createdAt: string; companyName: string | null };
  wedding: CasamentoDaConta | null;
  /** Chave pública do push (null com o push desligado no servidor). */
  pushPublicKey: string | null;
  /** Escolhas de avisos da conta e o que a tela oferece para este tipo de conta. */
  notifications: { prefs: PreferenciasDeNotificacao; audience: PublicoDaNotificacao; groups: GrupoDeNotificacao[] };
}
