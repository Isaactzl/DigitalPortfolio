import * as THREE from 'three';
import { material, palette, part, roundedBox } from '../materials';
import type { BenchObject } from './types';
import { easedFlag } from './ease';

const metal = { metalness: 0.55, roughness: 0.45 };

function gear(radius: number, thickness: number, color: string, teeth = 12) {
  const g = new THREE.Group();
  part(g, new THREE.CylinderGeometry(radius, radius, thickness, 32), color, [0, 0, 0], metal);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    const tooth = part(
      g,
      roundedBox(radius * 0.32, thickness, radius * 0.28, 0.01),
      color,
      [Math.cos(a) * radius, 0, Math.sin(a) * radius],
      metal,
    );
    tooth.rotation.y = -a;
  }
  part(
    g,
    new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, thickness * 1.05, 24),
    '#a57a2a',
    [0, 0, 0],
    metal,
  );
  part(
    g,
    new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, thickness * 1.6, 12),
    '#5a4318',
    [0, 0, 0],
    metal,
  );
  return g;
}

export function buildHeadset(): BenchObject {
  const group = new THREE.Group();
  part(group, roundedBox(1.55, 0.84, 0.82, 0.22), '#2b2d31', [0, 0.5, 0], { roughness: 0.55 });
  part(group, roundedBox(1.36, 0.66, 0.16, 0.08), '#4a4c52', [0, 0.5, -0.46]);
  part(group, roundedBox(1.2, 0.5, 0.04, 0.03), '#3a3d44', [0, 0.52, 0.42], {
    roughness: 0.3,
    metalness: 0.2,
  });
  const lenses = material('#7ec8d8', { emissive: '#3a8a9a', emissiveIntensity: 0.8 });
  for (const x of [-0.45, 0.45]) {
    part(group, new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16), lenses, [
      x,
      0.66,
      0.445,
    ]).rotation.x = Math.PI / 2;
  }
  part(
    group,
    new THREE.TorusGeometry(0.66, 0.07, 10, 40, Math.PI),
    '#6b513a',
    [0, 0.5, -0.5],
  ).rotation.x = -Math.PI / 2;

  const gears = [
    { g: gear(0.3, 0.1, palette.brass), at: [0.25, 0.97, 0.05], speed: 0.7 },
    { g: gear(0.44, 0.12, palette.brassDark, 14), at: [1.45, 0.07, 0.6], speed: -0.5 },
    { g: gear(0.22, 0.1, palette.brass, 10), at: [1.05, 0.06, 1.15], speed: 0.95 },
  ] as const;
  for (const { g, at } of gears) {
    g.position.set(at[0], at[1], at[2]);
    group.add(g);
  }

  const awake = easedFlag();
  return {
    group,
    animate(t, active) {
      for (const { g, speed } of gears) g.rotation.y = t * speed;
      // The headset 'wakes up' when you point at it.
      lenses.emissiveIntensity = 0.8 + awake(active) * 2.6;
    },
  };
}
