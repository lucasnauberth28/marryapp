import type { MetadataRoute } from "next";

// App instalável (Adicionar à Tela de Início). Abre em /login, que já leva quem tem sessão
// ao painel certo (casal ou fornecedor) e quem não tem ao formulário de entrada.
// As cores seguem o fundo linho do painel, para a barra do sistema e a abertura combinarem.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Aceito",
    short_name: "Aceito",
    description: "Do convite ao grande dia, tudo num só sim.",
    lang: "pt-BR",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F3EC",
    theme_color: "#F7F3EC",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
