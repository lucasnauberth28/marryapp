// Serviço à mesa (prato de sousplat, prato, guardanapo, copos), instâncias das mesas, cadeiras com fita e anéis de seleção.
import * as THREE from "three";
import type { DefinicaoDoCenario } from "../scenarios.ts";
import { marcarBrilho } from "./decoracao.ts";
import { geometriaDaCadeira, geometriaDaFita, geometriaDaSaia, geometriaDoCopo } from "./geometrias.ts";
import { corLinear, materialLuminoso, materialPadrao } from "./materiais.ts";
import type { MateriaisDasMesas, PecasDasMesas } from "./mesas-postas.ts";
import { instanciar } from "./pecas.ts";
import type { ContextoDoMotor, GrupoDeCadeiras, PosicaoDeCadeira } from "./tipos.ts";

/** Prato, sousplat, guardanapo e dois copos diante de cada cadeira. */
export function postarServico(pecas: PecasDasMesas, cadeiras: PosicaoDeCadeira[], alturaDaMesa: number) {
  for (const p of cadeiras) {
    const fx = Math.sin(p.ry), fz = Math.cos(p.ry), rx = Math.cos(p.ry), rz = -Math.sin(p.ry);
    pecas.carga.push({ x: p.px, y: alturaDaMesa + 0.004, z: p.pz });
    pecas.prato.push({ x: p.px, y: alturaDaMesa + 0.016, z: p.pz });
    pecas.guardanapo.push({ x: p.px, y: alturaDaMesa + 0.03, z: p.pz, ry: 0.5 + p.px });
    pecas.copo.push({ x: p.px + fx * 0.2 + rx * 0.1, y: alturaDaMesa, z: p.pz + fz * 0.2 + rz * 0.1 });
    pecas.copo.push({ x: p.px + fx * 0.18 + rx * 0.2, y: alturaDaMesa, z: p.pz + fz * 0.18 + rz * 0.2 });
  }
}

/** Tampos, saias e pés das mesas redondas, todos instanciados. */
function instanciarMesasRedondas(ctx: ContextoDoMotor, pecas: PecasDasMesas, m: MateriaisDasMesas) {
  if (!pecas.tampos.length) return;
  instanciar(ctx, new THREE.CylinderGeometry(0.97, 0.97, 0.07, 48), m.mesa, pecas.tampos, true);
  if (pecas.saias.length) instanciar(ctx, geometriaDaSaia(0.97, 1.07, 0.74), m.toalha!, pecas.saias, true);
  if (!pecas.pes.length) return;
  instanciar(ctx, new THREE.CylinderGeometry(0.1, 0.1, 0.74, 12), materialPadrao("#4A3223", 0.8), pecas.pes, true);
  instanciar(ctx, new THREE.CylinderGeometry(0.5, 0.5, 0.05, 24), materialPadrao("#4A3223", 0.8), pecas.pes.map((p) => ({ x: p.x, y: 0.03, z: p.z })), true);
}

function instanciarLouca(ctx: ContextoDoMotor, c: DefinicaoDoCenario, pecas: PecasDasMesas, m: MateriaisDasMesas) {
  instanciar(ctx, new THREE.CylinderGeometry(0.18, 0.18, 0.008, 28), materialPadrao(c.carga, 0.3, { metalness: 0.5, envMapIntensity: 1 }), pecas.carga, true);
  instanciar(ctx, new THREE.CylinderGeometry(0.15, 0.1, 0.022, 28), materialPadrao("#FFFFFF", 0.18, { envMapIntensity: 1 }), pecas.prato, true);
  instanciar(ctx, new THREE.BoxGeometry(0.12, 0.014, 0.12), materialPadrao(c.guardanapo, 0.9, { bumpMap: m.bumpDoLinho, bumpScale: 0.5 }), pecas.guardanapo, true);
  const vidro = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.32, envMapIntensity: 1.8, depthWrite: false });
  instanciar(ctx, geometriaDoCopo(), vidro, pecas.copo, false);
}

function instanciarFloresEVelas(ctx: ContextoDoMotor, pecas: PecasDasMesas) {
  instanciar(ctx, new THREE.SphereGeometry(1, 10, 8), materialPadrao("#ffffff", 0.75), pecas.flor, true);
  instanciar(ctx, new THREE.SphereGeometry(1, 8, 6), materialPadrao("#ffffff", 0.9), pecas.folha, false);
  if (!pecas.vela.length) return;
  instanciar(ctx, new THREE.CylinderGeometry(0.025, 0.025, 0.14, 10), materialPadrao("#FFF6E8", 0.7), pecas.vela, false);
  instanciar(ctx, new THREE.SphereGeometry(0.022, 8, 6), materialLuminoso("#FFD08A"), pecas.vela.map((p) => ({ x: p.x, y: p.y + 0.1, z: p.z, sy: 1.5 })), false);
  pecas.vela.forEach((p) => marcarBrilho(ctx, p.x, p.y + 0.1, p.z));
}

export function instanciarMesasEServico(ctx: ContextoDoMotor, c: DefinicaoDoCenario, pecas: PecasDasMesas, m: MateriaisDasMesas) {
  instanciarMesasRedondas(ctx, pecas, m);
  instanciarLouca(ctx, c, pecas, m);
  instanciarFloresEVelas(ctx, pecas);
}

/** Cadeiras de verdade (estrutura e almofada) e a fita colorida do convidado. */
export function instanciarCadeiras(ctx: ContextoDoMotor, c: DefinicaoDoCenario, grupos: GrupoDeCadeiras[], total: number) {
  if (total <= 0) return;
  const { auxiliar, estado } = ctx;
  const cadeiras = new THREE.InstancedMesh(geometriaDaCadeira(c), materialPadrao("#ffffff", 0.55, { vertexColors: true }), total);
  const fitas = (estado.fitas = new THREE.InstancedMesh(geometriaDaFita(), materialPadrao("#ffffff", 0.7, { vertexColors: true }), total));
  for (const g of grupos)
    g.pos.forEach((p, i) => {
      const id = g.start + i;
      auxiliar.scale.set(1, 1, 1);
      auxiliar.rotation.set(0, p.ry, 0);
      auxiliar.position.set(p.x, 0, p.z);
      auxiliar.updateMatrix();
      cadeiras.setMatrixAt(id, auxiliar.matrix);
      estado.basesDasFitas[id] = { x: p.x, z: p.z, ry: p.ry };
    });
  cadeiras.castShadow = true;
  cadeiras.receiveShadow = true;
  fitas.castShadow = true;
  ctx.raiz.add(cadeiras, fitas);
}

/** Anel que marca a mesa sob o dedo (ao arrastar) e o anel da busca. */
export function criarAneis(ctx: ContextoDoMotor) {
  const geometria = new THREE.RingGeometry(1.75, 1.95, 48), e = ctx.estado;
  e.anelDeDestino = new THREE.Mesh(geometria, new THREE.MeshBasicMaterial({ color: corLinear("#E8B4D5"), side: THREE.DoubleSide, transparent: true, opacity: 0.95 }));
  e.anelDeDestino.rotation.x = -Math.PI / 2;
  e.anelDeDestino.position.y = 0.2;
  e.anelDeDestino.visible = false;
  ctx.raiz.add(e.anelDeDestino);
  e.anelDeBusca = new THREE.Mesh(geometria.clone(), new THREE.MeshBasicMaterial({ color: corLinear("#FFFFFF"), side: THREE.DoubleSide, transparent: true, opacity: 0.95 }));
  e.anelDeBusca.rotation.x = -Math.PI / 2;
  e.anelDeBusca.position.y = 0.21;
  e.anelDeBusca.visible = false;
  ctx.raiz.add(e.anelDeBusca);
}
