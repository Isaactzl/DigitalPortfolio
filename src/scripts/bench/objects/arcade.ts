import * as THREE from 'three';
import { material, palette, part, roundedBox } from '../materials';
import type { BenchObject } from './types';
import { easedFlag } from './ease';

const BODY = '#2a2f55';
const TRIM = '#1a1d36';
const NEON = '#5ef08a';

/** A small arcade cabinet for Mainframe Run, the revision game. */
export function buildArcade(): BenchObject {
  const group = new THREE.Group();

  part(group, roundedBox(1.1, 1.9, 0.9, 0.08), BODY, [0, 0.95, 0]);
  part(group, roundedBox(1.16, 0.1, 0.96, 0.03), TRIM, [0, 0.05, 0]);

  // Marquee across the top, lit from behind.
  const marquee = material('#e0533a', { emissive: '#e0533a', emissiveIntensity: 0.5 });
  part(group, roundedBox(1.12, 0.26, 0.2, 0.04), marquee, [0, 1.78, 0.38]);

  // Screen bezel and screen, tilted back like a real cabinet.
  const bezel = part(group, roundedBox(0.92, 0.72, 0.08, 0.03), TRIM, [0, 1.32, 0.42]);
  bezel.rotation.x = -0.18;
  const screen = material('#0d0e16', { emissive: NEON, emissiveIntensity: 0.35 });
  const display = part(group, new THREE.BoxGeometry(0.78, 0.58, 0.02), screen, [0, 1.32, 0.47]);
  display.rotation.x = -0.18;

  // Control deck with a joystick and two buttons.
  const deck = part(group, roundedBox(1.12, 0.12, 0.42, 0.04), TRIM, [0, 0.88, 0.55]);
  deck.rotation.x = 0.35;
  part(group, new THREE.CylinderGeometry(0.025, 0.025, 0.2, 8), palette.ink, [-0.22, 1.0, 0.58]);
  part(group, new THREE.SphereGeometry(0.07, 14, 10), palette.stamp, [-0.22, 1.11, 0.58]);
  for (const [x, color] of [
    [0.12, '#f4c542'],
    [0.3, '#4fd8e8'],
  ] as const) {
    part(group, new THREE.CylinderGeometry(0.06, 0.06, 0.04, 14), color, [x, 0.97, 0.6]);
  }

  const awake = easedFlag();
  let night = 0;
  return {
    group,
    animate(t, active) {
      // The screen flickers like an attract mode, and lights right up when pointed at.
      const flicker = 0.08 * Math.sin(t * 9) + 0.05 * Math.sin(t * 23);
      screen.emissiveIntensity = 0.35 + night * 0.6 + awake(active) * 1.2 + flicker;
    },
    evening(amount) {
      night = amount;
      screen.emissiveIntensity = 0.35 + amount * 0.6;
      marquee.emissiveIntensity = 0.5 + amount * 1.2;
    },
  };
}
