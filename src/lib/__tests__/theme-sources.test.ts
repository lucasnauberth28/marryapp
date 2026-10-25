import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { CORES_DO_QR } from "../qr-colors.ts";

// Guardas do tema escuro no código das telas (os tokens ficam em theme-tokens.test.ts).
const SRC = new URL("../../", import.meta.url).pathname;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : files(path);
    return /\.(tsx|ts)$/.test(name) ? [path] : [];
  });
}

const sources = files(SRC).map((path) => ({ path: path.replace(SRC, "src/"), text: readFileSync(path, "utf8") }));

test("véus de diálogo e gaveta usam bg-scrim (bg-tinta/NN clareia a página no escuro)", () => {
  const bad = sources.filter(({ text }) => /\b(?:backdrop:)?bg-tinta\/\d+/.test(text)).map((s) => s.path);
  assert.deepEqual(bad, []);
});

test("QR Code: módulos escuros sobre branco, contraste de 7:1 ou mais", () => {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  assert.equal(CORES_DO_QR.bgColor.toLowerCase(), "#ffffff");
  const [hi, lo] = [lum(CORES_DO_QR.bgColor), lum(CORES_DO_QR.fgColor)].sort((a, b) => b - a);
  assert.ok((hi + 0.05) / (lo + 0.05) >= 7);
});

test("telas que desenham QR Code usam a moldura de fundo branco fixo", () => {
  const withQr = sources.filter(({ text, path }) => /QRCode(?:SVG|Canvas)/.test(text) && !path.endsWith("qr-frame.tsx") && !path.endsWith("qr-colors.ts") && !path.includes("rsvp-client"));
  assert.ok(withQr.length >= 3);
  for (const { path, text } of withQr) assert.ok(text.includes("MolduraDoQr"), `${path} deve usar MolduraDoQr`);
});
