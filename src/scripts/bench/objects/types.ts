import type * as THREE from 'three';

export interface BenchObject {
  group: THREE.Group;
  /**
   * Idle animation. `time` is the object's own clock, which runs faster while it's
   * hovered; `active` is true while it's hovered or picked with the keyboard.
   * Skipped entirely when the visitor prefers reduced motion.
   */
  animate?: (time: number, active: boolean) => void;
  /** How the object looks as the lamp comes on: 0 is daylight, 1 is full evening. */
  evening?: (amount: number) => void;
}
