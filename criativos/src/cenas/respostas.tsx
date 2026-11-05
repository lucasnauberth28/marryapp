import { Cena } from "../componentes/cena";
import { Frase } from "../componentes/frase";
import { ListaDeRespostas } from "../componentes/respostas";
import { COR, useFormato, type TipoDeFormato } from "../tema";

const ARRANJO: Record<TipoDeFormato, { titulo: { x: number; y: number; l: number; tamanho: number; alinhamento: "left" | "center" }; lista: { x: number; y: number; l: number } }> = {
  horizontal: { titulo: { x: 0.08, y: 0.38, l: 0.36, tamanho: 92, alinhamento: "left" }, lista: { x: 0.5, y: 0.16, l: 780 } },
  vertical: { titulo: { x: 0.08, y: 0.15, l: 0.84, tamanho: 92, alinhamento: "center" }, lista: { x: 0.08, y: 0.34, l: 900 } },
  quadrado: { titulo: { x: 0.06, y: 0.07, l: 0.88, tamanho: 72, alinhamento: "center" }, lista: { x: 0.14, y: 0.22, l: 760 } },
};

/** As respostas chegam: o número de confirmados sobe e um presente aparece. */
export function CenaRespostas({ duracao }: { duracao: number }) {
  const { tipo, largura, altura, u } = useFormato();
  const { titulo, lista } = ARRANJO[tipo];
  return (
    <Cena duracao={duracao} fundo={COR.linho}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 70% 50%, ${COR.nevoa} 0%, ${COR.linho} 65%)` }} />
      <Frase texto="Acompanhem cada resposta." inicio={6} tamanho={titulo.tamanho * u} alinhamento={titulo.alinhamento} estilo={{ left: titulo.x * largura, width: titulo.l * largura, top: titulo.y * altura }} />
      <div style={{ position: "absolute", left: lista.x * largura, top: lista.y * altura }}>
        <ListaDeRespostas u={u} largura={lista.l * u} />
      </div>
    </Cena>
  );
}
