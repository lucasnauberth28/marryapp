import Image from "next/image";
import { Aparicao } from "@/components/motion/reveal";
import { MODELOS_DO_SITE } from "@/components/public/site-do-casamento/modelos/catalogo";
import { CabecalhoDaSecao, LinkEmFormaDeBotao } from "./home-ui";
import "./secao-de-modelos.css";

/** Os oito modelos de site, com o desenho real de cada um: o casal escolhe, envia as fotos e preenche os dados. */
export function SecaoDeModelos() {
  return (
    <section className="lp-sec lp-dentro" id="modelos" aria-labelledby="lp-t-modelos">
      <CabecalhoDaSecao
        id="lp-t-modelos"
        chip="Modelos de site"
        title="Escolham um modelo,"
        accent="enviem as fotos."
        lead="São oito desenhos prontos, cada um com cores, letras e composição próprias. Vocês preenchem os dados e escolhem as seções que ficam."
      />
      <Aparicao variant="scale">
        <ul className="lp-modelos">
          {MODELOS_DO_SITE.map((m) => (
            <li key={m.id}>
              <Image src={`/images/modelos/${m.id}.webp`} alt={`Modelo ${m.nome}: ${m.descricao}`} width={800} height={500} sizes="(min-width: 1024px) 270px, (min-width: 640px) 45vw, 90vw" />
              <span className="lp-modelos-nome">{m.nome}</span>
              <span className="lp-modelos-texto">{m.descricao}</span>
            </li>
          ))}
        </ul>
      </Aparicao>
      <p className="lp-modelos-cta">
        <LinkEmFormaDeBotao href="/cadastro?plano=basic" arrow>
          Criar meu site grátis
        </LinkEmFormaDeBotao>
      </p>
    </section>
  );
}
