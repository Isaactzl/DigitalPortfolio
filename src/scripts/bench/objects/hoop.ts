import * as THREE from 'three';
import { canvasTexture, material, palette, part, roundedBox } from '../materials';
import type { BenchObject } from './types';
import { easedFlag } from './ease';
import { createBounce } from '../bounce';

const RADIUS = 0.55;
const SEAM = '#24160f';

/** The leather's pebbled grip, as a bump map of small raised dots. */
function pebbles() {
  const texture = canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const shade = 150 + Math.floor(Math.random() * 60);
      g.fillStyle = `rgb(${shade},${shade},${shade})`;
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, 0.8 + Math.random() * 0.9, 0, Math.PI * 2);
      g.fill();
    }
  });
  // Bump values are heights, not colours.
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/**
 * One of the two curved side seams: a loop around the x axis whose width swells and
 * narrows, which is what gives a basketball its look.
 */
function sideSeam(side: 1 | -1) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const spread = 0.85 + 0.28 * Math.cos(2 * a);
    const r = RADIUS + 0.003;
    points.push(
      new THREE.Vector3(
        side * r * Math.cos(spread),
        r * Math.sin(spread) * Math.cos(a),
        r * Math.sin(spread) * Math.sin(a),
      ),
    );
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 160, 0.017, 6, true);
}

function buildBall() {
  const ball = new THREE.Group();
  const leather = material('#cf5a22', { roughness: 0.75, bumpMap: pebbles(), bumpScale: 1.5 });
  part(ball, new THREE.SphereGeometry(RADIUS, 48, 32), leather);
  const seam = material(SEAM, { roughness: 0.6 });
  const circle = () => new THREE.TorusGeometry(RADIUS + 0.003, 0.017, 6, 96);
  part(ball, circle(), seam);
  part(ball, circle(), seam).rotation.y = Math.PI / 2;
  part(ball, sideSeam(1), seam);
  part(ball, sideSeam(-1), seam);
  // A slight tilt so the seams read as a ball from the bench camera, not a target.
  ball.rotation.set(0.35, 0.5, 0);
  return ball;
}

export function buildHoop(): BenchObject & {
  ball: THREE.Group;
  kick: () => void;
  update: (dt: number) => number;
  busy: () => boolean;
} {
  const group = new THREE.Group();

  const spin = new THREE.Group();
  const ball = new THREE.Group();
  spin.add(buildBall());
  ball.add(spin);
  ball.position.y = RADIUS;
  group.add(ball);
  const bounce = createBounce();
  let hop = 0;
  let lastTime = 0;

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

  const excited = easedFlag();
  const squashTo = (squash: number) => ball.scale.set(1 / squash, squash, 1 / squash);
  return {
    group,
    ball,
    kick() {
      bounce.kick(hop);
    },
    /** Runs the clicked bounce on real time, so hovering can't speed it up. */
    update(dt) {
      const impact = bounce.update(dt);
      if (bounce.busy()) {
        ball.position.y = RADIUS + bounce.height;
        squashTo(bounce.squash);
        spin.rotation.z -= dt * 4;
      }
      return impact;
    },
    busy: () => bounce.busy(),
    animate(t, active) {
      net.rotation.y = Math.sin(t * 1.4) * 0.05;
      const elapsed = t - lastTime;
      lastTime = t;
      if (bounce.busy()) return;
      const energy = excited(active);
      const phase = Math.abs(Math.sin(t * 2.2));
      hop = phase * (0.3 + energy * 0.35);
      ball.position.y = RADIUS + hop;
      // Rolls on from wherever a bounce left it, rather than snapping back.
      spin.rotation.z -= elapsed * 0.8;
      // A little squash at the bottom of each hop.
      squashTo(1 - Math.max(0, 0.08 - phase * 0.3));
    },
  };
}
