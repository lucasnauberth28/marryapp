import { Composition } from "remotion";
import { DURACAO_CURTO, DURACAO_PRINCIPAL, FilmeCurto, FilmePrincipal, QUADROS_POR_SEGUNDO } from "./filme";
import { fontesProntas, type Casal } from "./tema";

void fontesProntas;

const FORMATOS = [
  { id: "16x9", largura: 1920, altura: 1080 },
  { id: "9x16", largura: 1080, altura: 1920 },
  { id: "1x1", largura: 1080, altura: 1080 },
];
const CASAIS: Casal[] = ["noivas", "noivos"];

/** Uma composição por filme × formato × casal: Principal-16x9-noivas, Curto-9x16-noivos… */
export function Raiz() {
  return (
    <>
      {FORMATOS.flatMap((f) =>
        CASAIS.flatMap((casal) => [
          <Composition key={`p-${f.id}-${casal}`} id={`Principal-${f.id}-${casal}`} component={FilmePrincipal} durationInFrames={DURACAO_PRINCIPAL} fps={QUADROS_POR_SEGUNDO} width={f.largura} height={f.altura} defaultProps={{ casal }} />,
          <Composition key={`c-${f.id}-${casal}`} id={`Curto-${f.id}-${casal}`} component={FilmeCurto} durationInFrames={DURACAO_CURTO} fps={QUADROS_POR_SEGUNDO} width={f.largura} height={f.altura} defaultProps={{ casal }} />,
        ]),
      )}
    </>
  );
}
