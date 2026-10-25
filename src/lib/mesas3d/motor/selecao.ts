// Escolher uma mesa tocando ou clicando na cena: o ponto na tela vira um ponto no chão, e a mesa é a que contém esse ponto.
import * as THREE from "three";
import type { PosicaoDaMesa } from "../layout.ts";
import type { ContextoDoMotor } from "./tipos.ts";

const raio = new THREE.Raycaster(), ndc = new THREE.Vector2(), chao = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ponto = new THREE.Vector3();

function pontoNoChao(ctx: ContextoDoMotor, clienteX: number, clienteY: number) {
  const r = ctx.opcoes.canvas.getBoundingClientRect();
  if (clienteX < r.left || clienteX > r.right || clienteY < r.top || clienteY > r.bottom) return null;
  ndc.set(((clienteX - r.left) / r.width) * 2 - 1, -((clienteY - r.top) / r.height) * 2 + 1);
  raio.setFromCamera(ndc, ctx.camera);
  return raio.ray.intersectPlane(chao, ponto) ? ponto.clone() : null;
}

export function mesaNoPonto(ctx: ContextoDoMotor, clienteX: number, clienteY: number): PosicaoDaMesa | null {
  const p = pontoNoChao(ctx, clienteX, clienteY);
  if (!p) return null;
  let melhor: PosicaoDaMesa | null = null, menorDistancia = 1e9;
  for (const t of ctx.estado.layout.slots) {
    const dx = Math.abs(p.x - t.x), dz = Math.abs(p.z - t.z);
    if (dx <= t.hx && dz <= t.hz) {
      const d = dx * dx + dz * dz;
      if (d < menorDistancia) {
        menorDistancia = d;
        melhor = t;
      }
    }
  }
  return melhor;
}

/** Liga o toque na cena: só conta como escolha se a pessoa não arrastou (menos de 5 px). Devolve a função que desliga. */
export function ligarEscolhaDeMesa(ctx: ContextoDoMotor) {
  const { canvas } = ctx.opcoes;
  let inicio: { x: number; y: number } | null = null;
  const aoPressionar = (e: PointerEvent) => { inicio = { x: e.clientX, y: e.clientY }; };
  const aoSoltar = (e: PointerEvent) => {
    const foiArrasto = !inicio || Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 5;
    inicio = null;
    if (!foiArrasto) ctx.opcoes.onTablePick?.(mesaNoPonto(ctx, e.clientX, e.clientY));
  };
  canvas.addEventListener("pointerdown", aoPressionar);
  canvas.addEventListener("pointerup", aoSoltar);
  return () => {
    canvas.removeEventListener("pointerdown", aoPressionar);
    canvas.removeEventListener("pointerup", aoSoltar);
  };
}

/** Posiciona um anel de seleção sobre a mesa (ou o esconde). */
export function posicionarAnel(ring: THREE.Mesh | null, t: PosicaoDaMesa | null, aumento: number) {
  if (!ring) return;
  if (!t) {
    ring.visible = false;
    return;
  }
  ring.position.x = t.x;
  ring.position.z = t.z;
  ring.scale.setScalar(t.forma === "round" ? aumento * (t.r / 0.97) : Math.max(t.w, t.d + 2) / (aumento > 1 ? 3 : 3.2));
  ring.visible = true;
}
