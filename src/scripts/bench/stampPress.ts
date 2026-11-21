import * as THREE from 'three';

/**
 * The rubber stamp hops onto the event form, presses, and goes back.
 * Positions are in the clipboard's local space.
 */
export function createStampPress(stamp: THREE.Group, over = new THREE.Vector3(0.25, 0, 0.45)) {
  const home = stamp.position.clone();
  let t = -1;

  return {
    start() {
      t = 0;
    },
    busy() {
      return t >= 0;
    },
    update(dt: number) {
      if (t < 0) return;
      t += dt;
      if (t < 0.25) {
        const a = t / 0.25;
        stamp.position.lerpVectors(home, over, a);
        stamp.position.y = Math.sin((a * Math.PI) / 2) * 0.6;
      } else if (t < 0.42) {
        stamp.position.copy(over);
        stamp.position.y = 0.6 * (1 - (t - 0.25) / 0.17) + 0.12;
      } else if (t < 0.55) {
        stamp.position.copy(over);
        stamp.position.y = 0.12;
        stamp.scale.set(1.06, 0.9, 1.06);
      } else if (t < 0.9) {
        const a = (t - 0.55) / 0.35;
        stamp.scale.setScalar(1);
        stamp.position.lerpVectors(over, home, a);
        stamp.position.y = Math.sin(a * Math.PI) * 0.4;
      } else {
        stamp.position.copy(home);
        stamp.scale.setScalar(1);
        t = -1;
      }
    },
  };
}
