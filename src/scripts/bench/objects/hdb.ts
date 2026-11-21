import * as THREE from 'three';
import { material, palette, part, roundedBox } from '../materials';
import type { BenchObject } from './types';

const MAX_YAW = 1.1;
const MAX_PITCH = 0.55;

function buildCat() {
  const cat = new THREE.Group();
  const fur = palette.ginger;
  part(cat, new THREE.CapsuleGeometry(0.13, 0.28, 6, 14), fur, [0, 0.14, 0]).rotation.z =
    Math.PI / 2;
  for (const [x, z] of [
    [0.14, -0.07],
    [0.14, 0.07],
    [-0.14, -0.07],
    [-0.14, 0.07],
  ] as const) {
    part(cat, new THREE.CylinderGeometry(0.035, 0.035, 0.1, 8), fur, [x, 0.03, z]);
  }

  // The head is its own group, pivoting at the neck, so it can turn to follow the cursor.
  // The face points along +x.
  const head = new THREE.Group();
  head.name = 'cat-head';
  head.position.set(0.24, 0.27, 0);
  part(head, new THREE.SphereGeometry(0.135, 20, 16), fur, [0.03, 0.03, 0]);
  part(head, new THREE.SphereGeometry(0.07, 14, 10), '#f6e6cf', [0.13, 0, 0]);
  for (const z of [-0.07, 0.07]) {
    part(head, new THREE.ConeGeometry(0.045, 0.1, 8), fur, [0.02, 0.18, z]);
  }
  for (const z of [-0.05, 0.05]) {
    part(head, new THREE.SphereGeometry(0.016, 8, 6), palette.ink, [0.15, 0.06, z]);
  }
  cat.add(head);

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
  return { cat, head, tail };
}

export interface Hdb extends BenchObject {
  /** Turns the cat's head towards a point in world space, or back to resting when null. */
  watch: (target: THREE.Vector3 | null, dt: number) => void;
}

export function buildHdb(): Hdb {
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

  // Each window gets its own material and a threshold, so they light up one by one at dusk.
  const windows: { mat: THREE.MeshStandardMaterial; at: number }[] = [];
  for (let floor = 0; floor < 7; floor++) {
    const y = 0.72 + floor * 0.33;
    part(group, new THREE.BoxGeometry(1.46, 0.035, 0.14), '#d6ccb6', [0, y - 0.13, 0.54]);
    for (let col = 0; col < 4; col++) {
      const mat = material(palette.window, { emissive: '#ffc46b', emissiveIntensity: 0 });
      part(group, new THREE.BoxGeometry(0.2, 0.18, 0.02), mat, [-0.5 + col * 0.33, y, 0.5]);
      // Not every flat is home: about a third stay dark all evening.
      const home = (floor * 7 + col * 3) % 10 < 7;
      windows.push({ mat, at: home ? 0.15 + ((floor * 4 + col * 5) % 11) / 14 : 2 });
    }
  }
  part(group, roundedBox(1.44, 0.16, 1.02, 0.02), palette.hdbTrim, [0, 2.92, 0]);
  part(group, roundedBox(1.44, 0.07, 1.02, 0.01), palette.hdbTrim, [0, 0.56, 0]);
  part(group, roundedBox(0.42, 0.3, 0.32, 0.06), '#dcd2bd', [-0.4, 3.15, -0.2]);

  const { cat, head, tail } = buildCat();
  cat.position.set(0.2, 3.0, 0.22);
  cat.rotation.y = -0.5;
  group.add(cat);

  const local = new THREE.Vector3();
  const neck = head.position;
  return {
    group,
    animate(t) {
      tail.rotation.z = Math.sin(t * 2.2) * 0.35;
      tail.rotation.x = Math.sin(t * 1.1) * 0.2;
    },
    evening(amount) {
      for (const w of windows) {
        const on = THREE.MathUtils.clamp((amount - w.at) / 0.12, 0, 1);
        w.mat.emissiveIntensity = on * 1.6;
        w.mat.color.set(on > 0.5 ? '#f5d9a0' : palette.window);
      }
    },
    watch(target, dt) {
      let yaw = 0;
      let pitch = 0;
      if (target) {
        cat.worldToLocal(local.copy(target)).sub(neck);
        yaw = THREE.MathUtils.clamp(Math.atan2(-local.z, local.x), -MAX_YAW, MAX_YAW);
        pitch = THREE.MathUtils.clamp(
          Math.atan2(local.y, Math.hypot(local.x, local.z)),
          -MAX_PITCH,
          MAX_PITCH,
        );
      }
      const ease = Math.min(1, dt * (target ? 8 : 2.5));
      head.rotation.y += (yaw - head.rotation.y) * ease;
      head.rotation.z += (pitch - head.rotation.z) * ease;
    },
  };
}
