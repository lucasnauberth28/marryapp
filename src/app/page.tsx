import type { Metadata } from "next";
import { Closing, HomeFaq } from "@/components/landing/home/faq-closing";
import { LizSection, PartySection, VendorsSection } from "@/components/landing/home/extras";
import { GiftsSection } from "@/components/landing/home/gifts";
import { HomeFooter } from "@/components/landing/home/home-footer";
import { HomeHeader } from "@/components/landing/home/home-header";
import { Frame, Hatch } from "@/components/landing/home/home-ui";
import { Hero } from "@/components/landing/home/hero";
import { FunctionsStrip, Steps } from "@/components/landing/home/intro";
import { PlansSection } from "@/components/landing/home/plans";
import { GuestsSection, PanelSection, SiteSection } from "@/components/landing/home/product";
import { getCatalog } from "@/lib/catalog-server";
import { planLabel } from "@/lib/plan-copy";
import "@/components/landing/home/home.css";

// Os preços vêm do catálogo da administração: a página se refaz sozinha a cada 5 minutos e na hora que um preço muda.
export const revalidate = 300;

const TITLE = "Aceito | Site de casamento, convidados e presentes em dinheiro";
const DESCRIPTION =
  "Criem o site do casamento, acompanhem confirmações de presença e recebam presentes em dinheiro com o Aceito. Conheçam os planos e as taxas.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://meuaceito.com.br"),
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "pt_BR", siteName: "Aceito", url: "/", title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default async function Home() {
  const catalog = await getCatalog();
  const classic = planLabel(catalog.plans.classic.name);
  const vip = planLabel(catalog.plans.vip.name);
  return (
    <div className="lp">
      <a href="#conteudo" className="lp-pular">
        Pular para o conteúdo
      </a>
      <HomeHeader />
      <main id="conteudo">
        <Frame>
          <Hero />
          <FunctionsStrip />
          <Steps classic={classic} vip={vip} />
          <GuestsSection classic={classic} vip={vip} />
          <PanelSection />
          <SiteSection vip={vip} />
        </Frame>
        <GiftsSection classic={classic} vip={vip} />
        <Frame>
          <Hatch />
          <LizSection />
          <PartySection classic={classic} vip={vip} />
          <VendorsSection />
          <PlansSection catalog={catalog} />
          <div aria-hidden="true" className="lp-divisa lp-cruz" />
          <HomeFaq catalog={catalog} />
          <Closing />
          <Hatch />
        </Frame>
      </main>
      <HomeFooter />
    </div>
  );
}
