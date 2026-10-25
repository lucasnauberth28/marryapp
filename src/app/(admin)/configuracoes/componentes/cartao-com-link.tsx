import Link from "next/link";
import { Botao } from "@/components/ui/button";
import { Cartao, CabecalhoDoCartao, ConteudoDoCartao, DescricaoDoCartao, TituloDoCartao } from "@/components/ui/card";

interface PropriedadesDoCartaoComLink {
  titulo: string;
  descricao: string;
  href: string;
  rotulo: string;
}

/** Cartão que explica um assunto e leva para a tela dele. */
export function CartaoComLink({ titulo, descricao, href, rotulo }: PropriedadesDoCartaoComLink) {
  return (
    <Cartao className="gap-4">
      <CabecalhoDoCartao>
        <TituloDoCartao>{titulo}</TituloDoCartao>
        <DescricaoDoCartao>{descricao}</DescricaoDoCartao>
      </CabecalhoDoCartao>
      <ConteudoDoCartao>
        <Botao asChild variant="outline">
          <Link href={href}>{rotulo}</Link>
        </Botao>
      </ConteudoDoCartao>
    </Cartao>
  );
}
