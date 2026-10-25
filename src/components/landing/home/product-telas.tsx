import Image from "next/image";
import { Check } from "lucide-react";
import { Logotipo } from "@/components/brand/logo";

export const NOMES_DE_EXEMPLO = (
  <span className="lp-nomes">
    Ana <span className="lp-amp">&amp;</span> Rafael
  </span>
);

/** O convite confirmado que aparece dentro da tela do celular da foto. */
export function ConviteNoCelular() {
  return (
    <>
      <div className="lp-tc-cab">
        <Image src="/landing/fotos/foto-saida-noivos.webp" alt="" fill sizes="360px" className="lp-cobre" style={{ objectPosition: "50% 35%" }} />
        <p>
          {NOMES_DE_EXEMPLO}
          <span className="lp-data">Sábado · 17 · abril 2027</span>
        </p>
      </div>
      <div className="lp-tc-corpo">
        <div className="lp-selo" aria-hidden="true">
          <Logotipo variant="mark-linho" height={48} />
        </div>
        <p className="lp-tc-t">Presença confirmada</p>
        <p className="lp-tc-s">Marina Alves e mais 1 pessoa</p>
        <span className="lp-chip lp-chip-ok">
          <Check aria-hidden="true" className="lp-ico" />2 de 2 lugares
        </span>
        <p className="lp-tc-n">Sem glúten · informado na resposta</p>
      </div>
    </>
  );
}

/** O Resumo que aparece dentro da tela do notebook da foto. */
export function ResumoNoNotebook() {
  return (
    <>
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
    </>
  );
}

/** Ilustração de um site de exemplo (não é um site real) dentro de uma janela de navegador. */
export function NavegadorComSiteDeExemplo() {
  return (
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
            {NOMES_DE_EXEMPLO}
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
  );
}
