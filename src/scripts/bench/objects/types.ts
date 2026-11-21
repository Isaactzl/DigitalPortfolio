import type * as THREE from 'three';

export interface BenchObject {
  group: THREE.Group;
  /** Idle animation. Skipped entirely when the visitor prefers reduced motion. */
  animate?: (time: number) => void;
  /** How the object looks as the lamp comes on: 0 is daylight, 1 is full evening. */
  evening?: (amount: number) => void;
}
