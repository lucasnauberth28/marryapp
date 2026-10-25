// Cena base do motor: o renderizador, a câmera, os controles e as luzes que valem para todos os cenários.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { calcularDisposicao } from "../layout.ts";
import { criarFabricaDeTexturas } from "./texturas.ts";
import type { ContextoDoMotor, EstadoDoMotor, OpcoesDoMotor } from "./tipos.ts";

function criarRenderizador(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // sombras assadas
  return renderer;
}

function criarControles(camera: THREE.Camera, canvas: HTMLCanvasElement) {
  const controles = new OrbitControls(camera, canvas);
  controles.enableDamping = false;
  controles.maxPolarAngle = Math.PI / 2.08;
  controles.minDistance = 2.5;
  controles.maxDistance = 95;
  controles.screenSpacePanning = false;
  return controles;
}

function criarSol(host: HTMLElement) {
  const sol = new THREE.DirectionalLight(0xffffff, 1);
  sol.castShadow = true;
  const tamanhoDaSombra = host.clientWidth < 700 ? 2048 : 4096;
  sol.shadow.mapSize.set(tamanhoDaSombra, tamanhoDaSombra);
  sol.shadow.bias = -0.00025;
  sol.shadow.normalBias = 0.035;
  return sol;
}

function estadoInicial(): EstadoDoMotor {
  return {
    layout: calcularDisposicao("jardim", []), mesasDeEntrada: [], preenchimentos: {}, gruposDeCadeiras: [], fitas: null, basesDasFitas: [],
    anelDeDestino: null, anelDeBusca: null, brilhos: [], geometriaDaFolha: null, montado: false, destruido: false,
    renderPedido: false, animacao: null, semente: 7, ambienteRT: null,
  };
}

export function criarContexto(opcoes: OpcoesDoMotor): ContextoDoMotor {
  const { canvas, host } = opcoes;
  const renderer = criarRenderizador(canvas), cena = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 600);
  const luzDoCeu = new THREE.HemisphereLight(0xffffff, 0x888888, 0.6), sol = criarSol(host), raiz = new THREE.Group();
  cena.add(luzDoCeu, sol, sol.target, raiz);
  return {
    opcoes, renderer, cena, camera, controles: criarControles(camera, canvas), luzDoCeu, sol, raiz,
    auxiliar: new THREE.Object3D(), corAuxiliar: new THREE.Color(), pmrem: new THREE.PMREMGenerator(renderer),
    texturas: criarFabricaDeTexturas(), estado: estadoInicial(),
  };
}
