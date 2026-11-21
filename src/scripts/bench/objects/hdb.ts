import * as THREE from 'three';
import { palette, part, roundedBox } from '../materials';
import type { BenchObject } from './types';

function buildCat() {
  const cat = new THREE.Group();
  const fur = palette.ginger;
  part(cat, new THREE.CapsuleGeometry(0.13, 0.28, 6, 14), fur, [0, 0.14, 0]).rotation.z =
    Math.PI / 2;
  part(cat, new THREE.SphereGeometry(0.135, 20, 16), fur, [0.27, 0.3, 0]);
  part(cat, new THREE.SphereGeometry(0.07, 14, 10), '#f6e6cf', [0.37, 0.27, 0]);
  for (const z of [-0.07, 0.07])
    part(cat, new THREE.ConeGeometry(0.045, 0.1, 8), fur, [0.26, 0.45, z]);
  for (const z of [-0.05, 0.05])
    part(cat, new THREE.SphereGeometry(0.016, 8, 6), palette.ink, [0.39, 0.33, z]);
  for (const [x, z] of [
    [0.14, -0.07],
    [0.14, 0.07],
    [-0.14, -0.07],
    [-0.14, 0.07],
  ] as const) {
    part(cat, new THREE.CylinderGeometry(0.035, 0.035, 0.1, 8), fur, [x, 0.03, z]);
  }

  const tail = new THREE.Group();
  tail.position.set(-0.24, 0.16, 0);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.12, 0.12, 0),
    new THREE.Vector3(-0.12, 0.3, 0),
    new THREE.Vector3(-0.04, 0.4, 0),
  ]);
  part(tail, new THREE.TubeGeometry(curve, 20, 0.03, 8, false), '#d48a44');
  cat.add(tail);
  return { cat, tail };
}

export function buildHdb(): BenchObject {
  const group = new THREE.Group();

  // Void deck: pillars around a recessed ground floor.
  for (const x of [-0.55, 0, 0.55]) {
    for (const z of [-0.38, 0.38])
      part(group, new THREE.BoxGeometry(0.11, 0.42, 0.11), '#e9e0cc', [x, 0.21, z]);
  }
  part(group, new THREE.BoxGeometry(1.05, 0.38, 0.6), '#9b9180', [0, 0.19, 0]);
  part(group, roundedBox(1.45, 0.08, 1.05, 0.02), '#d9cfba', [0, 0.46, 0]);

  part(group, roundedBox(1.4, 2.4, 0.98, 0.03), palette.hdb, [0, 1.7, 0]);
  part(group, roundedBox(0.36, 2.7, 0.5, 0.03), '#e4d9c1', [0.86, 1.82, -0.15]);
  for (let floor = 0; floor < 7; floor++) {
    const y = 0.72 + floor * 0.33;
    part(group, new THREE.BoxGeometry(1.46, 0.035, 0.14), '#d6ccb6', [0, y - 0.13, 0.54]);
    for (let col = 0; col < 4; col++) {
      const lit = floor % 3 === 1 && col === 2;
      part(group, new THREE.BoxGeometry(0.2, 0.18, 0.02), lit ? '#e9c46a' : palette.window, [
        -0.5 + col * 0.33,
        y,
        0.5,
      ]);
    }
  }
  part(group, roundedBox(1.44, 0.16, 1.02, 0.02), palette.hdbTrim, [0, 2.92, 0]);
  part(group, roundedBox(1.44, 0.07, 1.02, 0.01), palette.hdbTrim, [0, 0.56, 0]);
  part(group, roundedBox(0.42, 0.3, 0.32, 0.06), '#dcd2bd', [-0.4, 3.15, -0.2]);

  const { cat, tail } = buildCat();
  cat.position.set(0.2, 3.0, 0.22);
  cat.rotation.y = -0.5;
  group.add(cat);

  return {
    group,
    animate(t) {
      tail.rotation.z = Math.sin(t * 2.2) * 0.35;
      tail.rotation.x = Math.sin(t * 1.1) * 0.2;
    },
  };
}
