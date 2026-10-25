// Motor das mesas em 3D (Three.js): monta o cenário escolhido, as mesas postas com as cadeiras do casamento e as câmeras.
// Só roda no navegador. Tudo é desenhado por código (texturas e modelos procedurais, sem arquivos de imagem ou de modelo).
// Leve de propósito: peças repetidas são instâncias, as sombras são assadas (só recalculam quando o cenário muda) e o
// quadro só é desenhado quando algo muda (câmera, mesa ou seleção), então a tela parada não gasta bateria.
// As peças ficam em ./motor/: este arquivo só liga os eventos e expõe a API que a tela usa.
import * as THREE from "three";
import { calcularDisposicao, type MesaDeEntrada } from "./layout.ts";
import { criarContexto } from "./motor/base.ts";
import { aplicarPredefinicao, encontrarMesa, irParaMesa, vistaDaMesa } from "./motor/camera.ts";
import { pedirDesenho, redimensionar } from "./motor/desenho.ts";
import { construirCena, limparCena, pintarFitas } from "./motor/montagem.ts";
import { ligarEscolhaDeMesa, mesaNoPonto, posicionarAnel } from "./motor/selecao.ts";
import { liberarTexturas } from "./motor/texturas.ts";
import type { ContextoDoMotor, OpcoesDoMotor } from "./motor/tipos.ts";

export type { OpcoesDoMotor, PredefinicaoDaCamera } from "./motor/tipos.ts";

/** O navegador consegue criar um contexto WebGL? Para mostrar um aviso em vez de uma tela em branco. */
export function webglEstaDisponivel(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Liga os eventos da câmera, do tamanho da tela, do contexto WebGL e do toque. Devolve a função que desliga tudo. */
function ligarEventos(ctx: ContextoDoMotor) {
  const { canvas, host } = ctx.opcoes;
  ctx.controles.addEventListener("change", () => pedirDesenho(ctx));
  ctx.controles.addEventListener("start", () => ctx.opcoes.onCameraGrab?.());
  const observador = new ResizeObserver(() => redimensionar(ctx));
  observador.observe(host);
  const aoPerderOContexto = (e: Event) => {
    e.preventDefault();
    ctx.opcoes.onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", aoPerderOContexto);
  const desligarEscolha = ligarEscolhaDeMesa(ctx);
  return () => {
    observador.disconnect();
    canvas.removeEventListener("webglcontextlost", aoPerderOContexto);
    desligarEscolha();
  };
}

function destruir(ctx: ContextoDoMotor, desligarEventos: () => void) {
  ctx.estado.destruido = true;
  desligarEventos();
  ctx.controles.dispose();
  limparCena(ctx);
  liberarTexturas(ctx.texturas);
  if (ctx.estado.ambienteRT) ctx.estado.ambienteRT.dispose();
  ctx.pmrem.dispose();
  ctx.renderer.dispose();
  ctx.renderer.forceContextLoss();
}

function refazer(ctx: ContextoDoMotor, idDoCenario: string) {
  ctx.estado.layout = calcularDisposicao(idDoCenario, ctx.estado.mesasDeEntrada);
  construirCena(ctx);
  pedirDesenho(ctx);
}

/** Posição na tela (em px dentro do elemento do desenho) do rótulo de uma mesa. */
function projetarRotulo(ctx: ContextoDoMotor, id: string) {
  const t = encontrarMesa(ctx, id);
  if (!t) return null;
  const v = new THREE.Vector3(t.x, 1.7, t.z).project(ctx.camera), { host } = ctx.opcoes;
  return { x: ((v.x + 1) / 2) * host.clientWidth, y: ((1 - v.y) / 2) * host.clientHeight, visible: v.z <= 1 && v.z >= -1 };
}

const mesmasMesas = (a: MesaDeEntrada[], b: MesaDeEntrada[]) => a.length === b.length && a.every((t, i) => t.id === b[i].id && t.name === b[i].name && t.capacity === b[i].capacity);

export function criarMotorDasMesas3D(opcoes: OpcoesDoMotor) {
  const ctx = criarContexto(opcoes), { estado } = ctx;
  const desligarEventos = ligarEventos(ctx);
  return {
    /** Troca o cenário (ou monta pela primeira vez) e leva a câmera para a vista do salão. */
    setScene(id: string, mover = true) {
      refazer(ctx, id);
      if (mover) aplicarPredefinicao(ctx, "cenario", !estado.montado ? true : false);
      else pedirDesenho(ctx);
    },
    /** Mesas do painel. Refaz o cenário quando muda a quantidade, os nomes ou as capacidades. */
    setTables(mesas: MesaDeEntrada[]) {
      const iguais = mesmasMesas(mesas, estado.mesasDeEntrada);
      estado.mesasDeEntrada = mesas;
      if (!iguais && estado.montado) refazer(ctx, estado.layout.scene.id);
    },
    /** Cor de cada cadeira ocupada, por mesa. Só repinta as fitas. */
    setSeating(proximo: Record<string, string[]>) {
      estado.preenchimentos = proximo;
      pintarFitas(ctx);
      pedirDesenho(ctx);
    },
    setDropTarget(id: string | null) {
      posicionarAnel(estado.anelDeDestino, encontrarMesa(ctx, id), 1);
      pedirDesenho(ctx);
    },
    setSearchRing(id: string | null) {
      posicionarAnel(estado.anelDeBusca, encontrarMesa(ctx, id), 1.15);
      pedirDesenho(ctx);
    },
    preset: (nome: Parameters<typeof aplicarPredefinicao>[1], rapido?: boolean) => aplicarPredefinicao(ctx, nome, rapido),
    irParaMesa: (id: string) => irParaMesa(ctx, id),
    vistaDaMesa: (id: string) => vistaDaMesa(ctx, id),
    tableAtPoint: (x: number, y: number) => mesaNoPonto(ctx, x, y),
    slots: () => estado.layout.slots,
    sala: () => estado.layout.sala,
    project: (id: string) => projetarRotulo(ctx, id),
    redraw: () => pedirDesenho(ctx),
    dispose: () => destruir(ctx, desligarEventos),
  };
}

export type MotorDasMesas3D = ReturnType<typeof criarMotorDasMesas3D>;
