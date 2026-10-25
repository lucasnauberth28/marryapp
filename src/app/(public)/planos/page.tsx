import type { Metadata } from "next";
import Link from "next/link";
import { CartaoDoPlanoDoCasal } from "@/components/landing/couple-plan-card";
import { RodapeDaLanding } from "@/components/landing/landing-footer";
import { SecaoDePerguntasFrequentes } from "@/components/landing/faq-section";
import { CabecalhoDaLanding } from "@/components/landing/landing-header";
import { estiloDoContainerDaLanding, estiloDoTextoDeApoio, estiloDoSobretituloDaLanding } from "@/components/landing/styles";
import { compartilhamentoDaMarca } from "@/lib/brand-meta";
import { obterCatalogo } from "@/lib/catalog-server";
import { cn } from "@/lib/utils";
import { SecaoDePlanosDeFornecedor } from "./componentes/planos-de-fornecedor";
import { SecaoDeTaxasDosPresentes, estiloDoLinkDeTexto } from "./componentes/presentes-e-taxas";

// Os preços vêm do catálogo da administração: a página se refaz sozinha a cada 5 minutos e na hora que um preço muda.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Planos",
  description: "Escolham o plano do casamento: o Básico não tem mensalidade, Classic e VIP têm pagamento único. Veja os recursos e as taxas sobre presentes.",
  ...compartilhamentoDaMarca({
    title: "Planos · Aceito",
    description: "Escolham o plano do casamento: o Básico não tem mensalidade, Classic e VIP têm pagamento único.",
    url: "/planos",
  }),
};

const CHAVES_DOS_PLANOS_DO_CASAL = ["basic", "classic", "vip"] as const;

export default async function PlanosPage() {
  const catalog = await obterCatalogo();
  return (
    <div className="bg-linho text-tinta">
      <CabecalhoDaLanding />

      <div>
        <section aria-labelledby="planos-titulo" className={cn(estiloDoContainerDaLanding, "flex flex-col items-center gap-4 pb-8 pt-12 text-center sm:pt-16")}>
          <p className={estiloDoSobretituloDaLanding}>Planos para casais</p>
          <h1
            id="planos-titulo"
            className="max-w-[20ch] font-display text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-balance sm:text-[clamp(40px,5vw,60px)]"
          >
            Escolham o plano para o casamento de vocês
          </h1>
          <p className={cn(estiloDoTextoDeApoio, "max-w-[60ch]")}>
            O Básico não tem mensalidade. Classic e VIP têm pagamento único. As taxas sobre presentes e os recursos incluídos variam
            conforme o plano.
          </p>
        </section>

        <section id="casais" aria-label="Planos para casais" className={cn(estiloDoContainerDaLanding, "scroll-mt-24 pb-12 pt-6")}>
          <ul className="grid gap-6 md:grid-cols-3">
            {CHAVES_DOS_PLANOS_DO_CASAL.map((key) => (
              <li key={key}>
                <CartaoDoPlanoDoCasal planKey={key} plan={catalog.plans[key]} href={`/cadastro?tipo=casal&plano=${key}`} />
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[15px] leading-6 text-tinta-suave">
            Precisam só de algumas partes?{" "}
            <Link href="/monte-seu-plano" className={estiloDoLinkDeTexto}>
              Montem o plano de vocês
            </Link>
            .
          </p>
        </section>

        <SecaoDeTaxasDosPresentes catalog={catalog} />

        <SecaoDePerguntasFrequentes />

        <SecaoDePlanosDeFornecedor catalog={catalog} />
      </div>

      <RodapeDaLanding />
    </div>
  );
}
