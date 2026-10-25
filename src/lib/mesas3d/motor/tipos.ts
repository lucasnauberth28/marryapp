// Tipos compartilhados pelas peças do motor das mesas em 3D. O contexto reúne o que o Three.js precisa para desenhar
// e o estado do cenário atual, para que cada módulo receba só um argumento.
import type * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Disposicao, MesaDeEntrada, PosicaoDaMesa } from "../layout.ts";
import type { FabricaDeTexturas } from "./texturas.ts";

export type PredefinicaoDaCamera = "cenario" | "panoramica" | "topo";

export interface OpcoesDoMotor {
  canvas: HTMLCanvasElement;
  /** Elemento que dá o tamanho do desenho; observado para redimensionar. */
  host: HTMLElement;
  /** Chamado depois de cada quadro desenhado (a tela usa para reposicionar os rótulos). */
  onRender?: (info: { calls: number; triangles: number }) => void;
  /** Toque ou clique (sem arrastar) na cena. Recebe a mesa sob o ponto, ou null. */
  onTablePick?: (table: PosicaoDaMesa | null) => void;
  /** A pessoa começou a girar ou mover a câmera com a mão. */
  onCameraGrab?: () => void;
  onContextLost?: () => void;
}

export interface InstanciaDeMalha {
  x: number;
  y: number;
  z: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
  cor?: string;
}

export interface PosicaoDeCadeira {
  x: number;
  z: number;
  ry: number;
  px: number;
  pz: number;
}

export interface GrupoDeCadeiras {
  tableId: string;
  start: number;
  n: number;
  pos: PosicaoDeCadeira[];
}

export interface AnimacaoDaCamera {
  t0: number;
  ms: number;
  p0: THREE.Vector3;
  a0: THREE.Vector3;
  p1: THREE.Vector3;
  a1: THREE.Vector3;
}

export interface EstadoDoMotor {
  layout: Disposicao;
  mesasDeEntrada: MesaDeEntrada[];
  /** Cor de cada cadeira ocupada, por mesa. */
  preenchimentos: Record<string, string[]>;
  gruposDeCadeiras: GrupoDeCadeiras[];
  fitas: THREE.InstancedMesh | null;
  basesDasFitas: { x: number; z: number; ry: number }[];
  anelDeDestino: THREE.Mesh | null;
  anelDeBusca: THREE.Mesh | null;
  brilhos: number[];
  geometriaDaFolha: THREE.BufferGeometry | null;
  montado: boolean;
  destruido: boolean;
  renderPedido: boolean;
  animacao: AnimacaoDaCamera | null;
  semente: number;
  ambienteRT: THREE.WebGLRenderTarget | null;
}

export interface ContextoDoMotor {
  opcoes: OpcoesDoMotor;
  renderer: THREE.WebGLRenderer;
  cena: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controles: OrbitControls;
  luzDoCeu: THREE.HemisphereLight;
  sol: THREE.DirectionalLight;
  raiz: THREE.Group;
  auxiliar: THREE.Object3D;
  corAuxiliar: THREE.Color;
  pmrem: THREE.PMREMGenerator;
  texturas: FabricaDeTexturas;
  estado: EstadoDoMotor;
}
