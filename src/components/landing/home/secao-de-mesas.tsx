import { MapaDoSalao } from "@/components/mesas/mapa-do-salao";
import { Link2, MousePointerClick, Search, Sparkles } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { LinkEmFormaDeBotao, CabecalhoDaSecao } from "./home-ui";

const PASSOS = [
  { icon: Sparkles, titulo: "Criem as mesas", texto: "Deem um nome e o número de lugares de cada uma." },
  { icon: MousePointerClick, titulo: "Sentem arrastando", texto: "Levem cada convidado até a mesa e vejam o salão de cima." },
  { icon: Link2, titulo: "Compartilhem o link", texto: "Só de leitura: cada um acha a própria mesa pelo nome. Só vocês alteram." },
];

// Mapa de exemplo, com mesas fictícias
const MESAS_DE_EXEMPLO = [
  { id: "1", name: "Família da noiva", capacity: 8, occupied: 8 },
  { id: "2", name: "Família do noivo", capacity: 8, occupied: 7 },
  { id: "3", name: "Amigos da faculdade", capacity: 8, occupied: 6 },
  { id: "4", name: "Padrinhos", capacity: 6, occupied: 6 },
  { id: "5", name: "Trabalho", capacity: 8, occupied: 4 },
  { id: "6", name: "Primos", capacity: 8, occupied: 0 },
];

function PalcoDoMapa() {
  return (
    <div className="lp-3d-palco">
      <MapaDoSalao mesas={MESAS_DE_EXEMPLO} className="lp-mapa" />
      <div className="lp-3d-busca" role="note" aria-label="Exemplo do link compartilhado">
        <p className="lp-3d-busca-t">Encontre a sua mesa</p>
        <p className="lp-3d-campo">
          <Search aria-hidden="true" className="lp-ico" />
          Marina
        </p>
        <p className="lp-3d-res">
          <span>Marina Alves</span>
          <b>Mesa 3</b>
        </p>
      </div>
    </div>
  );
}

/** Mapa do salão: as mesas vistas de cima, os convidados sentados e o link só de leitura para compartilhar. */
export function SecaoDeMesas() {
  return (
    <section className="lp-sec lp-dentro" id="mesas" aria-labelledby="lp-t-mesas">
      <CabecalhoDaSecao
        id="lp-t-mesas"
        chip="Mapa do salão"
        title="Sentem os convidados"
        accent="vendo o salão de cima."
        lead="Montem as mesas, imprimam o mapa para o buffet e mandem um link para cada convidado achar o próprio lugar."
      />
      <Aparicao variant="scale" className="lp-3d">
        <PalcoDoMapa />
      </Aparicao>
      <ul className="lp-3d-passos">
        {PASSOS.map(({ icon: Icon, titulo, texto }, i) => (
          <Aparicao as="li" key={titulo} delay={i * 100}>
            <span className="lp-ic" aria-hidden="true">
              <Icon className="lp-ico" />
            </span>
            <h3>{titulo}</h3>
            <p>{texto}</p>
          </Aparicao>
        ))}
      </ul>
      <Aparicao className="lp-3d-cta">
        <LinkEmFormaDeBotao href="/cadastro" arrow>
          Montar as mesas
        </LinkEmFormaDeBotao>
        <p className="lp-mudo lp-nota">Em todos os planos, inclusive o Básico. Mapa de exemplo, com convidados fictícios.</p>
      </Aparicao>
    </section>
  );
}
