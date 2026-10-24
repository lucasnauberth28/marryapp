import Image from "next/image";
import Link from "next/link";
import { Link2, MousePointerClick, Search, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { LinkButton, SectionHead } from "./home-ui";

/** Liz: sugere o próximo passo a partir do painel e responde dúvidas por assuntos prontos. Não age sozinha. */
export function LizSection() {
  return (
    <>
      <section className="lp-sec lp-dentro" id="liz" aria-labelledby="lp-t-liz">
        <div className="lp-liz-grade">
          <Reveal className="lp-liz-texto">
            <span className="lp-chip-sec">Liz</span>
            <h2 className="lp-titulo lp-h2" id="lp-t-liz">
              A fada madrinha
              <br />
              <span className="lp-cor">do próximo passo.</span>
            </h2>
            <p className="lp-lead">Ela lê o painel e sugere, e responde dúvidas por assuntos prontos. Não faz nada sozinha: quem decide são vocês.</p>
          </Reveal>
          <Reveal variant="right" delay={120} className="lp-liz-palco">
            <Image
              className="lp-liz-sentada"
              src="/brand/liz/apontando-baixo-460.webp"
              alt="Liz, a fada flor do Aceito, sentada e apontando a varinha para a sugestão"
              width={460}
              height={687}
              sizes="132px"
            />
            <div className="lp-sugestao" role="note" aria-label="Exemplo de sugestão da Liz">
              <Image src="/brand/liz/busto-162.webp" alt="" width={162} height={160} sizes="44px" />
              <p className="lp-quem">
                <b>Sugestão da Liz</b> · exemplo
              </p>
              <p className="lp-t">42 convites ainda sem resposta. O prazo termina em 9 dias.</p>
              <span className="lp-chip lp-chip-ameixa">Revisar quem não respondeu</span>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/** O dia da festa: foto ao lado de três recursos com ícones em relevo. */
export function PartySection({ classic, vip }: { classic: string; vip: string }) {
  const itens = [
    { icone: "mesas", w: 280, h: 273, titulo: "Mesas e restrições", texto: "Cada convidado no seu lugar." },
    { icone: "qrcode", w: 280, h: 260, titulo: "Entrada com código QR", texto: `${classic} e ${vip}.` },
    { icone: "calendario", w: 280, h: 268, titulo: "Cronograma e tarefas", texto: "O horário de cada momento." },
  ];
  return (
    <>
      <section className="lp-meia" aria-labelledby="lp-t-festa">
        <Reveal variant="left" className="lp-meia-visual">
          <Image
            className="lp-cobre"
            src="/landing/fotos/foto-mesa-recepcao.webp"
            alt="Mesa redonda posta para a recepção, com flores e uma plaquinha"
            fill
            sizes="(min-width: 900px) 50vw, 100vw"
          />
        </Reveal>
        <Reveal variant="right" delay={120} className="lp-meia-texto">
          <h2 className="lp-titulo lp-h2" id="lp-t-festa">
            E no dia da festa,
            <br />
            <span className="lp-cor">tudo no lugar.</span>
          </h2>
          <ul className="lp-r3d">
            {itens.map((i) => (
              <li key={i.titulo}>
                <Image src={`/landing/icones/${i.icone}.webp`} alt="" width={i.w} height={i.h} sizes="56px" />
                <div>
                  <b>{i.titulo}</b>
                  <span>{i.texto}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="lp-mais-recursos">Também: mural de recados e despesas. Convites pelo WhatsApp do painel, no {classic} e no {vip}.</p>
        </Reveal>
      </section>
    </>
  );
}

/** Fornecedores: colagem de fotos ao lado de um texto curto. */
export function VendorsSection() {
  return (
    <>
      <section className="lp-meia lp-inv" id="fornecedores" aria-labelledby="lp-t-forn">
        <Reveal variant="right" className="lp-meia-visual">
          <div className="lp-colagem">
            <Image
              className="lp-c1"
              src="/landing/fotos/fornecedor-confeiteira.webp"
              alt="Confeiteira finalizando um bolo de casamento"
              width={900}
              height={1125}
              sizes="(min-width: 900px) 320px, 55vw"
            />
            <Image
              className="lp-c2"
              src="/landing/fotos/fornecedor-fotografa.webp"
              alt="Fotógrafa ajustando a câmera"
              width={900}
              height={1125}
              sizes="(min-width: 900px) 200px, 34vw"
            />
            <Image
              className="lp-c3"
              src="/landing/fotos/fornecedor-florista.webp"
              alt="Florista montando um buquê"
              width={900}
              height={1125}
              sizes="(min-width: 900px) 220px, 36vw"
            />
          </div>
        </Reveal>
        <Reveal variant="left" delay={120} className="lp-meia-texto">
          <h2 className="lp-titulo lp-h2" id="lp-t-forn">
            Fornecedores
            <br />
            <span className="lp-cor">perto do casamento.</span>
          </h2>
          <p className="lp-lead">Fotógrafos, espaços e buffets da região, com pedido de orçamento.</p>
          <LinkButton href="/fornecedores">Encontrar fornecedores</LinkButton>
          <Link href="/planos#fornecedores" className="lp-link lp-nota">
            Você é fornecedor? Conheça o Aceito para empresas
          </Link>
        </Reveal>
      </section>
    </>
  );
}

/** Mesas em 3D (plano VIP): o salão do casamento, os convidados sentados e o link só de leitura para compartilhar. */
export function TablesSection({ vip }: { vip: string }) {
  const cenarios = [
    { id: "jardim", nome: "Jardim ao entardecer" },
    { id: "classico", nome: "Salão clássico" },
    { id: "rustico", nome: "Galpão rústico" },
  ];
  const passos = [
    { icon: Sparkles, titulo: "Escolham o cenário", texto: "Jardim, salão clássico ou galpão rústico." },
    { icon: MousePointerClick, titulo: "Sentem arrastando", texto: "Levem cada convidado até a mesa, vendo o salão." },
    { icon: Link2, titulo: "Compartilhem o link", texto: "Só de leitura: cada um acha a própria mesa. Só vocês alteram." },
  ];
  return (
    <section className="lp-sec lp-dentro" id="mesas-3d" aria-labelledby="lp-t-3d">
      <SectionHead
        id="lp-t-3d"
        chip={`Mesas em 3D · ${vip}`}
        title="Sentem os convidados"
        accent="vendo o salão."
        lead="Escolham o cenário do casamento e mandem o mapa das mesas por um link, para cada convidado achar o próprio lugar."
      />
      <Reveal variant="scale" className="lp-3d">
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
        <ul className="lp-3d-cenarios" aria-label="Cenários disponíveis">
          {cenarios.map((c) => (
            <li key={c.id}>
              <Image src={`/mesas3d/${c.id}.webp`} alt="" width={640} height={400} sizes="(min-width: 900px) 360px, 33vw" />
              <span>{c.nome}</span>
            </li>
          ))}
        </ul>
      </Reveal>
      <ul className="lp-3d-passos">
        {passos.map(({ icon: Icon, titulo, texto }, i) => (
          <Reveal as="li" key={titulo} delay={i * 100}>
            <span className="lp-ic" aria-hidden="true">
              <Icon className="lp-ico" />
            </span>
            <h3>{titulo}</h3>
            <p>{texto}</p>
          </Reveal>
        ))}
      </ul>
      <Reveal className="lp-3d-cta">
        <LinkButton href="/cadastro?plano=vip" arrow>
          Quero as mesas em 3D
        </LinkButton>
        <p className="lp-mudo lp-nota">Recurso do {vip}. Imagem ilustrativa, com convidados fictícios.</p>
      </Reveal>
    </section>
  );
}
