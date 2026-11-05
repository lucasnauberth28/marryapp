import { Cena } from "../componentes/cena";
import { Foto } from "../componentes/foto";
import { Frase } from "../componentes/frase";
import { useFormato } from "../tema";

/** Abertura: as mãos com a aliança e "Um sim." no linho vazio acima delas. */
export function CenaSim({ duracao }: { duracao: number }) {
  const { tipo, altura, u } = useFormato();
  const horizontal = tipo === "horizontal";
  return (
    <Cena duracao={duracao} entra={false}>
      <Foto
        src={horizontal ? "fotos/sim-horizontal.jpg" : "fotos/sim-vertical.jpg"}
        largura={horizontal ? 1536 : 1024}
        altura={horizontal ? 1024 : 1536}
        foco={horizontal ? [0.5, 0.64] : [0.52, 0.82]}
        alvo={horizontal ? [0.5, 0.66] : [0.5, 0.8]}
        zoom={[1, 1.07]}
        duracao={duracao}
      />
      <Frase texto="Um sim." inicio={Math.min(10, duracao * 0.12)} tamanho={(tipo === "vertical" ? 170 : 150) * u} estilo={{ left: 0, right: 0, top: altura * (tipo === "vertical" ? 0.27 : tipo === "quadrado" ? 0.18 : 0.2) }} />
    </Cena>
  );
}
