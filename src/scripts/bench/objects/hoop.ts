import * as THREE from 'three';
import { palette, part, roundedBox } from '../materials';
import type { BenchObject } from './types';

export function buildHoop(): BenchObject {
  const group = new THREE.Group();

  const ball = new THREE.Group();
  part(ball, new THREE.SphereGeometry(0.55, 40, 28), '#d76a2c', [0, 0, 0], { roughness: 0.9 });
  const seam = () => new THREE.TorusGeometry(0.553, 0.016, 8, 64);
  part(ball, seam(), '#2a1a12');
  part(ball, seam(), '#2a1a12').rotation.y = Math.PI / 2;
  part(ball, seam(), '#2a1a12').rotation.x = Math.PI / 2;
  ball.position.y = 0.55;
  group.add(ball);

  const pole = '#3b3b3b';
  part(group, roundedBox(0.6, 0.12, 0.6, 0.04), pole, [0.95, 0.06, -1.05]);
  part(group, new THREE.CylinderGeometry(0.055, 0.065, 2.4, 12), pole, [0.95, 1.3, -1.05]);
  part(group, roundedBox(1.15, 0.78, 0.06, 0.03), '#fbfaf6', [0.95, 2.35, -0.98]);
  part(group, new THREE.BoxGeometry(0.44, 0.04, 0.01), palette.stamp, [0.95, 2.48, -0.945]);
  part(group, new THREE.BoxGeometry(0.44, 0.04, 0.01), palette.stamp, [0.95, 2.18, -0.945]);
  part(group, new THREE.BoxGeometry(0.04, 0.3, 0.01), palette.stamp, [0.73, 2.33, -0.945]);
  part(group, new THREE.BoxGeometry(0.04, 0.3, 0.01), palette.stamp, [1.17, 2.33, -0.945]);
  part(
    group,
    new THREE.TorusGeometry(0.27, 0.025, 8, 32),
    palette.stamp,
    [0.95, 2.08, -0.66],
  ).rotation.x = Math.PI / 2;

  const net = new THREE.Mesh(
    new THREE.CylinderGeometry(0.27, 0.17, 0.36, 12, 3, true),
    new THREE.MeshBasicMaterial({
      color: '#ffffff',
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    }),
  );
  net.position.set(0.95, 1.89, -0.66);
  group.add(net);

  return {
    group,
    animate(t) {
      const bounce = Math.abs(Math.sin(t * 2.2));
      ball.position.y = 0.55 + bounce * 0.3;
      ball.rotation.z = -t * 0.8;
      // A little squash at the bottom of each bounce.
      const squash = 1 - Math.max(0, 0.08 - bounce * 0.3);
      ball.scale.set(1 / squash, squash, 1 / squash);
      net.rotation.y = Math.sin(t * 1.4) * 0.05;
    },
  };
}
