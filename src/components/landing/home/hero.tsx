import { Check } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { HeroDemo } from "./hero-demo";
import { LinkEmFormaDeBotao } from "./home-ui";

/** Primeira dobra: a oferta em duas linhas, os dois botões e o produto de verdade ao lado (dados fictícios). */
export function Destaque() {
  return (
    <section className="lp-hero lp-dentro" aria-labelledby="lp-h1">
      <div className="lp-hero-bloco">
        <Aparicao className="lp-hero-texto">
          <h1 className="lp-titulo lp-h1" id="lp-h1">
            <span>Um convite para cada convidado.</span>
            <span className="lp-cor">Comece grátis, sem cartão.</span>
          </h1>
          <p className="lp-lead">O site do casamento, as confirmações de presença e os presentes em dinheiro, num painel só.</p>
          <div className="lp-acoes">
            <LinkEmFormaDeBotao href="/cadastro?plano=basic" arrow>
              Criar conta grátis
            </LinkEmFormaDeBotao>
            <LinkEmFormaDeBotao href="/#como" tone="branco">
              Ver como funciona
            </LinkEmFormaDeBotao>
          </div>
          <ul className="lp-garantias">
            <li>
              <Check aria-hidden="true" className="lp-ico" />
              Convidado sem conta
            </li>
            <li>
              <Check aria-hidden="true" className="lp-ico" />
              Sem mensalidade
            </li>
          </ul>
        </Aparicao>
        <Aparicao variant="right" delay={160} className="lp-hero-visual-reveal">
          <HeroDemo />
        </Aparicao>
      </div>
    </section>
  );
}
