import * as THREE from 'three';
import { part } from '../materials';

/** Desk clutter. Not clickable; it's there so the bench looks used. */
export function buildProps() {
  const group = new THREE.Group();

  const mug = new THREE.Group();
  mug.position.set(5.0, 0, 2.7);
  part(mug, new THREE.CylinderGeometry(0.28, 0.25, 0.6, 28), '#f4efe4', [0, 0.3, 0]);
  part(mug, new THREE.CylinderGeometry(0.24, 0.24, 0.02, 24), '#4a2f1d', [0, 0.56, 0]);
  part(mug, new THREE.TorusGeometry(0.15, 0.04, 10, 20), '#f4efe4', [0.3, 0.3, 0]);
  group.add(mug);

  const notes = new THREE.Group();
  notes.position.set(-5.05, 0, 2.75);
  notes.rotation.y = 0.3;
  for (let i = 0; i < 6; i++) {
    const sheet = part(
      notes,
      new THREE.BoxGeometry(0.7, 0.03, 0.7),
      i === 5 ? '#f3d55b' : '#e9c94e',
      [0, 0.015 + i * 0.03, 0],
    );
    sheet.rotation.y = i % 2 ? 0.04 : -0.03;
  }
  group.add(notes);

  const pencil = part(
    group,
    new THREE.CylinderGeometry(0.035, 0.035, 1.2, 6),
    '#e9b23c',
    [-0.6, 0.05, 2.85],
  );
  pencil.rotation.set(0, 0.4, Math.PI / 2);

  return group;
}
