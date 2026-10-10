"use client";

import { useSyncExternalStore } from "react";
import { classifyPushSupport, isIosDevice, type PushSupportState } from "@/lib/notifications/push-support";

// Estado do aparelho para avisos, lido do navegador como uma "fonte externa" (sem setState em efeito).
// Muda quando a permissão muda (inclusive nas configurações do navegador) ou o app é instalado.

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Chame depois de pedir permissão: nem todo navegador avisa a mudança sozinho. */
export function notifyPushStateChanged() {
  emit();
}

function read(): PushSupportState {
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return classifyPushSupport({
    hasServiceWorker: "serviceWorker" in navigator,
    hasPushManager: "PushManager" in window,
    hasNotification: "Notification" in window,
    permission: "Notification" in window ? Notification.permission : "default",
    isIos: isIosDevice(navigator.userAgent, navigator.maxTouchPoints ?? 0),
    isStandalone: standalone,
  });
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  let status: PermissionStatus | null = null;
  let cancelled = false;
  navigator.permissions
    ?.query({ name: "notifications" as PermissionName })
    .then((s) => {
      if (cancelled) return;
      status = s;
      s.addEventListener("change", onChange);
    })
    .catch(() => undefined);
  const media = window.matchMedia?.("(display-mode: standalone)");
  media?.addEventListener("change", onChange);
  return () => {
    cancelled = true;
    listeners.delete(onChange);
    status?.removeEventListener("change", onChange);
    media?.removeEventListener("change", onChange);
  };
}

export function usePushSupport(): PushSupportState {
  return useSyncExternalStore(subscribe, read, () => "checking" as const);
}
