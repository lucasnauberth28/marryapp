// Gera os ícones do app instalável (public/icons/*.png) a partir da marca em public/brand.
// Uso: node scripts/gerar-icones-pwa.mjs
// Fundo ameixa com a marca em linho (o "a" dentro do arco). Os PNGs ficam no repositório;
// só rode de novo se a marca mudar.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const AMEIXA = "#5E2B4E";
const MARK_W = 64;
const MARK_H = 88;

/** Conteúdo do SVG da marca em linho (sem a tag <svg>), para encaixar dentro de outro desenho. */
function markInner(file) {
  const svg = readFileSync(file, "utf8");
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
}

const inner = markInner("public/brand/aceito-mark-linho.svg");
// Marca só em silhueta (para o selo pequeno das notificações no Android, que usa só a transparência)
const silhouette = `<path fill="#fff" d="M0 88V32A32 32 0 0 1 64 32V88Z"/>`;

/** Quadrado `size` com a marca ocupando `fraction` da altura, centralizada. */
function square(size, fraction, { background = AMEIXA, content = inner } = {}) {
  const h = size * fraction;
  const k = h / MARK_H;
  const x = (size - MARK_W * k) / 2;
  const y = (size - h) / 2;
  const bg = background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}<g transform="translate(${x} ${y}) scale(${k})">${content}</g></svg>`;
}

function png(svg, size) {
  return new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
}

mkdirSync("public/icons", { recursive: true });
const files = {
  // ícone comum: marca ocupa 60% da altura
  "icon-192.png": png(square(192, 0.6), 192),
  "icon-512.png": png(square(512, 0.6), 512),
  // maskable: o Android recorta em círculo/quadrado arredondado; a marca fica na zona segura (menos de 80% do centro)
  "icon-maskable-512.png": png(square(512, 0.46), 512),
  // iOS aplica a própria máscara: quadrado cheio
  "apple-touch-icon.png": png(square(180, 0.6), 180),
  // selo monocromático das notificações (só a transparência importa)
  "badge-96.png": png(square(96, 0.78, { background: null, content: silhouette }), 96),
};
for (const [name, data] of Object.entries(files)) {
  writeFileSync(`public/icons/${name}`, data);
  console.log(`public/icons/${name} (${data.length} bytes)`);
}
