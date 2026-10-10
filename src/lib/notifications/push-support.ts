// O que este aparelho consegue fazer com avisos. Puro: recebe o que o navegador informa
// e devolve um estado simples para a tela. Testado sem navegador.

export type PushSupportState =
  | "checking" // ainda no servidor, sem saber
  | "unsupported" // navegador sem suporte a avisos
  | "ios-install" // iPhone/iPad: só funciona depois de "Adicionar à Tela de Início" (iOS 16.4 ou mais novo)
  | "default" // pode pedir permissão
  | "granted" // já permitiu
  | "denied"; // bloqueou nas configurações do navegador

export interface PushSupportInput {
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
  permission: "default" | "granted" | "denied";
  isIos: boolean;
  /** Aberto como app instalado (tela de início). */
  isStandalone: boolean;
}

export function classifyPushSupport(i: PushSupportInput): PushSupportState {
  // No iPhone, o Safari comum não oferece push: só o app instalado na tela de início (iOS 16.4+).
  if (i.isIos && !i.isStandalone) return "ios-install";
  if (!i.hasServiceWorker || !i.hasPushManager || !i.hasNotification) return "unsupported";
  return i.permission;
}

/** iPhone, iPad (inclusive iPadOS que se identifica como Mac com tela de toque). */
export function isIosDevice(userAgent: string, maxTouchPoints: number): boolean {
  if (/iPad|iPhone|iPod/.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

/** Chave pública VAPID (base64url) no formato que o navegador pede. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
