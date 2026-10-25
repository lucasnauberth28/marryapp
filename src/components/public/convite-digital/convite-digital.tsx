"use client";
// O convite digital: o envelope fechado e, ao tocar, a carta animada. Usa o modelo (cores, letras e forma das fotos) do site do casal.
import { prepararDadosDoSite } from "@/components/public/site-do-casamento/dados-do-site";
import { CLASSES_DAS_FONTES } from "@/components/public/site-do-casamento/modelos/fontes";
import "@/components/public/site-do-casamento/modelos/modelos.css";
import type { ConfiguracoesDoSiteDoCasamento } from "@/components/public/site-do-casamento/tipos";
import { caminhoDoSiteDoCasamento } from "@/lib/casamento/wedding-links";
import { Carta } from "./carta";
import "./convite-digital.css";
import { Envelope } from "./envelope";
import { useAbertura } from "./use-abertura";

interface Propriedades {
  slug: string;
  settings: ConfiguracoesDoSiteDoCasamento | null;
  nomeDoConvidado: string | null;
  frase: string | null;
}

export function ConviteDigital({ slug, settings, nomeDoConvidado, frase }: Propriedades) {
  const site = prepararDadosDoSite({ slug, settings, storyItems: [], tips: [], gifts: [] });
  const { fase, abrir } = useAbertura();
  return (
    <div style={site.themeStyle} data-modelo={site.modelo.id} className={`${CLASSES_DAS_FONTES} min-h-dvh bg-linho font-sans text-tinta antialiased`}>
      {fase === "aberto" ? (
        <Carta site={site} nomeDoConvidado={nomeDoConvidado} frase={frase} enderecoDoSite={caminhoDoSiteDoCasamento(slug)} />
      ) : (
        <Envelope iniciais={site.initials} nomeDoConvidado={nomeDoConvidado} fase={fase} aoAbrir={abrir} />
      )}
    </div>
  );
}
