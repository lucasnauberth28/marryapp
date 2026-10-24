"use client";

/**
 * Primeira dobra: o painel do casal no computador e o convite no celular. O convite funciona
 * como exemplo (a pessoa responde e o painel conta), com dados fictícios e nada é enviado.
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Clock, Gift, Home, Minus, Store, Users, LayoutTemplate } from "lucide-react";
import { Logo } from "@/components/brand/logo";

type Resposta = "sim" | "nao";
type Passo = "inicio" | "pessoas";

// Números do exemplo, antes de a pessoa responder.
const BASE = { confirmados: 86, semResposta: 42, naoVao: 12 };
const TOTAL_CONVITES = 140;

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

/** Número que desliza quando muda (a chave refaz o elemento e dispara a animação). */
function Roll({ value }: { value: number }) {
  return (
    <span key={value} className="lp-roll">
      {value}
    </span>
  );
}

const SIDE = [
  { icon: Home, label: "Resumo", active: true },
  { icon: Users, label: "Convidados" },
  { icon: Gift, label: "Presentes" },
  { icon: LayoutTemplate, label: "Site" },
  { icon: Store, label: "Fornecedores" },
];

const GRAFICO = "M0 92 L30 88 L60 84 L90 70 L120 72 L150 56 L180 50 L210 38 L240 34 L270 22 L300 16";

export function HeroDemo() {
  const [passo, setPasso] = useState<Passo>("inicio");
  const [resp, setResp] = useState<Resposta | null>(null);
  const [pessoas, setPessoas] = useState<1 | 2>(2);
  const [enviado, setEnviado] = useState(false);
  const [novo, setNovo] = useState(false);
  const [mexeu, setMexeu] = useState(false);
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
    setMexeu(true);
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
    setMexeu(true);
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

  const linhas: { nome: string; tipo: "sim" | "nao" | "sem"; nota: string; destaque?: boolean }[] = [
    enviado && resp
      ? { nome: "Marina Alves", tipo: resp, nota: resp === "sim" ? `${pessoas} ${pessoas === 1 ? "pessoa" : "pessoas"}` : "", destaque: novo }
      : { nome: "Marina Alves", tipo: "sem", nota: "" },
    { nome: "Carlos Mendes", tipo: "sim", nota: "2 pessoas" },
    { nome: "Família Souza", tipo: "sim", nota: "4 pessoas" },
  ];

  return (
    <div className="lp-hero-visual" data-mexeu={mexeu ? "" : undefined} role="group" aria-label="Exemplo do produto, com dados fictícios">
      <div className="lp-pc" aria-hidden="true">
        <div className="lp-pc-lado">
          <Logo height={18} className="lp-pc-logo" />
          {SIDE.map(({ icon: Icon, label, active }) => (
            <span key={label} className={active ? "lp-ativo" : undefined}>
              <Icon className="lp-ico" />
              {label}
            </span>
          ))}
        </div>
        <div className="lp-pc-main">
          <div className="lp-pc-topo">
            <b>Resumo · Ana &amp; Rafael</b>
            <span className="lp-chip lp-chip-neutro">Exemplo com dados fictícios</span>
          </div>
          <div className="lp-kpis">
            <div>
              <span className="lp-r">Confirmados</span>
              <span className="lp-v">
                <Roll value={totais.confirmados} /> <small>de {TOTAL_CONVITES}</small>
              </span>
              <span className="lp-c">convites</span>
            </div>
            <div>
              <span className="lp-r">Sem resposta</span>
              <span className="lp-v">
                <Roll value={totais.semResposta} />
              </span>
              <span className="lp-c">convites</span>
            </div>
            <div>
              <span className="lp-r">Presentes recebidos</span>
              <span className="lp-v">
                <small>R$</small> 3.850<small>,00</small>
              </span>
              <span className="lp-c">12 presentes</span>
            </div>
          </div>
          <div className="lp-pc-meio">
            <div className="lp-grafico">
              <span className="lp-r lp-mudo">Respostas por semana</span>
              <svg viewBox="0 0 300 110" aria-hidden="true">
                <defs>
                  <linearGradient id="lp-gg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#C680AE" stopOpacity=".45" />
                    <stop offset="1" stopColor="#C680AE" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g stroke="var(--fio)" strokeWidth="1">
                  <line x1="0" y1="20" x2="300" y2="20" />
                  <line x1="0" y1="55" x2="300" y2="55" />
                  <line x1="0" y1="90" x2="300" y2="90" />
                </g>
                <path d={`${GRAFICO} L300 110 L0 110 Z`} fill="url(#lp-gg)" />
                <path d={GRAFICO} fill="none" stroke="#8C3F74" strokeWidth="2.2" />
                <circle cx="300" cy="16" r="3.5" fill="#8C3F74" />
              </svg>
            </div>
            <div className="lp-pc-site">
              <div className="lp-pc-foto">
                <Image src="/landing/fotos/foto-casal-campo.webp" alt="" fill sizes="260px" className="lp-cobre" />
              </div>
              <span className="lp-chip lp-chip-ok">
                <Check aria-hidden="true" className="lp-ico" />
                Site publicado
              </span>
              <span className="lp-mono">meuaceito.com.br/casamento/ana-e-rafael</span>
            </div>
          </div>
          <div className="lp-pc-lista">
            {linhas.map((l) => (
              <div key={l.nome} className={l.destaque ? "lp-novo" : undefined}>
                <span>{l.nome}</span>
                <span className="lp-pc-direita">
                  <span className="lp-mudo">{l.nota}</span>
                  <Chip tipo={l.tipo} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
                  <Logo variant="mark-linho" height={30} />
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
              Painel: <b>{totais.confirmados}</b> de {TOTAL_CONVITES} convites confirmados
            </span>
          </>
        )}
      </div>
    </div>
  );
}
