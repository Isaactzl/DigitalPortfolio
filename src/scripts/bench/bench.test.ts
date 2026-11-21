import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { fitDistance, WIDE_DISTANCE } from './scene';
import { createStampPress } from './stampPress';

describe('fitDistance', () => {
  it('keeps the default distance on wide screens', () => {
    expect(fitDistance(16 / 9)).toBe(WIDE_DISTANCE);
  });

  it('pulls back on tall phone screens', () => {
    expect(fitDistance(375 / 470)).toBeGreaterThan(WIDE_DISTANCE);
  });

  it('never pulls back past the cap', () => {
    expect(fitDistance(0.1)).toBeCloseTo(WIDE_DISTANCE * 1.9);
  });
});

describe('createStampPress', () => {
  const run = (stamp: THREE.Group, seconds: number, step = 1 / 60) => {
    const press = createStampPress(stamp);
    press.start();
    for (let t = 0; t < seconds; t += step) press.update(step);
    return press;
  };

  it('touches down on the form partway through', () => {
    const stamp = new THREE.Group();
    stamp.position.set(1.55, 0, 0.55);
    const press = createStampPress(stamp);
    press.start();
    for (let t = 0; t < 0.48; t += 1 / 60) press.update(1 / 60);
    expect(stamp.position.y).toBeCloseTo(0.12);
    expect(stamp.scale.y).toBeLessThan(1);
  });

  it('always ends back where it started, unsquashed', () => {
    const stamp = new THREE.Group();
    stamp.position.set(1.55, 0, 0.55);
    const home = stamp.position.clone();
    run(stamp, 1.5);
    expect(stamp.position.equals(home)).toBe(true);
    expect(stamp.scale.equals(new THREE.Vector3(1, 1, 1))).toBe(true);
  });

  it('copes with a long frame skipping most of the animation', () => {
    const stamp = new THREE.Group();
    const home = stamp.position.clone();
    run(stamp, 2, 0.5);
    expect(stamp.position.equals(home)).toBe(true);
  });
});
