// Montagem do cenário: limpa o que havia, ajusta fundo e luzes, constrói o ambiente, as mesas postas e as cadeiras.
import * as THREE from "three";
import type { DefinicaoDoCenario } from "../scenarios.ts";
import { montarAmbiente } from "./ambiente.ts";
import { montarCenario } from "./cenarios/index.ts";
import { criarBrilhos } from "./decoracao.ts";
import { corLinear, materialPadrao } from "./materiais.ts";
import { mesaPosta, pecasVazias, type MateriaisDasMesas } from "./mesas-postas.ts";
import { criarAneis, instanciarCadeiras, instanciarMesasEServico, postarServico } from "./servico.ts";
import { texturaDeLinho, texturaDeTabuas } from "./texturas.ts";
import type { ContextoDoMotor } from "./tipos.ts";

/** Descarta tudo que está na cena (e na placa de vídeo) antes de montar de novo. */
export function limparCena(ctx: ContextoDoMotor) {
  const { raiz, estado } = ctx;
  while (raiz.children.length) {
    const objeto = raiz.children.pop()!;
    objeto.traverse((n) => {
      const m = n as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => mt.dispose());
    });
  }
  estado.geometriaDaFolha = null; // a geometria da copa foi descartada junto
  estado.gruposDeCadeiras = [];
  estado.basesDasFitas = [];
  estado.brilhos = [];
  estado.fitas = null;
  estado.anelDeDestino = null;
  estado.anelDeBusca = null;
}

/** A fita do encosto ganha a cor do grupo de quem senta; cadeira vazia fica sem fita. */
export function pintarFitas(ctx: ContextoDoMotor) {
  const { estado, auxiliar } = ctx, fitas = estado.fitas;
  if (!fitas) return;
  const cor = new THREE.Color();
  for (const g of estado.gruposDeCadeiras) {
    const cores = estado.preenchimentos[g.tableId] ?? [];
    for (let i = 0; i < g.n; i++) {
      const base = estado.basesDasFitas[g.start + i], ocupada = i < cores.length;
      auxiliar.position.set(base.x, 0, base.z);
      auxiliar.rotation.set(0, base.ry, 0);
      auxiliar.scale.setScalar(ocupada ? 1 : 0.0001);
      auxiliar.updateMatrix();
      fitas.setMatrixAt(g.start + i, auxiliar.matrix);
      if (ocupada) cor.set(cores[i]).convertSRGBToLinear();
      else cor.set(0xffffff);
      fitas.setColorAt(g.start + i, cor);
    }
  }
  fitas.instanceMatrix.needsUpdate = true;
  if (fitas.instanceColor) fitas.instanceColor.needsUpdate = true;
}

/** Fundo, névoa, exposição, luz do céu e sol (com a sombra cobrindo o salão). */
function configurarLuzes(ctx: ContextoDoMotor, c: DefinicaoDoCenario, sala: [number, number]) {
  const { cena, renderer, luzDoCeu, sol } = ctx;
  renderer.toneMappingExposure = c.expo || 1;
  if (c.externo) {
    cena.background = corLinear(c.ceu!.horiz);
    cena.fog = new THREE.Fog(corLinear(c.neblina!), 90, 270);
  } else {
    cena.background = corLinear(c.fundo!);
    cena.fog = null;
  }
  luzDoCeu.color.copy(corLinear(c.hemi[0]));
  luzDoCeu.groundColor.copy(corLinear(c.hemi[1]));
  luzDoCeu.intensity = c.hemi[2];
  sol.color.copy(corLinear(c.sol.cor));
  sol.intensity = c.sol.int;
  sol.position.set(c.sol.pos[0], c.sol.pos[1], c.sol.pos[2]);
  sol.target.position.set(0, 0, 2);
  const sombra = sol.shadow.camera, raio = Math.max(sala[0], sala[1]) * 0.62;
  sombra.left = -raio; sombra.right = raio; sombra.top = raio; sombra.bottom = -raio; sombra.near = 1; sombra.far = 150;
  sombra.updateProjectionMatrix();
}

function materiaisDasMesas(ctx: ContextoDoMotor, c: DefinicaoDoCenario): MateriaisDasMesas {
  const linho = texturaDeLinho(ctx.texturas, "linho", 30, 4), linhoFino = texturaDeLinho(ctx.texturas, "linho2", 6, 1);
  const toalha = c.toalha ? materialPadrao(c.toalha, 0.9, { bumpMap: linho.bump, bumpScale: 0.6 }) : null;
  const madeira = texturaDeTabuas(ctx.texturas, "mesa_r", false, [[86, 56, 36], [124, 84, 56]], 5, 2, 1);
  const mesa = toalha || materialPadrao("#ffffff", 0.55, { map: madeira.map, bumpMap: madeira.bump, bumpScale: 1.2 });
  return { toalha, mesa, bumpDoLinho: linhoFino.bump };
}

/** Põe todas as mesas do desenho e devolve o total de cadeiras. */
function porAsMesas(ctx: ContextoDoMotor, c: DefinicaoDoCenario) {
  const pecas = pecasVazias(), materiais = materiaisDasMesas(ctx, c), { estado } = ctx;
  let totalDeCadeiras = 0;
  for (const t of estado.layout.slots) {
    const cadeiras = mesaPosta(ctx, c, t, pecas, materiais);
    postarServico(pecas, cadeiras, t.forma === "round" ? 0.797 : 0.808);
    estado.gruposDeCadeiras.push({ tableId: t.id, start: totalDeCadeiras, n: cadeiras.length, pos: cadeiras });
    totalDeCadeiras += cadeiras.length;
  }
  instanciarMesasEServico(ctx, c, pecas, materiais);
  return totalDeCadeiras;
}

const COR_DOS_BRILHOS: Record<string, [string, number]> = { classico: ["#FFE2A8", 1.4], rustico: ["#FFD59A", 1.0], jardim: ["#FFD79A", 1.0] };

export function construirCena(ctx: ContextoDoMotor) {
  const { estado } = ctx, c = estado.layout.scene, sala = estado.layout.sala;
  limparCena(ctx);
  estado.semente = 7;
  configurarLuzes(ctx, c, sala);
  montarAmbiente(ctx, c);
  montarCenario(ctx, c, sala);
  const total = porAsMesas(ctx, c);
  instanciarCadeiras(ctx, c, estado.gruposDeCadeiras, total);
  criarAneis(ctx);
  const [corDoBrilho, tamanhoDoBrilho] = COR_DOS_BRILHOS[c.id] ?? COR_DOS_BRILHOS.jardim;
  criarBrilhos(ctx, corDoBrilho, tamanhoDoBrilho);
  pintarFitas(ctx);
  ctx.renderer.shadowMap.needsUpdate = true;
  estado.montado = true;
}
