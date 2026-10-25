import Image from "next/image";
import { Link2, MousePointerClick, Search, Sparkles } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { LinkEmFormaDeBotao, CabecalhoDaSecao } from "./home-ui";

const CENARIOS = [
  { id: "jardim", nome: "Jardim ao entardecer" },
  { id: "classico", nome: "Salão clássico" },
  { id: "rustico", nome: "Galpão rústico" },
];
const PASSOS = [
  { icon: Sparkles, titulo: "Escolham o cenário", texto: "Jardim, salão clássico ou galpão rústico." },
  { icon: MousePointerClick, titulo: "Sentem arrastando", texto: "Levem cada convidado até a mesa, vendo o salão." },
  { icon: Link2, titulo: "Compartilhem o link", texto: "Só de leitura: cada um acha a própria mesa. Só vocês alteram." },
];

function PalcoDoMapa() {
  return (
    <div className="lp-3d-palco">
      <Image
        src="/landing/mesas3d/jardim-cenario.webp"
        alt="Mesas do casamento em 3D num jardim ao entardecer, com as cadeiras marcadas pela cor de cada grupo de convidados"
        width={1600}
        height={1000}
        sizes="(min-width: 1200px) 1120px, 100vw"
        className="lp-cobre"
      />
      <p className="lp-balao lp-3d-b1">
        <Link2 aria-hidden="true" className="lp-ico" />
        <span>
          Link <b>só de leitura</b> para os convidados
        </span>
      </p>
      <div className="lp-3d-busca" role="note" aria-label="Exemplo do mapa compartilhado">
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

/** Mesas em 3D (plano VIP): o salão do casamento, os convidados sentados e o link só de leitura para compartilhar. */
export function SecaoDeMesas({ vip }: { vip: string }) {
  return (
    <section className="lp-sec lp-dentro" id="mesas-3d" aria-labelledby="lp-t-3d">
      <CabecalhoDaSecao
        id="lp-t-3d"
        chip={`Mesas em 3D · ${vip}`}
        title="Sentem os convidados"
        accent="vendo o salão."
        lead="Escolham o cenário do casamento e mandem o mapa das mesas por um link, para cada convidado achar o próprio lugar."
      />
      <Aparicao variant="scale" className="lp-3d">
        <PalcoDoMapa />
        <ul className="lp-3d-cenarios" aria-label="Cenários disponíveis">
          {CENARIOS.map((c) => (
            <li key={c.id}>
              <Image src={`/mesas3d/${c.id}.webp`} alt="" width={640} height={400} sizes="(min-width: 900px) 360px, 33vw" />
              <span>{c.nome}</span>
            </li>
          ))}
        </ul>
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
        <LinkEmFormaDeBotao href="/cadastro?plano=vip" arrow>
          Quero as mesas em 3D
        </LinkEmFormaDeBotao>
        <p className="lp-mudo lp-nota">Recurso do {vip}. Imagem ilustrativa, com convidados fictícios.</p>
      </Aparicao>
    </section>
  );
}
