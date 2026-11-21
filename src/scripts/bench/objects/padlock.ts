import * as THREE from 'three';
import { palette, part, roundedBox } from '../materials';
import type { BenchObject } from './types';

const STEEL = { metalness: 0.75, roughness: 0.32 };

/** A padlock with its key beside it, for the site-hardening case study. */
export function buildPadlock(): BenchObject {
  const group = new THREE.Group();

  const lock = new THREE.Group();
  part(lock, roundedBox(0.78, 0.66, 0.36, 0.1), '#c99a3b', [0, 0.33, 0], {
    metalness: 0.6,
    roughness: 0.35,
  });
  const shackle = part(
    lock,
    new THREE.TorusGeometry(0.25, 0.055, 12, 32, Math.PI),
    '#b9bec2',
    [0, 0.68, 0],
    STEEL,
  );
  shackle.scale.y = 1.25;
  for (const x of [-0.25, 0.25]) {
    part(lock, new THREE.CylinderGeometry(0.055, 0.055, 0.12, 12), '#b9bec2', [x, 0.68, 0], STEEL);
  }
  part(
    lock,
    new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16),
    palette.ink,
    [0, 0.38, 0.185],
  ).rotation.x = Math.PI / 2;
  part(lock, new THREE.BoxGeometry(0.035, 0.12, 0.02), palette.ink, [0, 0.3, 0.185]);
  group.add(lock);

  const key = new THREE.Group();
  key.position.set(0.75, 0.02, 0.3);
  key.rotation.y = -0.6;
  part(key, new THREE.TorusGeometry(0.11, 0.035, 10, 24), '#b9bec2', [0, 0, 0], STEEL).rotation.x =
    Math.PI / 2;
  part(key, roundedBox(0.42, 0.04, 0.06, 0.015), '#b9bec2', [0.3, 0, 0], STEEL);
  part(key, new THREE.BoxGeometry(0.05, 0.04, 0.1), '#b9bec2', [0.44, 0, 0.06], STEEL);
  part(key, new THREE.BoxGeometry(0.05, 0.04, 0.07), '#b9bec2', [0.34, 0, 0.05], STEEL);
  group.add(key);

  return {
    group,
    animate(t) {
      // A slow sway, as if someone just let go of it.
      lock.rotation.z = Math.sin(t * 1.3) * 0.03;
    },
  };
}
