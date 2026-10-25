"use client";

// O estado do push neste aparelho (inscrito ou não) e as três ações do cartão: ativar, desativar e testar.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ehMinhaInscricao, removerInscricao, salvarInscricao, enviarPushDeTeste } from "@/actions/push-actions";
import { comLimiteDeTempo, inscreverNavegador, registrarTrabalhador } from "./push-inscricao";
import type { SituacaoDoSuporteAoPush } from "@/lib/notifications/push-support";
import { avisarMudancaNoPush } from "./use-push-state";

/** null = ainda verificando; só faz sentido com a permissão concedida. A inscrição precisa ser desta conta. */
function useEstaInscrito(support: SituacaoDoSuporteAoPush) {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    if (support !== "granted") return;
    let cancelled = false;
    (async () => {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const sub = await registration?.pushManager.getSubscription();
      // A inscrição do navegador precisa ser desta conta: outra conta no mesmo aparelho não conta.
      const mine = sub ? await ehMinhaInscricao(sub.endpoint) : false;
      if (!cancelled) setSubscribed(mine);
    })().catch(() => {
      if (!cancelled) setSubscribed(false);
    });
    return () => {
      cancelled = true;
    };
  }, [support]);

  return [subscribed, setSubscribed] as const;
}

async function pedirPermissao() {
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  avisarMudancaNoPush();
  if (permission === "granted") return true;
  toast.info(permission === "denied" ? "Os avisos ficaram bloqueados. Dá para liberar nas configurações do navegador." : "Tudo bem. Você pode ativar quando quiser.");
  return false;
}

function useTestarPush() {
  const [testing, setTesting] = useState(false);

  async function test() {
    setTesting(true);
    try {
      const result = await enviarPushDeTeste();
      if (result.success) toast.success("Aviso de teste enviado. Ele deve chegar em instantes.");
      else toast.error(result.error);
    } catch {
      toast.error("Não conseguimos enviar o teste agora.");
    } finally {
      setTesting(false);
    }
  }
  return { testing, test };
}

export function usePushAcoes(support: SituacaoDoSuporteAoPush, publicKey: string | null) {
  const [subscribed, setSubscribed] = useEstaInscrito(support);
  const [busy, setBusy] = useState(false);
  const { testing, test } = useTestarPush();

  async function enable() {
    if (!publicKey) return;
    setBusy(true);
    try {
      if (!(await pedirPermissao())) return;
      const registration = await comLimiteDeTempo(registrarTrabalhador(), 15_000);
      const subscription = await comLimiteDeTempo(inscreverNavegador(registration, publicKey), 20_000);
      const result = await salvarInscricao(subscription.toJSON());
      if (!result.success) return void toast.error(result.error);
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
        await removerInscricao(subscription.endpoint);
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

  return { subscribed, busy, testing, enable, disable, test };
}
