import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildHdb } from './objects/hdb';

function setup() {
  const hdb = buildHdb();
  hdb.group.position.set(-4.15, 0, -1.45);
  hdb.group.rotation.y = 0.2;
  hdb.group.updateMatrixWorld(true);
  const head = hdb.group.getObjectByName('cat-head');
  if (!head) throw new Error('cat head missing');
  return { hdb, head };
}

/** The angle between where the cat's face points and the direction to `target`. */
function angleTo(head: THREE.Object3D, target: THREE.Vector3) {
  head.updateWorldMatrix(true, false);
  const origin = head.getWorldPosition(new THREE.Vector3());
  const facing = new THREE.Vector3(1, 0, 0).transformDirection(head.matrixWorld);
  return facing.angleTo(target.clone().sub(origin));
}

const settle = (hdb: ReturnType<typeof buildHdb>, target: THREE.Vector3 | null) => {
  for (let i = 0; i < 120; i++) hdb.watch(target, 1 / 60);
};

describe('the cat on the HDB roof', () => {
  it('turns its head towards the cursor', () => {
    const { hdb, head } = setup();
    const target = new THREE.Vector3(-2, 3.4, 1.5);
    const before = angleTo(head, target);
    settle(hdb, target);
    expect(angleTo(head, target)).toBeLessThan(before);
  });

  it('never turns further than a neck can', () => {
    const { hdb, head } = setup();
    settle(hdb, new THREE.Vector3(-30, 3.3, -40));
    expect(Math.abs(head.rotation.y)).toBeLessThanOrEqual(1.1 + 1e-6);
    expect(Math.abs(head.rotation.z)).toBeLessThanOrEqual(0.55 + 1e-6);
  });

  it('settles back to looking ahead when the cursor leaves', () => {
    const { hdb, head } = setup();
    settle(hdb, new THREE.Vector3(-2, 3.4, 1.5));
    settle(hdb, null);
    expect(head.rotation.y).toBeCloseTo(0, 2);
    expect(head.rotation.z).toBeCloseTo(0, 2);
  });
});
