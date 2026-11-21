import * as THREE from 'three';
import { material, part, roundedBox } from '../materials';
import type { BenchObject } from './types';

const BODY = '#2f3a34';
const WARM = '#ffcf8a';

/** An anglepoise-style desk lamp. Its spotlight is the main light in the evening. */
export function buildLamp(castShadow: boolean): BenchObject {
  const group = new THREE.Group();
  part(group, new THREE.CylinderGeometry(0.42, 0.48, 0.12, 28), BODY, [0, 0.06, 0], {
    roughness: 0.5,
  });
  part(group, new THREE.SphereGeometry(0.08, 14, 10), '#9aa1a6', [0, 0.16, 0], { metalness: 0.7 });

  // Lower arm leans back, upper arm reaches forward over the bench.
  const lower = part(group, roundedBox(0.08, 1.7, 0.08, 0.03), BODY, [0, 0.95, -0.25]);
  lower.rotation.x = -0.3;
  part(group, new THREE.SphereGeometry(0.08, 14, 10), '#9aa1a6', [0, 1.75, -0.5], {
    metalness: 0.7,
  });
  const upper = part(group, roundedBox(0.08, 1.5, 0.08, 0.03), BODY, [0, 2.0, 0.17]);
  upper.rotation.x = 1.05;

  const head = new THREE.Group();
  head.position.set(0, 2.25, 0.85);
  head.rotation.x = 0.55;
  part(
    head,
    new THREE.ConeGeometry(0.42, 0.55, 28, 1, true),
    material(BODY, { side: THREE.DoubleSide, roughness: 0.5 }),
  );
  const bulb = material('#f4efe4', { emissive: WARM, emissiveIntensity: 0 });
  part(head, new THREE.SphereGeometry(0.14, 16, 12), bulb, [0, -0.12, 0]);
  group.add(head);

  const light = new THREE.SpotLight(WARM, 0, 16, 0.85, 0.55, 1.4);
  light.position.set(0, 2.15, 0.95);
  light.castShadow = castShadow;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.0006;
  light.target.position.set(0.4, 0, 2.6);
  group.add(light, light.target);

  return {
    group,
    evening(amount) {
      light.intensity = amount * 38;
      bulb.emissiveIntensity = amount * 3;
    },
  };
}
