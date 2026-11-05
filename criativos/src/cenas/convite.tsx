import { useCurrentFrame } from "remotion";
import { Cena } from "../componentes/cena";
import { TELAS, TelaDoCelular } from "../componentes/celular";
import { Foto } from "../componentes/foto";
import { Frase } from "../componentes/frase";
import { progresso } from "../movimento";
import { COR, useFormato, type TipoDeFormato } from "../tema";

type Caixa = { x: number; y: number; l: number; a: number };

/** Onde fica a moldura em arco (em fração do quadro) e o título, por formato. */
const ARRANJO: Record<TipoDeFormato, { moldura: Caixa; titulo: { x: number; y: number; l: number; tamanho: number; alinhamento: "left" | "center" } }> = {
  horizontal: { moldura: { x: 0.52, y: 0.06, l: 0.4, a: 0.9 }, titulo: { x: 0.08, y: 0.36, l: 0.38, tamanho: 92, alinhamento: "left" } },
  vertical: { moldura: { x: 0.08, y: 0.3, l: 0.84, a: 0.6 }, titulo: { x: 0.08, y: 0.15, l: 0.84, tamanho: 88, alinhamento: "center" } },
  quadrado: { moldura: { x: 0.22, y: 0.25, l: 0.56, a: 0.72 }, titulo: { x: 0.06, y: 0.06, l: 0.88, tamanho: 64, alinhamento: "center" } },
};

/** O convite chega: a convidada segura o celular; na tela, a conversa vira o convite com o nome dela e a presença é confirmada. */
export function CenaConvite({ duracao, nomes }: { duracao: number; nomes: string }) {
  const frame = useCurrentFrame();
  const { tipo, largura, altura, u } = useFormato();
  const { moldura, titulo } = ARRANJO[tipo];
  const caixa = { largura: moldura.l * largura, altura: moldura.a * altura };
  const foto = TELAS.vertical;
  const telaNoCentro: [number, number] = [(foto.tela.x + foto.tela.l / 2) / foto.largura, (foto.tela.y + foto.tela.a / 2) / foto.altura];
  const aparece = progresso(frame, 0, 20);
  return (
    <Cena duracao={duracao} fundo={COR.linho}>
      <div
        style={{
          position: "absolute",
          left: moldura.x * largura,
          top: moldura.y * altura,
          width: caixa.largura,
          height: caixa.altura,
          overflow: "hidden",
          borderRadius: `${caixa.largura / 2}px ${caixa.largura / 2}px ${36 * u}px ${36 * u}px`,
          boxShadow: `0 ${30 * u}px ${80 * u}px rgba(94, 43, 78, 0.18)`,
          opacity: aparece,
          transform: `translateY(${(1 - aparece) * 40 * u}px)`,
        }}
      >
        <Foto src={foto.foto} largura={foto.largura} altura={foto.altura} caixa={caixa} foco={telaNoCentro} alvo={[0.5, 0.6]} zoom={[1, 1.04]} duracao={duracao}>
          <TelaDoCelular nomes={nomes} telaDa="vertical" />
        </Foto>
      </div>
      <Frase
        texto="Um convite para cada convidado."
        inicio={8}
        tamanho={titulo.tamanho * u}
        alinhamento={titulo.alinhamento}
        estilo={{ left: titulo.x * largura, width: titulo.l * largura, top: titulo.y * altura }}
      />
    </Cena>
  );
}

