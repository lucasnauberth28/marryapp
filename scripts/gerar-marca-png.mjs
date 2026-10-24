// Gera os PNGs de marca que não podem ser SVG (e-mail, PDF e Open Graph) a partir de public/brand/*.svg.
// Uso: CHROMIUM_PATH=/caminho/do/chromium node scripts/gerar-marca-png.mjs
// Saídas: public/brand/aceito-lockup-email.png (assinatura horizontal em ameixa, 480 px, para e-mail e PDF)
//         public/brand/aceito-og.png (1200x630, Open Graph) e src/lib/brand/lockup-png.ts (base64 para o PDF).
// Só rode de novo se a marca mudar. As curvas vêm do SVG; o texto do Open Graph é Urbanist e Geist (arquivos locais).
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const raiz = resolve(import.meta.dirname, "..");
const svg = (arquivo) => readFileSync(join(raiz, "public/brand", arquivo), "utf8");
const comCor = (conteudo, cor) => conteudo.replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${cor}"`).replace(/ width="\d+" height="\d+"/, ' width="100%" height="100%"');
const fonte = (arquivo) => pathToFileURL(join(raiz, "src/app/fonts", arquivo)).href;

const AMEIXA = "#5E2B4E";
const ROSA = "#F2D7E7";
const PROFUNDO = "#2E1226";
const PROFUNDO_2 = "#43203A";

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
  html: `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}svg{display:block}</style><div style="width:480px;height:79px">${comCor(svg("aceito-lockup.svg"), AMEIXA)}</div>`,
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

// 2) Open Graph: fundo profundo com contraste, uma ideia e o endereço (manual p.20, "peça editorial").
await renderizar({
  html: `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Urbanist;src:url(${fonte("urbanist-latin.woff2")});font-weight:100 900}
@font-face{font-family:Geist;src:url(${fonte("geist-latin.woff2")});font-weight:100 900}
html,body{margin:0}
.peca{position:relative;width:1200px;height:630px;overflow:hidden;background:${PROFUNDO};color:#FBF4F8;font-family:Geist,sans-serif}
.arco{position:absolute;right:-250px;bottom:-330px;width:900px;height:900px;border-radius:50%;border:120px solid ${PROFUNDO_2}}
.logo{position:absolute;left:72px;top:64px;width:240px;height:39px}
h1{position:absolute;left:72px;top:215px;width:1000px;margin:0;font:500 68px/1.1 Urbanist,sans-serif;letter-spacing:-.01em}
p{position:absolute;left:72px;margin:0}
.apoio{top:410px;font-size:30px;line-height:1.4;color:#D9C2D1;width:700px}
.url{bottom:60px;font-size:26px;font-weight:500;color:${ROSA}}
</style><div class="peca"><div class="arco"></div><div class="logo">${comCor(svg("aceito-lockup.svg"), ROSA)}</div>
<h1>O casamento de vocês,<br>mais simples de organizar.</h1><p class="apoio">Site, convidados e presentes num painel só.</p><p class="url">meuaceito.com.br</p></div>`,
  largura: 1200,
  altura: 630,
  saida: join(raiz, "public/brand/aceito-og.png"),
});

await navegador.close();
