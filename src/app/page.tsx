import type { Metadata } from "next";
import { Encerramento, PerguntasFrequentesDaHome } from "@/components/landing/home/faq-closing";
import { SecaoDaLiz, SecaoDaFesta, SecaoDeFornecedores } from "@/components/landing/home/extras";
import { SecaoDeMesas } from "@/components/landing/home/secao-de-mesas";
import { SecaoDeModelos } from "@/components/landing/home/secao-de-modelos";
import { SecaoDePresentes } from "@/components/landing/home/gifts";
import { RodapeDaHome } from "@/components/landing/home/home-footer";
import { CabecalhoDaHome } from "@/components/landing/home/home-header";
import { Moldura } from "@/components/landing/home/home-ui";
import { Destaque } from "@/components/landing/home/hero";
import { FaixaDeFuncoes, Passos } from "@/components/landing/home/intro";
import { SecaoDePlanos } from "@/components/landing/home/plans";
import { SecaoDeConvidados, SecaoDoPainel, SecaoDoSite } from "@/components/landing/home/product";
import { RolagemSuave } from "@/components/motion/smooth-scroll";
import { obterCatalogo } from "@/lib/pagamento/catalog-server";
import { compartilhamentoDaMarca } from "@/lib/brand-meta";
import { rotuloDoPlano } from "@/lib/pagamento/plan-copy";
import "@/components/landing/home/home.css";

// Os preços vêm do catálogo da administração: a página se refaz sozinha a cada 5 minutos e na hora que um preço muda.
export const revalidate = 300;

const TITULO = "Aceito | Site de casamento, convidados e presentes em dinheiro";
const DESCRICAO =
  "Criem o site do casamento, acompanhem confirmações de presença e recebam presentes em dinheiro com o Aceito. Conheçam os planos e as taxas.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://meuaceito.com.br"),
  title: { absolute: TITULO },
  description: DESCRICAO,
  alternates: { canonical: "/" },
  ...compartilhamentoDaMarca({ title: TITULO, description: DESCRICAO, url: "/" }),
};

export default async function Home() {
  const catalog = await obterCatalogo();
  const classic = rotuloDoPlano(catalog.plans.classic.name);
  const vip = rotuloDoPlano(catalog.plans.vip.name);
  return (
    <div className="lp">
      <RolagemSuave />
      <a href="#conteudo" className="lp-pular">
        Pular para o conteúdo
      </a>
      <CabecalhoDaHome />
      <main id="conteudo">
        <Moldura>
          <Destaque />
          <FaixaDeFuncoes />
          <Passos classic={classic} vip={vip} />
          <SecaoDeConvidados classic={classic} vip={vip} />
          <SecaoDoPainel />
          <SecaoDoSite vip={vip} />
          <SecaoDeModelos />
        </Moldura>
        <SecaoDePresentes classic={classic} vip={vip} />
        <Moldura>
          <SecaoDaLiz />
          <SecaoDeMesas vip={vip} />
          <SecaoDaFesta classic={classic} vip={vip} />
          <SecaoDeFornecedores />
          <SecaoDePlanos catalog={catalog} />
          <PerguntasFrequentesDaHome catalog={catalog} />
          <Encerramento />
        </Moldura>
      </main>
      <RodapeDaHome />
    </div>
  );
}
