// Ruído e misturas usados para desenhar texturas por código. Tudo puro e determinístico.

export type RGB = [number, number, number];

function hash(ix: number, iy: number, s: number) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

export const hashDoPonto = hash;

/** Ruído de valor com repetição (px, py) para a textura emendar. */
export function ruidoDeValor(x: number, y: number, s: number, px: number, py: number) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const x0 = ((ix % px) + px) % px, x1 = (((ix + 1) % px) + px) % px, y0 = ((iy % py) + py) % py, y1 = (((iy + 1) % py) + py) % py;
  const a = hash(x0, y0, s), b = hash(x1, y0, s), c = hash(x0, y1, s), d = hash(x1, y1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Soma de oitavas do ruído de valor. */
export function ruidoEmOitavas(x: number, y: number, oitavas: number, s: number, px: number, py: number) {
  let total = 0, amplitude = 0.5, frequencia = 1, soma = 0;
  for (let i = 0; i < oitavas; i++) {
    total += amplitude * ruidoDeValor(x * frequencia, y * frequencia, s + i, px * frequencia, py * frequencia);
    soma += amplitude;
    frequencia *= 2;
    amplitude *= 0.5;
  }
  return total / soma;
}

export const degrauSuave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export const misturar = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export const escurecer = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
