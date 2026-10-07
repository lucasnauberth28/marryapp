import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CSP estática (sem nonce, para manter as páginas públicas cacheáveis).
// 'unsafe-inline' em scripts é necessário para o bootstrap do Next sem nonce; as demais diretivas
// ainda bloqueiam clickjacking, plugins, <base> injetado, envio de formulários a terceiros e
// carregamento de scripts de domínios não listados.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://sdk.mercadopago.com https://*.mercadopago.com https://*.mlstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.mercadopago.com https://*.mercadolibre.com https://*.mercadolivre.com https://*.supabase.co",
  "frame-src 'self' https://*.mercadopago.com https://*.mercadolibre.com https://open.spotify.com https://www.google.com https://maps.google.com",
  "worker-src 'self' blob:",
  "media-src 'self' blob: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Cadastro de fornecedor envia logo + galeria (até 8 imagens) em uma única action
      bodySizeLimit: "8mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
