import * as THREE from 'three';
import { canvasTexture, palette, part, roundedBox } from '../materials';

export function buildBench() {
  const group = new THREE.Group();
  part(group, roundedBox(12.6, 0.7, 8.6, 0.14), palette.wood, [0, -0.35, 0]);

  const grid = canvasTexture(1024, 640, (g, w, h) => {
    g.fillStyle = palette.mat;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.16)';
    g.lineWidth = 1.5;
    for (let x = 0; x <= w; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, h);
      g.stroke();
    }
    for (let y = 0; y <= h; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    g.fillStyle = 'rgba(255,255,255,.45)';
    g.font = '500 18px monospace';
    g.fillText('ISAAC TAN · WORKBENCH · SG', 24, h - 22);
  });
  const mat = part(
    group,
    roundedBox(9.4, 0.05, 5.9, 0.02),
    new THREE.MeshStandardMaterial({ map: grid, roughness: 0.95 }),
    [0, 0.025, 0.2],
  );
  mat.castShadow = false;
  return group;
}
