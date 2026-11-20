import * as THREE from 'three';

/** Gradiente 3 tons — sombreamento cel/toon estilo cartoon. */
let cachedGradient: THREE.DataTexture | null = null;

export function getToonGradient(): THREE.DataTexture {
  if (cachedGradient) return cachedGradient;
  const data = new Uint8Array([
    90, 90, 90, 255,
    170, 170, 170, 255,
    255, 255, 255, 255,
  ]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  cachedGradient = tex;
  return tex;
}

export function toonMat(color: number): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getToonGradient(),
  });
}

/** Paleta cartoon saturada (shtetl animado). */
export const CARTOON = {
  sky: 0x7ec8f5,
  fog: 0xa8daf8,
  grass: 0x7ee05a,
  grassDark: 0x5ec848,
  path: 0xe8d4a8,
  pathDark: 0xd4c090,
  wall: 0xfff6e0,
  wallShade: 0xf0e0c8,
  roof: 0xe05040,
  roofDark: 0xc03830,
  wood: 0xc47840,
  woodLight: 0xe09858,
  stone: 0xb0b0a8,
  stoneDark: 0x888880,
  leaf: 0x3ec040,
  leafLight: 0x6ae05a,
  gold: 0xffd040,
  skin: 0xffd0a8,
  cream: 0xfff8e8,
  shulBg: 0x4a3a30,
} as const;
