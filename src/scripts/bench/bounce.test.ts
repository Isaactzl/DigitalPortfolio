import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createBounce } from './bounce';
import { Picker } from './picking';

const STEP = 1 / 60;

/** Runs the bounce for `seconds`, recording every height and each landing. */
function play(seconds: number) {
  const bounce = createBounce();
  const heights: number[] = [];
  let landings = 0;
  bounce.kick();
  for (let t = 0; t < seconds; t += STEP) {
    if (bounce.update(STEP)) landings++;
    heights.push(bounce.height);
  }
  return { bounce, heights, landings };
}

describe('createBounce', () => {
  it('sits still until kicked', () => {
    const bounce = createBounce();
    bounce.update(0.5);
    expect(bounce.height).toBe(0);
    expect(bounce.busy()).toBe(false);
  });

  it('jumps well clear of its idle hop when clicked', () => {
    const { heights } = play(1);
    expect(Math.max(...heights)).toBeGreaterThan(0.8);
  });

  it('bounces a few times, each lower, then comes to rest', () => {
    const { bounce, heights, landings } = play(4);
    expect(landings).toBeGreaterThanOrEqual(3);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(0);
    expect(bounce.height).toBe(0);
    expect(bounce.busy()).toBe(false);
  });

  it('squashes on landing and is round again at rest', () => {
    const bounce = createBounce();
    bounce.kick();
    let squashed = false;
    for (let t = 0; t < 4; t += STEP) {
      bounce.update(STEP);
      if (bounce.squash < 0.95) squashed = true;
    }
    expect(squashed).toBe(true);
    expect(bounce.squash).toBe(1);
  });

  it('takes off from wherever the ball was when clicked', () => {
    const bounce = createBounce();
    bounce.kick(0.4);
    expect(bounce.height).toBe(0.4);
    bounce.update(STEP);
    expect(bounce.height).toBeGreaterThan(0.4);
  });

  it('copes with a long frame without sinking into the bench', () => {
    const bounce = createBounce();
    bounce.kick();
    bounce.update(2);
    expect(Number.isFinite(bounce.height)).toBe(true);
    expect(bounce.height).toBeGreaterThanOrEqual(0);
  });
});

describe('Picker', () => {
  it('lets a part registered later claim its meshes from the whole object', () => {
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const canvas = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    } as HTMLCanvasElement;

    const hoop = new THREE.Group();
    const ball = new THREE.Group();
    ball.add(new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshStandardMaterial()));
    hoop.add(ball);
    hoop.updateMatrixWorld();

    const picker = new Picker<'hoops' | 'ball'>(camera, canvas);
    picker.register('hoops', hoop);
    picker.register('ball', ball);
    picker.setPointer(50, 50);
    expect(picker.pick()).toBe('ball');
  });
});
