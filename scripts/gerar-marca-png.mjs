// Gera o PNG da assinatura horizontal (e-mail e PDF) a partir da arte oficial public/brand/aceito-horizontal-ameixa.svg.
// O Open Graph, os ícones e o favicon vêm prontos do Kit de Marca v2 (public/brand/aceito-og.png, public/icons, src/app/icon.svg).
// Uso: CHROMIUM_PATH=/caminho/do/chromium node scripts/gerar-marca-png.mjs
// Saídas: public/brand/aceito-lockup-email.png (assinatura horizontal em ameixa, 480 px, para e-mail e PDF)
//         e src/lib/brand/lockup-png.ts (base64 para o PDF).
// Só rode de novo se a marca mudar. As curvas vêm do SVG oficial.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const raiz = resolve(import.meta.dirname, "..");
const svg = (arquivo) => readFileSync(join(raiz, "public/brand", arquivo), "utf8");
const comCor = (conteudo, cor) => conteudo.replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${cor}"`).replace(/ width="\d+" height="\d+"/, ' width="100%" height="100%"');

const AMEIXA = "#5E2B4E";

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const pasta = mkdtempSync(join(tmpdir(), "marca-"));

async function renderizar({ html, largura, altura, saida, transparente }) {
  const arquivo = join(pasta, `${Date.now()}.html`);
  writeFileSync(arquivo, html);
  const pagina = await navegador.newPage({ viewport: { width: largura, height: altura }, deviceScaleFactor: 1 });
  await pagina.goto(pathToFileURL(arquivo).href);
  await pagina.evaluate(() => document.fonts.ready);
  const png = await pagina.screenshot({ omitBackground: transparente, clip: { x: 0, y: 0, width: largura, height: altura } });
  await pagina.close();
  writeFileSync(saida, png);
  console.log(`${saida.replace(raiz + "/", "")} (${png.length} bytes)`);
  return png;
}

// 1) Assinatura horizontal em ameixa, fundo transparente. 480 px = 3x da largura mínima recomendada (160 px).
const lockup = await renderizar({
  html: `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}svg{display:block}</style><div style="width:480px;height:79px">${comCor(svg("aceito-horizontal-ameixa.svg").replace(/viewBox="[^"]+"/, 'viewBox="32 47.79 1000.25 163.64"'), AMEIXA)}</div>`,
  largura: 480,
  altura: 79,
  saida: join(raiz, "public/brand/aceito-lockup-email.png"),
  transparente: true,
});
mkdirSync(join(raiz, "src/lib/brand"), { recursive: true });
writeFileSync(
  join(raiz, "src/lib/brand/lockup-png.ts"),
  `// Gerado por scripts/gerar-marca-png.mjs. Assinatura horizontal em ameixa (PNG ${lockup.length} bytes, 480x79), para o PDF.\nexport const LOCKUP_PNG_BASE64 =\n  "${lockup.toString("base64")}";\nexport const LOCKUP_PNG_RATIO = 480 / 79;\n`,
);

await navegador.close();
