import Image from "next/image";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { SectionHead } from "./home-ui";
import { ScreenInPhoto } from "./screen-in-photo";

const NOMES = (
  <span className="lp-nomes">
    Ana <span className="lp-amp">&amp;</span> Rafael
  </span>
);

/** Convidados: foto de mãos com o celular, e o convite de verdade encaixado na tela. */
export function GuestsSection({ classic, vip }: { classic: string; vip: string }) {
  return (
    <>
      <section className="lp-sec lp-dentro" id="convidados" aria-labelledby="lp-t-conv">
        <SectionHead id="lp-t-conv" chip="Convidados" title="Cada convidado acha" accent="o próprio convite." lead="Pelo número de WhatsApp, sem criar conta." />
        <Reveal variant="scale" className="lp-cena">
          <Image
            className="lp-liz-envelope"
            src="/brand/liz/envelope-460.webp"
            alt="Liz, a fada flor do Aceito, entregando um convite"
            width={460}
            height={690}
            sizes="150px"
          />
          <div className="lp-recorte lp-recorte-cel">
            <ScreenInPhoto
              src="/landing/fotos/foto-maos-celular.webp"
              alt="Mãos segurando um celular com o convite do casamento aberto"
              sizes="(min-width: 1000px) 1100px, 230vw"
              quad={[[626, 100], [953, 72], [1039, 718], [731, 762]]}
              base={[360, 740]}
              screenClassName="lp-tela-cel"
            >
              <div className="lp-tc-cab">
                <Image src="/landing/fotos/foto-saida-noivos.webp" alt="" fill sizes="360px" className="lp-cobre" style={{ objectPosition: "50% 35%" }} />
                <p>
                  {NOMES}
                  <span className="lp-data">Sábado · 17 · abril 2027</span>
                </p>
              </div>
              <div className="lp-tc-corpo">
                <div className="lp-selo" aria-hidden="true">
                  <Logo variant="mark-linho" height={48} />
                </div>
                <p className="lp-tc-t">Presença confirmada</p>
                <p className="lp-tc-s">Marina Alves e mais 1 pessoa</p>
                <span className="lp-chip lp-chip-ok">
                  <Check aria-hidden="true" className="lp-ico" />2 de 2 lugares
                </span>
                <p className="lp-tc-n">Sem glúten · informado na resposta</p>
              </div>
            </ScreenInPhoto>
          </div>
          <p className="lp-balao lp-c1">
            <Image src="/landing/icones/seguranca.webp" alt="" width={280} height={289} sizes="40px" />
            <span>
              Cada convidado vê <b>só o próprio convite</b>
            </span>
          </p>
          <p className="lp-balao lp-c2">
            <Image src="/landing/icones/convite.webp" alt="" width={280} height={252} sizes="40px" />
            <span>
              <b>2 lugares</b>, contando com você
            </span>
          </p>
          <p className="lp-balao lp-c3">
            <Image src="/landing/icones/qrcode.webp" alt="" width={280} height={260} sizes="40px" />
            <span>
              <b>Código QR</b> na entrada · {classic} e {vip}
            </span>
          </p>
        </Reveal>
        <p className="lp-exemplo">Imagem ilustrativa, com dados fictícios.</p>
      </section>
    </>
  );
}

/** Painel do casal: foto do casal no sofá, com o Resumo encaixado na tela do notebook. */
export function PanelSection() {
  return (
    <>
      <section className="lp-sec lp-dentro lp-sec-curta" id="painel" aria-labelledby="lp-t-painel">
        <SectionHead id="lp-t-painel" chip="Painel do casal" title="Tudo num painel só," accent="no sofá de casa." lead="Respostas, presentes e o que falta fazer." />
        <Reveal variant="scale" className="lp-recorte lp-recorte-pc">
          <ScreenInPhoto
            src="/landing/fotos/foto-casal-notebook.webp"
            alt="Casal sorrindo no sofá enquanto olha o painel do casamento no notebook"
            sizes="(min-width: 1000px) 1100px, 200vw"
            quad={[[1052, 323], [1487, 424], [1380, 775], [969, 616]]}
            base={[820, 600]}
            screenClassName="lp-tela-pc"
          >
            <div className="lp-tp-topo">
              <b>Resumo · Ana &amp; Rafael</b>
              <span>faltam 178 dias</span>
            </div>
            <div className="lp-tp-kpis">
              <div>
                <span>Confirmados</span>
                <b>86</b>
                <small>de 140 convites</small>
              </div>
              <div>
                <span>Presentes</span>
                <b>R$ 3.850</b>
                <small>12 presentes</small>
              </div>
            </div>
            <div className="lp-tp-barra">
              <i style={{ flex: 86 }} />
              <i style={{ flex: 12 }} />
              <i style={{ flex: 42 }} />
            </div>
            <div className="lp-tp-linhas">
              <p>
                <span>Carlos Mendes</span>
                <em>Confirmado</em>
              </p>
              <p>
                <span>Família Souza</span>
                <em>Confirmado</em>
              </p>
              <p>
                <span>Jantar da lua de mel</span>
                <em>R$ 350,00</em>
              </p>
            </div>
          </ScreenInPhoto>
        </Reveal>
        <p className="lp-exemplo">Imagem ilustrativa, com dados fictícios.</p>
      </section>
    </>
  );
}

/** O site do casal: ilustração de um site de exemplo (não é um site real), ao lado de um texto curto. */
export function SiteSection({ vip }: { vip: string }) {
  return (
    <section className="lp-meia" aria-labelledby="lp-t-site">
      <Reveal variant="left" className="lp-meia-visual" role="img" aria-label="Exemplo ilustrado de um site de casamento, com a capa do casal e os horários da cerimônia e da recepção">
        <div className="lp-navegador" aria-hidden="true">
          <div className="lp-nav-barra">
            <i />
            <i />
            <i />
            <span className="lp-url">meuaceito.com.br/casamento/ana-e-rafael</span>
          </div>
          <div className="lp-ms">
            <div className="lp-ms-capa">
              <Image src="/landing/fotos/foto-casal-campo.webp" alt="" fill sizes="600px" className="lp-cobre" style={{ objectPosition: "50% 30%" }} />
              <p>
                {NOMES}
                <span className="lp-data">Sábado · 17 · abril 2027</span>
              </p>
            </div>
            <div className="lp-ms-linha">
              <div>
                <b>16h</b>Cerimônia
              </div>
              <div>
                <b>18h</b>Recepção
              </div>
              <div>
                <b>Traje</b>Passeio
              </div>
            </div>
          </div>
        </div>
        <span className="lp-selo-exemplo">Exemplo</span>
      </Reveal>
      <Reveal variant="right" delay={120} className="lp-meia-texto">
        <h2 className="lp-titulo lp-h2" id="lp-t-site">
          O site do casamento,
          <br />
          <span className="lp-cor">pronto para enviar.</span>
        </h2>
        <p className="lp-lead">Fotos, história, local, horário e traje num endereço do Aceito.</p>
        <span className="lp-endereco-chip">
          <Check aria-hidden="true" className="lp-ico" />
          <span>
            <span className="lp-sr">Exemplo de endereço: </span>meuaceito.com.br/casamento/ana-e-rafael
          </span>
        </span>
        <p className="lp-mudo lp-nota">No {vip}, com endereço .com.br próprio.</p>
      </Reveal>
    </section>
  );
}
