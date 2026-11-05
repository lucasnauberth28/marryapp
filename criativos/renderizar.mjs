// Renderiza os criativos. Uso:
//   node renderizar.mjs                 → todos os MP4 em out/
//   node renderizar.mjs quadros         → PNGs dos momentos-chave em out/quadros (revisão rápida)
//   node renderizar.mjs Principal-9x16  → só as composições cujo id começa assim
//   QUADROS=120,360 node renderizar.mjs quadros Principal-1x1 → só esses quadros
// CHROME_HEADLESS aponta para um Chrome headless já instalado (sem ele, o Remotion baixa o dele).
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia, renderStill } from "@remotion/renderer";
import path from "node:path";
import { mkdirSync } from "node:fs";

const navegador = process.env.CHROME_HEADLESS || undefined;
const arg = process.argv[2] ?? "";
const soQuadros = arg === "quadros";
const filtro = soQuadros ? process.argv[3] ?? "" : arg;

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composicoes = (await getCompositions(serveUrl, { browserExecutable: navegador })).filter((c) => c.id.startsWith(filtro));
mkdirSync(soQuadros ? "out/quadros" : "out", { recursive: true });

// Um quadro no meio de cada cena (o mesmo encadeamento do filme)
const MOMENTOS = { Principal: [60, 120, 230, 330, 450, 580], Curto: [35, 100, 170] };

for (const c of composicoes) {
  if (soQuadros) {
    const escolhidos = process.env.QUADROS ? process.env.QUADROS.split(",").map(Number) : MOMENTOS[c.id.split("-")[0]];
    for (const frame of escolhidos) {
      await renderStill({ composition: c, serveUrl, frame, output: `out/quadros/${c.id}-${String(frame).padStart(3, "0")}.png`, browserExecutable: navegador });
    }
    console.log("quadros", c.id);
    continue;
  }
  await renderMedia({ composition: c, serveUrl, codec: "h264", crf: 18, pixelFormat: "yuv420p", outputLocation: `out/${c.id}.mp4`, browserExecutable: navegador, concurrency: 4 });
  console.log("vídeo", c.id);
}
