import type * as THREE from 'three';

export interface BenchObject {
  group: THREE.Group;
  /** Idle animation. Skipped entirely when the visitor prefers reduced motion. */
  animate?: (time: number) => void;
}
