// Homografia de um retângulo para quatro pontos (matrizes 3x3 em linha).
function matrizAdjunta(m: number[]) {
  return [
    m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3],
  ];
}
function multiplicarMatrizes(a: number[], b: number[]) {
  const c: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c[3 * i + j] = a[3 * i] * b[j] + a[3 * i + 1] * b[3 + j] + a[3 * i + 2] * b[6 + j];
  return c;
}
function multiplicarMatrizPorVetor(m: number[], v: number[]) {
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
}
function montarBaseDaProjecao(p: number[]) {
  const m = [p[0], p[2], p[4], p[1], p[3], p[5], 1, 1, 1];
  const v = multiplicarMatrizPorVetor(matrizAdjunta(m), [p[6], p[7], 1]);
  return multiplicarMatrizes(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}
export function calcularProjecao(origem: number[], destino: number[]) {
  const t = multiplicarMatrizes(montarBaseDaProjecao(destino), matrizAdjunta(montarBaseDaProjecao(origem)));
  return t.map((x) => x / t[8]);
}
