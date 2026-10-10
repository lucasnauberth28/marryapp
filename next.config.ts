import type { NextConfig } from "next";
import { storageRemotePattern } from "./src/lib/image-source";

const isDev = process.env.NODE_ENV !== "production";

// CSP estática, sem nonce (decisão deliberada). Nonce exige renderização dinâmica em toda requisição
// (o Next precisa ler o header por página), o que tiraria do cache estático a home, /termos,
// /privacidade, /login etc. e encareceria a primeira carga das páginas públicas. Por isso o script-src
// mantém 'unsafe-inline' (bootstrap do Next sem nonce). O que compensa: scripts só de origens listadas,
// sem plugins (object-src), sem <base> injetado, formulários só para o próprio site e sem enquadramento
// em outros sites. Reavaliar se um dia houver conteúdo HTML de terceiros renderizado nas páginas.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://sdk.mercadopago.com https://*.mercadopago.com https://*.mlstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.mercadopago.com https://*.mercadolibre.com https://*.mercadolivre.com",
  "frame-src 'self' https://*.mercadopago.com https://*.mercadolibre.com",
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// Fotos de usuário ficam no Supabase Storage (bucket público); só esse caminho passa pelo otimizador.
const storagePattern = storageRemotePattern(process.env.NEXT_PUBLIC_SUPABASE_URL);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: storagePattern ? [storagePattern] : [],
  },
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
