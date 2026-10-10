"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2, Send, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { isMySubscription, removeSubscription, saveSubscription, sendTestPush } from "@/actions/push-actions";
import { urlBase64ToUint8Array } from "@/lib/notifications/push-support";
import { cn } from "@/lib/utils";
import { ToggleSwitch } from "./toggle-switch";
import { notifyPushStateChanged, usePushSupport } from "./use-push-state";

interface Props {
  /** Chave pública VAPID; sem ela (ambiente sem push) o cartão nem aparece. */
  publicKey: string | null;
  /** "compact": uma linha, só quando falta ativar (rodapé do sino). "card": cartão completo. */
  variant?: "card" | "compact";
  className?: string;
}

const BTN =
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ameixa focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/** O serviço de push do navegador às vezes não responde (rede bloqueada, sem internet): não deixa a tela girando para sempre. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("tempo esgotado")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function registerWorker() {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  await navigator.serviceWorker.ready;
  return registration;
}

/** Cria (ou reaproveita) a inscrição do navegador. Se as chaves do servidor mudaram, refaz a inscrição. */
async function subscribeBrowser(registration: ServiceWorkerRegistration, publicKey: string) {
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  const options = { userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) };
  try {
    return await registration.pushManager.subscribe(options);
  } catch (error) {
    if (error instanceof DOMException && error.name === "InvalidStateError") {
      await (await registration.pushManager.getSubscription())?.unsubscribe();
      return registration.pushManager.subscribe(options);
    }
    throw error;
  }
}

export function PushCard({ publicKey, variant = "card", className }: Props) {
  const support = usePushSupport();
  // null = ainda verificando; só faz sentido com a permissão concedida
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (support !== "granted") return;
    let cancelled = false;
    (async () => {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const sub = await registration?.pushManager.getSubscription();
      // A inscrição do navegador precisa ser desta conta: outra conta no mesmo aparelho não conta.
      const mine = sub ? await isMySubscription(sub.endpoint) : false;
      if (!cancelled) setSubscribed(mine);
    })().catch(() => {
      if (!cancelled) setSubscribed(false);
    });
    return () => {
      cancelled = true;
    };
  }, [support]);

  if (!publicKey || support === "checking") return null;

  async function enable() {
    if (!publicKey) return;
    setBusy(true);
    try {
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      notifyPushStateChanged();
      if (permission !== "granted") {
        toast.info(
          permission === "denied"
            ? "Os avisos ficaram bloqueados. Dá para liberar nas configurações do navegador."
            : "Tudo bem. Você pode ativar quando quiser.",
        );
        return;
      }
      const registration = await withTimeout(registerWorker(), 15_000);
      const subscription = await withTimeout(subscribeBrowser(registration, publicKey), 20_000);
      const result = await saveSubscription(subscription.toJSON());
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSubscribed(true);
      toast.success("Avisos ativados neste aparelho.");
    } catch (error) {
      console.error("[push] Falha ao ativar:", error instanceof Error ? error.message : error);
      toast.error("Não conseguimos ativar os avisos neste aparelho. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await removeSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      toast.success("Avisos desativados neste aparelho.");
    } catch {
      toast.error("Não conseguimos desativar agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      const result = await sendTestPush();
      if (result.success) toast.success("Aviso de teste enviado. Ele deve chegar em instantes.");
      else toast.error(result.error);
    } catch {
      toast.error("Não conseguimos enviar o teste agora.");
    } finally {
      setTesting(false);
    }
  }

  const needsActivation = support === "default" || (support === "granted" && subscribed === false);

  if (variant === "compact") {
    if (!needsActivation) return null;
    return (
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        className={cn(
          "flex min-h-11 w-full cursor-pointer items-center gap-2.5 border-t border-linha bg-ameixa-suave/50 px-4 text-left text-sm font-semibold text-ameixa transition-colors hover:bg-ameixa-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ameixa disabled:opacity-60",
          className,
        )}
      >
        {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <BellRing aria-hidden="true" className="size-4" />}
        Ativar avisos neste aparelho
      </button>
    );
  }

  const on = support === "granted" && subscribed === true;

  return (
    <section
      aria-labelledby="push-card-titulo"
      className={cn("flex flex-col gap-4 rounded-2xl border border-linha bg-papel p-4 shadow-[var(--shadow-aceito-1)] sm:p-5", className)}
    >
      <div className="flex items-start gap-3.5">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-ameixa-suave text-ameixa">
          <Smartphone className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="push-card-titulo" className="text-base font-semibold text-tinta">
            Avisos neste aparelho
          </h3>
          <p className="mt-0.5 text-[15px] leading-[22px] text-tinta-suave">
            {on
              ? "Ativados. Você recebe um aviso aqui, mesmo com o Aceito fechado."
              : support === "denied"
                ? "Os avisos estão bloqueados neste navegador."
                : support === "ios-install"
                  ? "No iPhone, os avisos funcionam depois de instalar o Aceito na tela de início."
                  : support === "unsupported"
                    ? "Este navegador não oferece avisos no aparelho. Eles continuam aparecendo no sino."
                    : "Receba um aviso no celular ou no computador quando algo importante acontecer, sem precisar abrir o Aceito."}
          </p>
        </div>
        {support === "granted" && (
          <ToggleSwitch
            checked={on}
            onChange={(next) => void (next ? enable() : disable())}
            label="Avisos neste aparelho"
            busy={busy || subscribed === null}
          />
        )}
      </div>

      {support === "denied" && (
        <ol className="list-decimal space-y-1 pl-9 text-sm leading-5 text-tinta-suave">
          <li>Toque no cadeado ao lado do endereço do site.</li>
          <li>Abra as permissões do site e mude Notificações para Permitir.</li>
          <li>Volte para esta página e ative os avisos.</li>
        </ol>
      )}

      {support === "ios-install" && (
        <ol className="list-decimal space-y-1 pl-9 text-sm leading-5 text-tinta-suave">
          <li>No Safari, toque em Compartilhar (o quadrado com a seta para cima).</li>
          <li>Escolha Adicionar à Tela de Início.</li>
          <li>Abra o Aceito pelo ícone novo e volte aqui para ativar os avisos.</li>
          <li className="list-none -ml-5 pt-1 text-xs">Precisa do iOS 16.4 ou mais novo.</li>
        </ol>
      )}

      {needsActivation && (
        <button type="button" onClick={enable} disabled={busy} className={cn(BTN, "w-fit bg-ameixa text-on-ameixa hover:bg-ameixa-hover")}>
          {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <BellRing aria-hidden="true" className="size-4" />}
          Ativar avisos neste aparelho
        </button>
      )}

      {on && (
        <button
          type="button"
          onClick={test}
          disabled={testing}
          className={cn(BTN, "w-fit border border-linha-forte bg-papel text-tinta hover:border-ameixa hover:bg-ameixa-suave")}
        >
          {testing ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
          Enviar um aviso de teste
        </button>
      )}
    </section>
  );
}
