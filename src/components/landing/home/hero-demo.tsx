"use client";

/**
 * Primeira dobra: o painel do casal no computador e o convite no celular. O convite funciona
 * como exemplo (a pessoa responde e o painel conta), com dados fictícios e nada é enviado.
 */
import { useRef } from "react";
import Image from "next/image";
import { Check, Clock, Minus } from "lucide-react";
import { ConviteInicial, ConviteRespondido, EscolhaDasPessoas } from "./demo/telas-do-convite";
import { TOTAL_DE_CONVITES, type Resposta } from "./demo/tipos";
import { useDemo } from "./demo/use-demo";

function EtiquetaDaDemonstracao({ tipo }: { tipo: "sim" | "nao" | "sem" }) {
  if (tipo === "sim")
    return (
      <span className="lp-chip lp-chip-ok">
        <Check aria-hidden="true" className="lp-ico" />
        Confirmado
      </span>
    );
  if (tipo === "nao")
    return (
      <span className="lp-chip lp-chip-neutro">
        <Minus aria-hidden="true" className="lp-ico" />
        Não vai
      </span>
    );
  return (
    <span className="lp-chip lp-chip-neutro">
      <Clock aria-hidden="true" className="lp-ico" />
      Sem resposta
    </span>
  );
}

function CabecalhoDoCelular() {
  return (
    <>
      <span className="lp-cel-ilha" aria-hidden="true" />
      <div className="lp-cel-status" aria-hidden="true">
        <span>9:41</span>
        <span>●●● 5G</span>
      </div>
      <div className="lp-cel-cab">
        <Image src="/landing/fotos/foto-saida-noivos.webp" alt="" fill preload sizes="260px" className="lp-cobre" style={{ objectPosition: "50% 30%" }} />
        <p>
          <span className="lp-nomes">
            Ana <span className="lp-amp">&amp;</span> Rafael
          </span>
          <span className="lp-data">Sábado · 17 · abril 2027</span>
        </p>
      </div>
    </>
  );
}

function BalaoDoPainel({ enviado, resp, confirmados }: { enviado: boolean; resp: Resposta | null; confirmados: number }) {
  return (
    <div className="lp-balao lp-balao-evento" aria-live="polite">
      {enviado && resp ? (
        <>
          <EtiquetaDaDemonstracao tipo={resp} />
          <span>
            <b>Marina</b> {resp === "sim" ? "confirmou presença" : "não poderá ir"}
          </span>
        </>
      ) : (
        <>
          <Clock aria-hidden="true" className="lp-ico" style={{ color: "var(--grafite)" }} />
          <span>
            Painel: <b>{confirmados}</b> de {TOTAL_DE_CONVITES} convites confirmados
          </span>
        </>
      )}
    </div>
  );
}

export function HeroDemo() {
  const corpo = useRef<HTMLElement>(null);
  const d = useDemo(corpo);

  return (
    <div className="lp-hero-visual" role="group" aria-label="Exemplo do produto, com dados fictícios">
      <div className="lp-cel">
        <div className="lp-cel-tela">
          <CabecalhoDoCelular />
          <section ref={corpo} className="lp-cel-corpo" aria-label="Exemplo de convite. Experimentem responder." aria-live="polite">
            {d.enviado ? (
              <ConviteRespondido resp={d.resp} pessoas={d.pessoas} novo={d.novo} aoAlterar={d.alterar} />
            ) : d.passo === "pessoas" ? (
              <EscolhaDasPessoas pessoas={d.pessoas} aoEscolher={d.escolherPessoas} aoEnviar={d.enviar} aoVoltar={d.voltar} />
            ) : (
              <ConviteInicial aoResponder={d.responder} />
            )}
          </section>
        </div>
      </div>
      <BalaoDoPainel enviado={d.enviado} resp={d.resp} confirmados={d.totais.confirmados} />
    </div>
  );
}
