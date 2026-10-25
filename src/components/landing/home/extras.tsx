import Image from "next/image";
import Link from "next/link";
import { Aparicao } from "@/components/motion/reveal";
import { LinkEmFormaDeBotao } from "./home-ui";

/** Liz: sugere o próximo passo a partir do painel e responde dúvidas por assuntos prontos. Não age sozinha. */
export function SecaoDaLiz() {
  return (
    <>
      <section className="lp-sec lp-dentro" id="liz" aria-labelledby="lp-t-liz">
        <div className="lp-liz-grade">
          <Aparicao className="lp-liz-texto">
            <span className="lp-chip-sec">Liz</span>
            <h2 className="lp-titulo lp-h2" id="lp-t-liz">
              A fada madrinha
              <br />
              <span className="lp-cor">do próximo passo.</span>
            </h2>
            <p className="lp-lead">Ela lê o painel e sugere, e responde dúvidas por assuntos prontos. Não faz nada sozinha: quem decide são vocês.</p>
          </Aparicao>
          <Aparicao variant="right" delay={120} className="lp-liz-palco">
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
          </Aparicao>
        </div>
      </section>
    </>
  );
}

/** O dia da festa: foto ao lado de três recursos com ícones em relevo. */
export function SecaoDaFesta({ classic, vip }: { classic: string; vip: string }) {
  const itens = [
    { icone: "mesas", w: 280, h: 273, titulo: "Mesas e restrições", texto: "Cada convidado no seu lugar." },
    { icone: "qrcode", w: 280, h: 260, titulo: "Entrada com código QR", texto: `${classic} e ${vip}.` },
    { icone: "calendario", w: 280, h: 268, titulo: "Cronograma e tarefas", texto: "O horário de cada momento." },
  ];
  return (
    <>
      <section className="lp-meia" aria-labelledby="lp-t-festa">
        <Aparicao variant="left" className="lp-meia-visual">
          <Image
            className="lp-cobre"
            src="/landing/fotos/foto-mesa-recepcao.webp"
            alt="Mesa redonda posta para a recepção, com flores e uma plaquinha"
            fill
            sizes="(min-width: 900px) 50vw, 100vw"
          />
        </Aparicao>
        <Aparicao variant="right" delay={120} className="lp-meia-texto">
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
        </Aparicao>
      </section>
    </>
  );
}

/** Fornecedores: colagem de fotos ao lado de um texto curto. */
export function SecaoDeFornecedores() {
  return (
    <>
      <section className="lp-meia lp-inv" id="fornecedores" aria-labelledby="lp-t-forn">
        <Aparicao variant="right" className="lp-meia-visual">
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
        </Aparicao>
        <Aparicao variant="left" delay={120} className="lp-meia-texto">
          <h2 className="lp-titulo lp-h2" id="lp-t-forn">
            Fornecedores
            <br />
            <span className="lp-cor">perto do casamento.</span>
          </h2>
          <p className="lp-lead">Fotógrafos, espaços e buffets da região, com pedido de orçamento.</p>
          <LinkEmFormaDeBotao href="/fornecedores">Encontrar fornecedores</LinkEmFormaDeBotao>
          <Link href="/planos#fornecedores" className="lp-link lp-nota">
            Você é fornecedor? Conheça o Aceito para empresas
          </Link>
        </Aparicao>
      </section>
    </>
  );
}
