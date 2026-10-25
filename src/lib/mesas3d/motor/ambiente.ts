// Ambiente: a luz refletida por todo o cenário (reflexos nos pratos, copos e mármore), desenhada de uma cena à parte.
import * as THREE from "three";
import type { DefinicaoDoCenario } from "../scenarios.ts";
import { corLinear } from "./materiais.ts";
import { texturaDoCeu } from "./texturas.ts";
import type { ContextoDoMotor } from "./tipos.ts";

function ambienteAoArLivre(ctx: ContextoDoMotor, c: DefinicaoDoCenario, es: THREE.Scene) {
  es.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ map: texturaDoCeu(ctx.texturas, c), side: THREE.BackSide })));
  const chao = new THREE.Mesh(new THREE.CircleGeometry(60, 24), new THREE.MeshBasicMaterial({ color: corLinear(c.chao!) }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.y = -0.4;
  es.add(chao);
}

function ambienteFechado(c: DefinicaoDoCenario, es: THREE.Scene) {
  es.add(new THREE.Mesh(new THREE.SphereGeometry(60, 24, 12), new THREE.MeshBasicMaterial({ color: corLinear(c.fundo!).multiplyScalar(1.6), side: THREE.BackSide })));
  for (const p of [[-20, 30, -10], [20, 30, -10], [0, 30, 14], [-25, 20, 18], [25, 20, 18]]) {
    const painel = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 14), new THREE.MeshBasicMaterial({ color: corLinear(c.sol.cor).multiplyScalar(5) }));
    painel.position.set(p[0], p[1], p[2]);
    painel.lookAt(0, 0, 0);
    es.add(painel);
  }
}

export function montarAmbiente(ctx: ContextoDoMotor, c: DefinicaoDoCenario) {
  const es = new THREE.Scene();
  if (c.externo) ambienteAoArLivre(ctx, c, es);
  else ambienteFechado(c, es);
  if (ctx.estado.ambienteRT) ctx.estado.ambienteRT.dispose();
  ctx.estado.ambienteRT = ctx.pmrem.fromScene(es, 0.03);
  ctx.cena.environment = ctx.estado.ambienteRT.texture;
  es.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    if (m.material) (m.material as THREE.Material).dispose();
  });
}
