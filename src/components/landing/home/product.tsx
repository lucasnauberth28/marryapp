import Image from "next/image";
import { Check } from "lucide-react";
import { Aparicao } from "@/components/motion/reveal";
import { CabecalhoDaSecao } from "./home-ui";
import { ConviteNoCelular, NavegadorComSiteDeExemplo, ResumoNoNotebook } from "./product-telas";
import { TelaNaFoto } from "./screen-in-photo";

function BaloesDosConvidados({ classic, vip }: { classic: string; vip: string }) {
  return (
    <>
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
    </>
  );
}

/** Convidados: foto de mãos com o celular, e o convite de verdade encaixado na tela. */
export function SecaoDeConvidados({ classic, vip }: { classic: string; vip: string }) {
  return (
    <section className="lp-sec lp-dentro" id="convidados" aria-labelledby="lp-t-conv">
      <CabecalhoDaSecao id="lp-t-conv" chip="Convidados" title="Cada convidado acha" accent="o próprio convite." lead="Pelo número de WhatsApp, sem criar conta." />
      <Aparicao variant="scale" className="lp-cena">
        <Image className="lp-liz-envelope" src="/brand/liz/envelope-460.webp" alt="Liz, a fada flor do Aceito, entregando um convite" width={460} height={690} sizes="150px" />
        <div className="lp-recorte lp-recorte-cel">
          <TelaNaFoto
            src="/landing/fotos/foto-maos-celular.webp"
            alt="Mãos segurando um celular com o convite do casamento aberto"
            sizes="(min-width: 1000px) 1100px, 230vw"
            quad={[[626, 100], [953, 72], [1039, 718], [731, 762]]}
            base={[360, 740]}
            screenClassName="lp-tela-cel"
          >
            <ConviteNoCelular />
          </TelaNaFoto>
        </div>
        <BaloesDosConvidados classic={classic} vip={vip} />
      </Aparicao>
      <p className="lp-exemplo">Imagem ilustrativa, com dados fictícios.</p>
    </section>
  );
}

/** Painel do casal: foto do casal no sofá, com o Resumo encaixado na tela do notebook. */
export function SecaoDoPainel() {
  return (
    <section className="lp-sec lp-dentro lp-sec-curta" id="painel" aria-labelledby="lp-t-painel">
      <CabecalhoDaSecao id="lp-t-painel" chip="Painel do casal" title="Tudo num painel só," accent="no sofá de casa." lead="Respostas, presentes e o que falta fazer." />
      <Aparicao variant="scale" className="lp-recorte lp-recorte-pc">
        <TelaNaFoto
          src="/landing/fotos/foto-casal-notebook.webp"
          alt="Casal sorrindo no sofá enquanto olha o painel do casamento no notebook"
          sizes="(min-width: 1000px) 1100px, 200vw"
          quad={[[1052, 323], [1487, 424], [1380, 775], [969, 616]]}
          base={[820, 600]}
          screenClassName="lp-tela-pc"
        >
          <ResumoNoNotebook />
        </TelaNaFoto>
      </Aparicao>
      <p className="lp-exemplo">Imagem ilustrativa, com dados fictícios.</p>
    </section>
  );
}

/** O site do casal: ilustração de um site de exemplo (não é um site real), ao lado de um texto curto. */
export function SecaoDoSite({ vip }: { vip: string }) {
  return (
    <section className="lp-meia" aria-labelledby="lp-t-site">
      <Aparicao variant="left" className="lp-meia-visual" role="img" aria-label="Exemplo ilustrado de um site de casamento, com a capa do casal e os horários da cerimônia e da recepção">
        <NavegadorComSiteDeExemplo />
        <span className="lp-selo-exemplo">Exemplo</span>
      </Aparicao>
      <Aparicao variant="right" delay={120} className="lp-meia-texto">
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
      </Aparicao>
    </section>
  );
}
