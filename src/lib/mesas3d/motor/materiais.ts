// Materiais do Three.js com as cores da marca e do cenário (que chegam em sRGB).
import * as THREE from "three";

export function corLinear(hex: string) {
  return new THREE.Color(hex).convertSRGBToLinear();
}

export function materialPadrao(cor: string, rugosidade?: number, extra?: THREE.MeshStandardMaterialParameters) {
  return new THREE.MeshStandardMaterial({ color: corLinear(cor), roughness: rugosidade == null ? 0.85 : rugosidade, metalness: 0, envMapIntensity: 0.6, ...(extra ?? {}) });
}

export function materialLuminoso(cor: string) {
  return new THREE.MeshBasicMaterial({ color: corLinear(cor) });
}
