import * as THREE from 'three';
import { canvasTexture, palette, part, topTextured } from '../materials';
import type { BenchObject } from './types';

/** The empty space saved for the next project. */
export function buildSlot(): BenchObject {
  const group = new THREE.Group();
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.2, 1.2, 1.2)),
    new THREE.LineDashedMaterial({ color: '#7a7163', dashSize: 0.12, gapSize: 0.08 }),
  );
  outline.computeLineDistances();
  outline.position.y = 0.62;
  group.add(outline);

  // Invisible box so the outline can be hovered and clicked like a solid object.
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hit.position.y = 0.62;
  group.add(hit);

  const tag = canvasTexture(256, 96, (g, w, h) => {
    g.fillStyle = palette.paper;
    g.fillRect(0, 0, w, h);
    g.fillStyle = palette.inkDim;
    g.font = '500 26px monospace';
    g.fillText('NO. 006', 24, 42);
    g.fillText('QUEUED', 24, 78);
  });
  part(
    group,
    new THREE.BoxGeometry(0.62, 0.01, 0.24),
    topTextured(tag, palette.paper),
    [0, 0.01, 0.95],
  ).rotation.y = 0.15;

  return { group };
}
