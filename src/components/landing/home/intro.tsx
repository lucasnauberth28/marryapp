import Image from "next/image";
import { Check, Gift, Globe, Mail } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { CabecalhoDaSecao } from "./home-ui";

const FUNCOES_DO_PRODUTO = [
  { icon: Globe, titulo: "Site do casamento", texto: "Fotos, local, horário e traje num endereço só." },
  { icon: Check, titulo: "Confirmações", texto: "Quem vai, quem não vai e quem falta responder." },
  { icon: Gift, titulo: "Presentes em dinheiro", texto: "Por Pix ou cartão, conforme o plano." },
  { icon: Mail, titulo: "Convite pessoal", texto: "Cada convidado vê os próprios lugares." },
];

/** Faixa das quatro funções, logo abaixo da primeira dobra. */
export function FaixaDeFuncoes() {
  return (
    <>
      <ul className="lp-quatro" aria-label="O que o Aceito reúne">
        {FUNCOES_DO_PRODUTO.map(({ icon: Icon, titulo, texto }, i) => (
          <Aparicao as="li" key={titulo} delay={i * 80}>
            <span className="lp-ic" aria-hidden="true">
              <Icon className="lp-ico" />
            </span>
            <h2>{titulo}</h2>
            <p>{texto}</p>
          </Aparicao>
        ))}
      </ul>
    </>
  );
}

/** Três passos, com ícones em relevo. `classic` e `vip` são os nomes dos planos, lidos do catálogo. */
export function Passos({ classic, vip }: { classic: string; vip: string }) {
  const passos = [
    { n: "01", icone: "calendario", w: 280, h: 268, titulo: "Criem o site", texto: "Coloquem data, local e fotos." },
    {
      n: "02",
      icone: "link",
      w: 280,
      h: 266,
      titulo: "Enviem o link",
      texto: `Copiem o link ou mandem pelo WhatsApp. No ${classic} e no ${vip}, o painel envia por vocês.`,
    },
    { n: "03", icone: "confirmacao", w: 280, h: 282, titulo: "Acompanhem as respostas", texto: "Tudo aparece no painel de vocês." },
  ];
  return (
    <>
      <section className="lp-sec" id="como" aria-labelledby="lp-t-como">
        <CabecalhoDaSecao id="lp-t-como" chip="Como funciona" title="Três passos até" accent="a primeira resposta." padded />
        <ol className="lp-passos">
          {passos.map((p, i) => (
            <Aparicao as="li" key={p.n} className="lp-passo" delay={i * 100}>
              <div className="lp-palco" aria-hidden="true">
                <Image className="lp-ic3d" src={`/landing/icones/${p.icone}.webp`} alt="" width={p.w} height={p.h} sizes="132px" />
              </div>
              <div className="lp-txt">
                <span className="lp-n">{p.n}</span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </div>
            </Aparicao>
          ))}
        </ol>
      </section>
    </>
  );
}
