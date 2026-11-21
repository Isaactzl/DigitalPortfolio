import * as THREE from 'three';
import { createStage, HOME_TARGET } from './scene';
import { Picker } from './picking';
import { createStampPress } from './stampPress';
import { buildBench } from './objects/bench';
import { buildClipboard } from './objects/clipboard';
import { buildHoop } from './objects/hoop';
import { buildHeadset } from './objects/headset';
import { buildHdb } from './objects/hdb';
import { buildSlot } from './objects/slot';
import { buildProps } from './objects/props';
import type { BenchObject } from './objects/types';

export type BenchId = 'forms' | 'hoops' | 'vr' | 'cats' | 'next';

export interface BenchOptions {
  labels: Record<BenchId, string>;
  tip: HTMLElement;
  reducedMotion: boolean;
  onSelect: (id: BenchId) => void;
  onHover?: (id: BenchId | null) => void;
}

const placements: Record<BenchId, { at: [number, number]; turn: number }> = {
  forms: { at: [-2.3, 1.4], turn: 0.22 },
  hoops: { at: [2.7, 1.5], turn: -0.3 },
  vr: { at: [0.35, -1.65], turn: -0.15 },
  cats: { at: [-4.15, -1.45], turn: 0.2 },
  next: { at: [4.0, -1.65], turn: 0 },
};

const LIFT = 0.22;
const DRAG_TOLERANCE = 6;

export function mountBench(host: HTMLElement, options: BenchOptions) {
  const { renderer, scene, camera, controls, resize } = createStage(host);
  scene.add(buildBench(), buildProps());

  const clipboard = buildClipboard();
  const objects: Record<BenchId, BenchObject> = {
    forms: clipboard,
    hoops: buildHoop(),
    vr: buildHeadset(),
    cats: buildHdb(),
    next: buildSlot(),
  };
  const ids = Object.keys(objects) as BenchId[];
  const lift = Object.fromEntries(ids.map((id) => [id, 0])) as Record<BenchId, number>;

  const picker = new Picker<BenchId>(camera, renderer.domElement);
  for (const id of ids) {
    const { group } = objects[id];
    const { at, turn } = placements[id];
    group.position.set(at[0], 0, at[1]);
    group.rotation.y = turn;
    scene.add(group);
    picker.register(id, group);
  }

  const stampPress = createStampPress(clipboard.stamp);
  const focus = HOME_TARGET.clone();
  let hovered: BenchId | null = null;
  let highlighted: BenchId | null = null;
  let selected: BenchId | null = null;
  let mouseInside = false;

  const canvas = renderer.domElement;
  let downAt: [number, number] | null = null;

  canvas.addEventListener('pointermove', (e) => {
    picker.setPointer(e.clientX, e.clientY);
    // Touch has no hover; only a mouse should light objects up as it passes.
    mouseInside = e.pointerType === 'mouse';
  });
  canvas.addEventListener('pointerleave', () => {
    mouseInside = false;
  });
  canvas.addEventListener('pointerdown', (e) => {
    downAt = [e.clientX, e.clientY];
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > DRAG_TOLERANCE)
      return;
    picker.setPointer(e.clientX, e.clientY);
    const id = picker.pick();
    if (id) options.onSelect(id);
  });

  const box = new THREE.Box3();
  const projected = new THREE.Vector3();
  function placeTip(id: BenchId | null) {
    const { tip } = options;
    if (!id) {
      tip.classList.remove('on');
      return;
    }
    box.setFromObject(objects[id].group);
    projected
      .set((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2)
      .project(camera);
    tip.textContent = options.labels[id];
    tip.style.left = `${(projected.x * 0.5 + 0.5) * canvas.clientWidth}px`;
    tip.style.top = `${(-projected.y * 0.5 + 0.5) * canvas.clientHeight}px`;
    tip.classList.add('on');
  }

  const timer = new THREE.Timer();
  function frame(timestamp: number) {
    timer.update(timestamp);
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();

    const nowHovered = mouseInside ? picker.pick() : null;
    if (nowHovered !== hovered) {
      hovered = nowHovered;
      options.onHover?.(hovered);
    }
    canvas.style.cursor = hovered ? 'pointer' : 'grab';

    const active = hovered ?? highlighted;
    for (const id of ids) {
      const want = id === active || id === selected ? LIFT : 0;
      lift[id] += (want - lift[id]) * Math.min(1, dt * 10);
      objects[id].group.position.y = lift[id];
      Picker.glow(objects[id].group, id === active);
    }
    placeTip(active);

    stampPress.update(dt);
    if (!options.reducedMotion) for (const id of ids) objects[id].animate?.(t);

    controls.target.lerp(focus, Math.min(1, dt * 3.5));
    controls.update();
    renderer.render(scene, camera);
  }

  // Only render while the bench is on screen and the tab is visible.
  let onScreen = true;
  const sync = () => renderer.setAnimationLoop(onScreen && !document.hidden ? frame : null);
  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    sync();
  });
  observer.observe(host);
  document.addEventListener('visibilitychange', sync);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();
  sync();

  return {
    select(id: BenchId | null) {
      selected = id;
      if (!id) {
        focus.copy(HOME_TARGET);
        return;
      }
      const position = objects[id].group.getWorldPosition(new THREE.Vector3());
      focus.set(position.x * 0.25, HOME_TARGET.y, position.z * 0.25);
      if (!options.reducedMotion) stampPress.start();
    },
    highlight(id: BenchId | null) {
      highlighted = id;
    },
  };
}

export type Bench = ReturnType<typeof mountBench>;
