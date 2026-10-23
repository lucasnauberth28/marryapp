import { CircleDollarSign, Mail } from "lucide-react";
import { GIFT_FEE_LABEL } from "@/lib/gift-fee";
import { HeroDemo } from "./hero-demo";
import { LinkButton } from "./home-ui";

/** Primeira dobra: a oferta em duas linhas, os dois botões e o produto de verdade ao lado (dados fictícios). */
export function Hero() {
  return (
    <section className="lp-hero lp-dentro" aria-labelledby="lp-h1">
      <div className="lp-hero-bloco">
        <div className="lp-hero-texto">
          <h1 className="lp-titulo lp-h1" id="lp-h1">
            <span>Um convite para cada convidado.</span>
            <span className="lp-cor">Presentes com taxa de {GIFT_FEE_LABEL}.</span>
          </h1>
          <p className="lp-lead">O site do casamento, as confirmações de presença e os presentes em dinheiro, num painel só.</p>
          <div className="lp-acoes">
            <LinkButton href="/cadastro?plano=basic" arrow>
              Criar conta grátis
            </LinkButton>
            <LinkButton href="/#como" tone="branco">
              Ver como funciona
            </LinkButton>
          </div>
          <ul className="lp-beneficios">
            <li>
              <span className="lp-bola" aria-hidden="true">
                <Mail className="lp-ico" />
              </span>
              <b>Convidado sem conta</b>
              <span>Responde pelo próprio convite.</span>
            </li>
            <li>
              <span className="lp-bola" aria-hidden="true">
                <CircleDollarSign className="lp-ico" />
              </span>
              <b>Básico sem mensalidade</b>
              <span>Taxa de {GIFT_FEE_LABEL} por presente.</span>
            </li>
          </ul>
        </div>
        <HeroDemo />
      </div>
    </section>
  );
}
