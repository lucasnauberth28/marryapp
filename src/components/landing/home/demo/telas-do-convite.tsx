import Image from "next/image";
import { Logotipo } from "@/components/brand/logo";
import type { Resposta } from "./tipos";

export function ConviteRespondido({ resp, pessoas, novo, aoAlterar }: { resp: Resposta | null; pessoas: 1 | 2; novo: boolean; aoAlterar: () => void }) {
  return (
    <div className="lp-feito">
      {resp === "sim" ? (
        <Image className={`lp-liz-festa${novo ? " lp-entra" : ""}`} src="/brand/liz/comemorando-176.webp" alt="" width={176} height={300} sizes="62px" aria-hidden="true" />
      ) : null}
      <div className={`lp-selo${novo ? " lp-carimba" : ""}`} aria-hidden="true">
        <Logotipo variant="mark-linho" height={30} />
      </div>
      <p className="lp-t">Resposta registrada no exemplo</p>
      <p>{resp === "sim" ? (pessoas === 1 ? "Marina vai, 1 pessoa." : "Marina vai com mais 1 pessoa.") : "Marina não poderá ir."}</p>
      <button type="button" className="lp-voltar" data-a="alterar" onClick={aoAlterar}>
        Alterar resposta
      </button>
    </div>
  );
}

interface PropriedadesDasPessoas {
  pessoas: 1 | 2;
  aoEscolher: (n: 1 | 2) => void;
  aoEnviar: () => void;
  aoVoltar: () => void;
}

export function EscolhaDasPessoas({ pessoas, aoEscolher, aoEnviar, aoVoltar }: PropriedadesDasPessoas) {
  return (
    <>
      <p id="lp-q-pessoas" className="lp-pergunta">
        Quantas pessoas vão, contando com você?
      </p>
      <div className="lp-opcoes" role="group" aria-labelledby="lp-q-pessoas">
        <button type="button" data-a="p1" aria-pressed={pessoas === 1} onClick={() => aoEscolher(1)}>
          Só eu<small>1 pessoa</small>
        </button>
        <button type="button" data-a="p2" aria-pressed={pessoas === 2} onClick={() => aoEscolher(2)}>
          Eu e mais 1<small>2 pessoas</small>
        </button>
      </div>
      <button type="button" className="lp-btn lp-btn-ameixa" data-a="enviar" onClick={aoEnviar}>
        Enviar resposta
      </button>
      <button type="button" className="lp-voltar" onClick={aoVoltar}>
        Voltar
      </button>
    </>
  );
}

export function ConviteInicial({ aoResponder }: { aoResponder: (r: Resposta) => void }) {
  return (
    <>
      <p className="lp-ola">
        Olá, <b>Marina Alves</b>. Guardamos <b>2 lugares</b> para você, contando com você.
      </p>
      <button type="button" className="lp-btn lp-btn-ameixa" data-a="sim" onClick={() => aoResponder("sim")}>
        Confirmar presença
      </button>
      <button type="button" className="lp-btn lp-btn-branco" data-a="nao" onClick={() => aoResponder("nao")}>
        Não poderei ir
      </button>
      <p className="lp-cel-aviso">Exemplo. Nada é enviado.</p>
    </>
  );
}
