"use client";

import { Compass } from "lucide-react";
import { ItemDoMenuSuspenso } from "@/components/ui/dropdown-menu";
import { Botao } from "@/components/ui/button";
import { Cartao, ConteudoDoCartao, DescricaoDoCartao, CabecalhoDoCartao, TituloDoCartao } from "@/components/ui/card";
import { useTour } from "./panel-tour-provider";

/** Item "Ver o passo a passo" do menu da conta. Some quando a conta não tem o passo a passo. */
export function ItemDeMenuDoTour() {
  const { available, start } = useTour();
  if (!available) return null;
  return (
    <ItemDoMenuSuspenso onSelect={() => start()} className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-tinta">
      <Compass className="h-4 w-4 text-tinta-suave" aria-hidden="true" /> Ver o passo a passo
    </ItemDoMenuSuspenso>
  );
}

/** Cartão das Configurações para rever o passo a passo de novo, quando quiser. */
export function CartaoDeConfiguracaoDoTour() {
  const { available, start } = useTour();
  if (!available) return null;
  return (
    <Cartao className="gap-4">
      <CabecalhoDoCartao>
        <TituloDoCartao>Passo a passo do painel</TituloDoCartao>
        <DescricaoDoCartao>Revejam onde fica cada área do painel e o que dá para fazer em cada uma.</DescricaoDoCartao>
      </CabecalhoDoCartao>
      <ConteudoDoCartao>
        <Botao variant="outline" onClick={() => start()}>
          Ver o passo a passo de novo
        </Botao>
      </ConteudoDoCartao>
    </Cartao>
  );
}
