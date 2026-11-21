import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const palette = {
  sky: '#ece5d6',
  wood: '#c69c70',
  mat: '#5c8c75',
  paper: '#f6f1e6',
  ink: '#1c1b18',
  inkDim: '#6e685d',
  stamp: '#d8432c',
  stampDark: '#a3271a',
  brass: '#c99a3b',
  brassDark: '#b5862e',
  ginger: '#e59d55',
  hdb: '#f1e9d6',
  hdbTrim: '#6fa38f',
  window: '#7d8fa3',
} as const;

/** Emissive tint used for hover; anything with this colour is part of the highlight. */
export const HOVER_EMISSIVE = new THREE.Color('#4a3510');

type MaterialInput = THREE.ColorRepresentation | THREE.Material | THREE.Material[];

export function material(
  color: THREE.ColorRepresentation,
  extra: THREE.MeshStandardMaterialParameters = {},
) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
}

export function part(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  input: MaterialInput,
  position: [number, number, number] = [0, 0, 0],
  extra?: THREE.MeshStandardMaterialParameters,
) {
  const mat =
    Array.isArray(input) || input instanceof THREE.Material ? input : material(input, extra);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function roundedBox(w: number, h: number, d: number, radius = 0.06) {
  return new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2));
}

export function canvasTexture(
  width: number,
  height: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** A box whose top face carries a texture and whose sides stay plain. */
export function topTextured(texture: THREE.Texture, side: THREE.ColorRepresentation) {
  const plain = material(side);
  const top = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 });
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  return [plain, plain, top, plain, plain, plain];
}

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Draws a QR-looking pattern. Decorative only: it does not encode anything. */
export function drawQrPattern(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: number,
) {
  const n = 15;
  const finder = 5;
  const cell = size / n;
  const rand = seeded(seed);
  g.fillStyle = palette.ink;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const right = i >= n - finder;
      const bottom = j >= n - finder;
      const inFinder = (i < finder || right) && (j < finder || bottom) && !(right && bottom);
      let on = rand() > 0.5;
      if (inFinder) {
        const ci = right ? i - (n - finder) : i;
        const cj = bottom ? j - (n - finder) : j;
        on =
          ci === 0 || ci === finder - 1 || cj === 0 || cj === finder - 1 || (ci === 2 && cj === 2);
      }
      if (on) g.fillRect(x + i * cell, y + j * cell, cell + 0.5, cell + 0.5);
    }
  }
}
