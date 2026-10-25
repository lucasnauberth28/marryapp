import Link from "next/link";
import { Check } from "lucide-react";
import type { Catalogo } from "@/lib/catalog";
import { ROTULO_DA_TAXA_DO_PRESENTE } from "@/lib/gift-fee";
import { notaDoPrecoDoCasal, rotuloDoPlano, type ChaveDoPlanoDoCasal } from "@/lib/plan-copy";
import { Aparicao } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { centavosDoPontoDeEquilibrio, separarPreco } from "./home-money";
import { formatarReais } from "@/lib/formatacao/dinheiro";
import { LinkEmFormaDeBotao, CabecalhoDaSecao } from "./home-ui";

const CHAVES_DOS_PLANOS: ChaveDoPlanoDoCasal[] = ["basic", "classic", "vip"];

/** Planos de casal. Nome, preço e recursos vêm do catálogo; a taxa vem de GIFT_FEE_LABEL. */
export function SecaoDePlanos({ catalog }: { catalog: Catalogo }) {
  const classic = rotuloDoPlano(catalog.plans.classic.name);
  const destaque = (key: ChaveDoPlanoDoCasal) => ({
    basic: <>Taxa de {ROTULO_DA_TAXA_DO_PRESENTE} por presente.</>,
    classic: <>Pix sem a taxa do Aceito.</>,
    vip: <>Tudo do {classic}.</>,
  })[key];
  const aPartirDe = centavosDoPontoDeEquilibrio(catalog.plans.classic.price);

  return (
    <section className="lp-sec lp-dentro" id="planos" aria-labelledby="lp-t-planos">
      <CabecalhoDaSecao id="lp-t-planos" chip="Planos" title="Comecem grátis." accent="Paguem uma vez, se quiserem." />
      <div className="lp-planos">
        {CHAVES_DOS_PLANOS.map((key, idx) => {
          const plan = catalog.plans[key];
          const label = rotuloDoPlano(plan.name);
          const { reais, centavos } = separarPreco(plan.price);
          const rec = key === "classic";
          const features = key === "basic" ? plan.features.filter((f) => !/^Taxa de /.test(f)) : plan.features;
          return (
            <Aparicao as="article" key={key} delay={idx * 100} className={cn("lp-plano", rec && "lp-rec")} aria-labelledby={`lp-p-${key}`}>
              <div className="lp-plano-cab">
                <h3 id={`lp-p-${key}`}>{label}</h3>
                {rec ? <span className="lp-chip lp-chip-ameixa">Recomendado</span> : null}
              </div>
              <div>
                <p className="lp-preco">
                  <span className="lp-rs">R$</span>
                  {reais}
                  <span className="lp-cent">,{centavos}</span>
                </p>
                <p className="lp-cond">
                  {key === "basic" ? "Sem mensalidade" : notaDoPrecoDoCasal(key).replace(/^./, (c) => c.toUpperCase())}. <b>{destaque(key)}</b>
                </p>
              </div>
              <ul>
                {features.map((f) => (
                  <li key={f}>
                    <Check aria-hidden="true" className="lp-ico" />
                    {f}
                  </li>
                ))}
              </ul>
              <LinkEmFormaDeBotao href={`/cadastro?plano=${key}`} tone={rec ? "ameixa" : "branco"}>
                {key === "basic" ? "Criar conta grátis" : `Escolher ${label}`}
              </LinkEmFormaDeBotao>
            </Aparicao>
          );
        })}
      </div>
      <p className="lp-compensa">
        O {classic} compensa a partir de <b>{formatarReais(aPartirDe)}</b> em presentes por Pix.
      </p>
      <p className="lp-compensa">
        Precisam só de algumas partes?{" "}
        <Link href="/monte-seu-plano" className="lp-link">
          Montem o plano de vocês
        </Link>
        . Para ver taxas e condições,{" "}
        <Link href="/planos" className="lp-link">
          comparem os planos
        </Link>
        .
      </p>
    </section>
  );
}
