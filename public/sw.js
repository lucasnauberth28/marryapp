// Service worker do Aceito: só avisos no aparelho (Web Push). Não guarda páginas em cache
// e não intercepta requisições, então o app continua exatamente como no navegador.
// Registrado apenas quando a pessoa ativa os avisos (ver components/notifications/push-card.tsx).

const FALLBACK_TITLE = "Aceito";
const ICON = "/icons/icon-192.png";
const BADGE = "/icons/badge-96.png";

self.addEventListener("install", () => {
  // Versão nova assume na hora, sem esperar fechar todas as abas.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/** Só caminhos do próprio site: um push nunca leva a outro endereço. */
function safeUrl(href) {
  try {
    const url = new URL(typeof href === "string" ? href : "/", self.location.origin);
    return url.origin === self.location.origin ? url.href : self.location.origin + "/";
  } catch {
    return self.location.origin + "/";
  }
}

self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }
  const title = typeof data.title === "string" && data.title ? data.title : FALLBACK_TITLE;
  const options = {
    body: typeof data.body === "string" ? data.body : "",
    icon: typeof data.icon === "string" ? data.icon : ICON,
    badge: typeof data.badge === "string" ? data.badge : BADGE,
    lang: "pt-BR",
    // Mesma tag = o aviso novo substitui o antigo na bandeja (webhook repetido não empilha)
    tag: typeof data.tag === "string" ? data.tag : undefined,
    data: { href: typeof data.href === "string" ? data.href : "/" },
  };
  // Navegadores exigem mostrar sempre um aviso quando chega um push.
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = safeUrl(event.notification.data && event.notification.data.href);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Já existe uma aba do Aceito aberta: foca nela e leva ao destino.
      for (const client of windows) {
        if (new URL(client.url).origin !== self.location.origin) continue;
        try {
          if ("navigate" in client) await client.navigate(target);
          if ("focus" in client) await client.focus();
          return;
        } catch {
          // Cliente que não aceita navegar: tenta abrir uma janela nova abaixo.
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
