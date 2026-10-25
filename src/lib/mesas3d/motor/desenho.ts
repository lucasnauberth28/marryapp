// Desenho sob demanda: o quadro só é desenhado quando algo muda, então a tela parada não gasta bateria.
import type { ContextoDoMotor } from "./tipos.ts";

/** Avança a animação da câmera um passo (chamado a cada quadro). */
function passoDaAnimacao(ctx: ContextoDoMotor) {
  const { camera, controles, estado } = ctx, anim = estado.animacao;
  if (!anim) return;
  const k = Math.min(1, (performance.now() - anim.t0) / anim.ms), suave = 1 - Math.pow(1 - k, 3);
  camera.position.lerpVectors(anim.p0, anim.p1, suave);
  controles.target.lerpVectors(anim.a0, anim.a1, suave);
  controles.update();
  if (k >= 1) estado.animacao = null;
}

function desenhar(ctx: ContextoDoMotor) {
  const { estado, renderer } = ctx;
  estado.renderPedido = false;
  if (estado.destruido) return;
  if (estado.animacao) passoDaAnimacao(ctx);
  renderer.render(ctx.cena, ctx.camera);
  ctx.opcoes.onRender?.({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles });
  if (estado.animacao) pedirDesenho(ctx);
}

export function pedirDesenho(ctx: ContextoDoMotor) {
  const { estado } = ctx;
  if (estado.destruido || estado.renderPedido) return;
  estado.renderPedido = true;
  requestAnimationFrame(() => desenhar(ctx));
}

/** Ajusta o tamanho do desenho ao elemento que o contém. */
export function redimensionar(ctx: ContextoDoMotor) {
  const { host } = ctx.opcoes, w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;
  ctx.renderer.setSize(w, h, false);
  ctx.camera.aspect = w / h;
  ctx.camera.updateProjectionMatrix();
  pedirDesenho(ctx);
}
