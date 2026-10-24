import type { MetadataRoute } from "next";

// App instalável (Adicionar à Tela de Início). Abre em /login, que já leva quem tem sessão
// ao painel certo (casal ou fornecedor) e quem não tem ao formulário de entrada.
// Cores do Kit de Marca: abertura em papel e barra do sistema em ameixa.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Aceito",
    short_name: "Aceito",
    description: "Site do casamento, confirmações de presença e presentes em dinheiro.",
    lang: "pt-BR",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FCFBFA",
    theme_color: "#5E2B4E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
