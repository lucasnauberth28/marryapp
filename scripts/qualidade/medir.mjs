// Padrão de tamanho do projeto: arquivos até 200 linhas e funções até 50. Uso: node scripts/qualidade/medir.mjs src
// Conta funções declaradas e arrow functions de bloco pelo pareamento de chaves (heurística, sem parser).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const raiz = process.argv[2] ?? "src";
const LIMITE_DE_LINHAS = 200, LIMITE_DA_FUNCAO = 50;

function arquivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === "node_modules" || n.startsWith(".") ? [] : arquivos(p);
    return /\.(ts|tsx)$/.test(n) && !/\.test\.ts$/.test(n) && !n.endsWith(".d.ts") ? [p] : [];
  });
}

/** Linhas de cada função: do início da declaração até a chave que fecha o corpo. */
function funcoesLongas(texto) {
  const linhas = texto.split("\n"), longas = [];
  const inicio = /^\s*(export\s+)?(default\s+)?(async\s+)?function\s+\w+|^\s*(export\s+)?const\s+\w+\s*=\s*(async\s*)?(\([^)]*\)|\w+)\s*(:\s*[^=]+)?=>\s*\{/;
  for (let i = 0; i < linhas.length; i++) {
    if (!inicio.test(linhas[i])) continue;
    let prof = 0, abriu = false;
    for (let j = i; j < linhas.length; j++) {
      for (const c of linhas[j].replace(/(["'`])(?:\\.|(?!\1).)*\1/g, "")) {
        if (c === "{") { prof++; abriu = true; } else if (c === "}") prof--;
      }
      if (abriu && prof <= 0) { if (j - i + 1 > LIMITE_DA_FUNCAO) longas.push(`${j - i + 1}@${i + 1}`); break; }
    }
  }
  return longas;
}

let fora = 0;
for (const f of arquivos(raiz)) {
  const texto = readFileSync(f, "utf8"), n = texto.split("\n").length, longas = funcoesLongas(texto);
  if (n > LIMITE_DE_LINHAS || longas.length) { fora++; console.log(` ${n} ${f.replace(raiz, ".")}${longas.length ? ` FUNÇÕES: ${longas.join(", ")}` : ""}`); }
}
console.log(fora ? `${fora} arquivo(s) fora do padrão` : "tudo dentro do padrão (≤200 linhas, funções ≤50)");
