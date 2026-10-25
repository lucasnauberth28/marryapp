// O lado do navegador do push: service worker, inscrição e o limite de tempo para o serviço do navegador responder.
import { urlBase64ParaBytes } from "@/lib/notifications/push-support";

/** O serviço de push do navegador às vezes não responde (rede bloqueada, sem internet): não deixa a tela girando para sempre. */
export function comLimiteDeTempo<T>(promise: Promise<T>, ms: number): Promise<T> {
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

export async function registrarTrabalhador() {
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  await navigator.serviceWorker.ready;
  return registration;
}

/** Cria (ou reaproveita) a inscrição do navegador. Se as chaves do servidor mudaram, refaz a inscrição. */
export async function inscreverNavegador(registration: ServiceWorkerRegistration, publicKey: string) {
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  const options = { userVisibleOnly: true, applicationServerKey: urlBase64ParaBytes(publicKey) };
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
