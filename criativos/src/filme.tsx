import { AbsoluteFill, Sequence } from "remotion";
import { CenaAssinatura } from "./cenas/assinatura";
import { CenaConvite } from "./cenas/convite";
import { CenaOrganizar } from "./cenas/organizar";
import { CenaRespostas } from "./cenas/respostas";
import { CenaSim } from "./cenas/sim";
import { TRANSICAO } from "./componentes/cena";
import { COR, NOMES_DO_CASAL, type Casal } from "./tema";

export const QUADROS_POR_SEGUNDO = 30;

type Trecho = { duracao: number; cena: (duracao: number) => React.ReactNode };

/** Encadeia as cenas com `TRANSICAO` quadros de sobreposição entre uma e outra. */
function Encadear({ trechos }: { trechos: Trecho[] }) {
  let inicio = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: COR.linho }}>
      {trechos.map((t, i) => {
        const de = inicio;
        inicio += t.duracao - TRANSICAO;
        return (
          <Sequence key={i} from={de} durationInFrames={t.duracao}>
            {t.cena(t.duracao)}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

/** Soma das durações menos as sobreposições: o tamanho do filme em quadros. */
export const duracaoDe = (duracoes: number[]) => duracoes.reduce((s, d) => s + d, 0) - TRANSICAO * (duracoes.length - 1);

const PRINCIPAL = [84, 216, 130, 110, 100];
const CURTO = [50, 86, 64];
export const DURACAO_PRINCIPAL = duracaoDe(PRINCIPAL);
export const DURACAO_CURTO = duracaoDe(CURTO);

/** 20 segundos: o sim, a avalanche que vira painel, o convite, as respostas e a assinatura. */
export function FilmePrincipal({ casal }: { casal: Casal }) {
  const nomes = NOMES_DO_CASAL[casal];
  const cenas = [(d: number) => <CenaSim duracao={d} />, (d: number) => <CenaOrganizar duracao={d} nomes={nomes} />, (d: number) => <CenaConvite duracao={d} nomes={nomes} />, (d: number) => <CenaRespostas duracao={d} />, (d: number) => <CenaAssinatura duracao={d} casal={casal} />];
  return <Encadear trechos={PRINCIPAL.map((duracao, i) => ({ duracao, cena: cenas[i] }))} />;
}

/** 6 segundos: o sim, o painel e a assinatura. */
export function FilmeCurto({ casal }: { casal: Casal }) {
  const nomes = NOMES_DO_CASAL[casal];
  const cenas = [(d: number) => <CenaSim duracao={d} />, (d: number) => <CenaOrganizar duracao={d} nomes={nomes} />, (d: number) => <CenaAssinatura duracao={d} casal={casal} />];
  return <Encadear trechos={CURTO.map((duracao, i) => ({ duracao, cena: cenas[i] }))} />;
}
