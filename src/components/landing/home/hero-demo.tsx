"use client";

/**
 * Primeira dobra: o painel do casal no computador e o convite no celular. O convite funciona
 * como exemplo (a pessoa responde e o painel conta), com dados fictícios e nada é enviado.
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Clock, Minus } from "lucide-react";
import { Logotipo } from "@/components/brand/logo";

type Resposta = "sim" | "nao";
type Passo = "inicio" | "pessoas";

// Números do exemplo, antes de a pessoa responder.
const BASE = { confirmados: 86, semResposta: 42, naoVao: 12 };
const TOTAL_DE_CONVITES = 140;

function Chip({ tipo }: { tipo: "sim" | "nao" | "sem" }) {
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

export function HeroDemo() {
  const [passo, setPasso] = useState<Passo>("inicio");
  const [resp, setResp] = useState<Resposta | null>(null);
  const [pessoas, setPessoas] = useState<1 | 2>(2);
  const [enviado, setEnviado] = useState(false);
  const [novo, setNovo] = useState(false);
  const corpo = useRef<HTMLElement>(null);
  const foco = useRef<string | null>(null);

  // Depois de trocar a tela do convite, devolve o foco a um botão dela (quem usa teclado não se perde).
  useEffect(() => {
    if (!foco.current) return;
    corpo.current?.querySelector<HTMLElement>(foco.current)?.focus();
    foco.current = null;
  }, [passo, enviado, pessoas]);

  const totais = {
    confirmados: BASE.confirmados + (enviado && resp === "sim" ? 1 : 0),
    semResposta: BASE.semResposta - (enviado ? 1 : 0),
  };

  const responder = (r: Resposta) => {
    setResp(r);
    if (r === "sim") {
      setPasso("pessoas");
      foco.current = '[data-a="p2"]';
    } else {
      setEnviado(true);
      setNovo(true);
      foco.current = '[data-a="alterar"]';
    }
  };
  const enviar = () => {
    setEnviado(true);
    setNovo(true);
    setPasso("inicio");
    foco.current = '[data-a="alterar"]';
  };
  const alterar = () => {
    setEnviado(false);
    setNovo(false);
    setPasso("inicio");
    foco.current = '[data-a="sim"]';
  };

  return (
    <div className="lp-hero-visual" role="group" aria-label="Exemplo do produto, com dados fictícios">
      <div className="lp-cel">
        <div className="lp-cel-tela">
          <span className="lp-cel-ilha" aria-hidden="true" />
          <div className="lp-cel-status" aria-hidden="true">
            <span>9:41</span>
            <span>●●● 5G</span>
          </div>
          <div className="lp-cel-cab">
            <Image
              src="/landing/fotos/foto-saida-noivos.webp"
              alt=""
              fill
              preload
              sizes="260px"
              className="lp-cobre"
              style={{ objectPosition: "50% 30%" }}
            />
            <p>
              <span className="lp-nomes">
                Ana <span className="lp-amp">&amp;</span> Rafael
              </span>
              <span className="lp-data">Sábado · 17 · abril 2027</span>
            </p>
          </div>
          <section ref={corpo} className="lp-cel-corpo" aria-label="Exemplo de convite. Experimentem responder." aria-live="polite">
            {enviado ? (
              <div className="lp-feito">
                {resp === "sim" ? (
                  <Image
                    className={`lp-liz-festa${novo ? " lp-entra" : ""}`}
                    src="/brand/liz/comemorando-176.webp"
                    alt=""
                    width={176}
                    height={300}
                    sizes="62px"
                    aria-hidden="true"
                  />
                ) : null}
                <div className={`lp-selo${novo ? " lp-carimba" : ""}`} aria-hidden="true">
                  <Logotipo variant="mark-linho" height={30} />
                </div>
                <p className="lp-t">Resposta registrada no exemplo</p>
                <p>{resp === "sim" ? (pessoas === 1 ? "Marina vai, 1 pessoa." : "Marina vai com mais 1 pessoa.") : "Marina não poderá ir."}</p>
                <button type="button" className="lp-voltar" data-a="alterar" onClick={alterar}>
                  Alterar resposta
                </button>
              </div>
            ) : passo === "pessoas" ? (
              <>
                <p id="lp-q-pessoas" className="lp-pergunta">
                  Quantas pessoas vão, contando com você?
                </p>
                <div className="lp-opcoes" role="group" aria-labelledby="lp-q-pessoas">
                  <button type="button" data-a="p1" aria-pressed={pessoas === 1} onClick={() => { setPessoas(1); foco.current = '[data-a="p1"]'; }}>
                    Só eu<small>1 pessoa</small>
                  </button>
                  <button type="button" data-a="p2" aria-pressed={pessoas === 2} onClick={() => { setPessoas(2); foco.current = '[data-a="p2"]'; }}>
                    Eu e mais 1<small>2 pessoas</small>
                  </button>
                </div>
                <button type="button" className="lp-btn lp-btn-ameixa" data-a="enviar" onClick={enviar}>
                  Enviar resposta
                </button>
                <button
                  type="button"
                  className="lp-voltar"
                  onClick={() => {
                    setPasso("inicio");
                    foco.current = '[data-a="sim"]';
                  }}
                >
                  Voltar
                </button>
              </>
            ) : (
              <>
                <p className="lp-ola">
                  Olá, <b>Marina Alves</b>. Guardamos <b>2 lugares</b> para você, contando com você.
                </p>
                <button type="button" className="lp-btn lp-btn-ameixa" data-a="sim" onClick={() => responder("sim")}>
                  Confirmar presença
                </button>
                <button type="button" className="lp-btn lp-btn-branco" data-a="nao" onClick={() => responder("nao")}>
                  Não poderei ir
                </button>
                <p className="lp-cel-aviso">Exemplo. Nada é enviado.</p>
              </>
            )}
          </section>
        </div>
      </div>

      <div className="lp-balao lp-balao-evento" aria-live="polite">
        {enviado && resp ? (
          <>
            <Chip tipo={resp} />
            <span>
              <b>Marina</b> {resp === "sim" ? "confirmou presença" : "não poderá ir"}
            </span>
          </>
        ) : (
          <>
            <Clock aria-hidden="true" className="lp-ico" style={{ color: "var(--grafite)" }} />
            <span>
              Painel: <b>{totais.confirmados}</b> de {TOTAL_DE_CONVITES} convites confirmados
            </span>
          </>
        )}
      </div>
    </div>
  );
}
