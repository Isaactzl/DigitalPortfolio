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
import { buildPadlock } from './objects/padlock';
import { buildProps } from './objects/props';
import { buildLamp } from './objects/lamp';
import type { BenchObject } from './objects/types';

export type BenchId = 'forms' | 'hoops' | 'vr' | 'cats' | 'lock' | 'next';
type PickId = BenchId | 'lamp';

export interface BenchOptions {
  labels: Record<BenchId, string>;
  tip: HTMLElement;
  reducedMotion: boolean;
  evening: boolean;
  /** Absolute URL encoded in the QR code on the clipboard's form. */
  qrUrl: string;
  onSelect: (id: BenchId) => void;
  onLampClick: () => void;
  onHover?: (id: BenchId | null) => void;
}

const placements: Record<PickId, { at: [number, number]; turn: number }> = {
  forms: { at: [-2.3, 1.4], turn: 0.22 },
  hoops: { at: [2.7, 1.5], turn: -0.3 },
  vr: { at: [0.35, -1.65], turn: -0.15 },
  cats: { at: [-4.15, -1.45], turn: 0.2 },
  lock: { at: [0.75, 2.55], turn: -0.25 },
  next: { at: [4.0, -1.65], turn: 0 },
  lamp: { at: [-1.6, -3.55], turn: 0.3 },
};

const LIFT = 0.22;
/** How much faster an object's idle animation runs while it's hovered. */
const HOVER_SPEED = 2.4;
/** How close the camera comes when something is picked, as a share of its resting distance. */
const DOLLY_IN = 0.82;
const DOLLY_MS = 1400;
/** Quiet time before the bench stops drawing. Shorter with reduced motion: nothing idles then. */
const SLEEP_MS = 15_000;
const SLEEP_REDUCED_MS = 2_000;
const DRAG_TOLERANCE = 6;
const DUSK_SECONDS = 0.9;
const TOUCH_GAZE_SECONDS = 2.5;

/** Hands control back to the browser so a long build doesn't block input. */
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function mountBench(host: HTMLElement, options: BenchOptions) {
  const { renderer, scene, camera, controls, resize, evening, small } = createStage(host);
  const canvas = renderer.domElement;
  const picker = new Picker<PickId>(camera, canvas);

  scene.add(buildBench(), buildProps());
  await nextTask();

  const clipboard = buildClipboard(options.qrUrl);
  const hdb = buildHdb();
  await nextTask();
  const objects: Record<PickId, BenchObject> = {
    forms: clipboard,
    hoops: buildHoop(),
    vr: buildHeadset(),
    cats: hdb,
    lock: buildPadlock(),
    next: buildSlot(),
    lamp: buildLamp(!small),
  };
  const ids = Object.keys(objects) as PickId[];
  const lift = Object.fromEntries(ids.map((id) => [id, 0])) as Record<PickId, number>;
  // Each object keeps its own clock so hovering can speed it up without a jump.
  const clocks = Object.fromEntries(ids.map((id) => [id, 0])) as Record<PickId, number>;
  for (const id of ids) {
    const { group } = objects[id];
    const { at, turn } = placements[id];
    group.position.set(at[0], 0, at[1]);
    group.rotation.y = turn;
    scene.add(group);
    picker.register(id, group);
  }
  await nextTask();

  let dusk = options.evening ? 1 : 0;
  let duskTarget = dusk;
  const applyDusk = (amount: number) => {
    evening(amount);
    for (const id of ids) objects[id].evening?.(amount);
  };
  applyDusk(dusk);

  // Compile every shader up front, off the main thread where the GPU allows it,
  // so the first frame doesn't stall.
  await renderer.compileAsync(scene, camera);

  const stampPress = createStampPress(clipboard.stamp);
  const focus = HOME_TARGET.clone();
  // Picking something eases the camera in; closing eases it back. Dragging or zooming
  // hands control straight back to the visitor.
  let restDistance = camera.position.distanceTo(controls.target);
  let dollyTo = restDistance;
  let dollyUntil = 0;
  controls.addEventListener('start', () => {
    dollyUntil = 0;
  });
  const catHead = hdb.group.localToWorld(new THREE.Vector3(0.2, 3.3, 0.22));
  const gaze = new THREE.Vector3();
  let touchGazeUntil = 0;
  let hovered: PickId | null = null;
  let highlighted: BenchId | null = null;
  let selected: BenchId | null = null;
  let mouseInside = false;
  let downAt: [number, number] | null = null;

  // Idle animation keeps the bench alive, but a scene nobody is touching shouldn't drain
  // a battery. After a quiet spell it finishes what's moving and stops drawing until poked.
  const sleepAfter = options.reducedMotion ? SLEEP_REDUCED_MS : SLEEP_MS;
  let lastPoke = performance.now();
  let asleep = false;
  function poke() {
    lastPoke = performance.now();
    if (!asleep) return;
    asleep = false;
    host.dataset.asleep = 'false';
    sync();
  }
  host.addEventListener('keydown', poke);
  canvas.addEventListener('wheel', poke, { passive: true });

  canvas.addEventListener('pointermove', (e) => {
    poke();
    picker.setPointer(e.clientX, e.clientY);
    // Touch has no hover; only a mouse should light objects up as it passes.
    mouseInside = e.pointerType === 'mouse';
  });
  canvas.addEventListener('pointerleave', () => {
    mouseInside = false;
  });
  canvas.addEventListener('pointerdown', (e) => {
    poke();
    downAt = [e.clientX, e.clientY];
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > DRAG_TOLERANCE)
      return;
    picker.setPointer(e.clientX, e.clientY);
    if (e.pointerType !== 'mouse') touchGazeUntil = performance.now() + TOUCH_GAZE_SECONDS * 1000;
    const id = picker.pick();
    if (id === 'lamp') options.onLampClick();
    else if (id) options.onSelect(id);
  });

  const box = new THREE.Box3();
  const projected = new THREE.Vector3();
  function placeTip(id: PickId | null) {
    const { tip } = options;
    if (!id) {
      tip.classList.remove('on');
      return;
    }
    box.setFromObject(objects[id].group);
    projected
      .set((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2)
      .project(camera);
    tip.textContent =
      id === 'lamp' ? `Lamp · switch ${duskTarget ? 'off' : 'on'}` : options.labels[id];
    tip.style.left = `${(projected.x * 0.5 + 0.5) * canvas.clientWidth}px`;
    tip.style.top = `${(-projected.y * 0.5 + 0.5) * canvas.clientHeight}px`;
    tip.classList.add('on');
  }

  const timer = new THREE.Timer();
  function frame(timestamp: number) {
    timer.update(timestamp);
    const dt = Math.min(timer.getDelta(), 0.05);

    const nowHovered = mouseInside ? picker.pick() : null;
    if (nowHovered !== hovered) {
      hovered = nowHovered;
      options.onHover?.(hovered === 'lamp' ? null : hovered);
    }
    canvas.style.cursor = hovered ? 'pointer' : 'grab';

    const active: PickId | null = hovered ?? highlighted;
    let lifting = false;
    for (const id of ids) {
      const want = id === active || id === selected ? LIFT : 0;
      lift[id] += (want - lift[id]) * Math.min(1, dt * 10);
      if (Math.abs(want - lift[id]) > 0.002) lifting = true;
      objects[id].group.position.y = lift[id];
      Picker.glow(objects[id].group, id === active);
    }
    placeTip(active);

    if (dusk !== duskTarget) {
      const step = options.reducedMotion ? 1 : dt / DUSK_SECONDS;
      dusk =
        duskTarget > dusk ? Math.min(duskTarget, dusk + step) : Math.max(duskTarget, dusk - step);
      applyDusk(dusk);
    }

    const looking = mouseInside || performance.now() < touchGazeUntil;
    hdb.watch(looking ? picker.pointerAt(catHead, gaze) : null, dt);

    stampPress.update(dt);
    if (!options.reducedMotion) {
      for (const id of ids) {
        clocks[id] += dt * (id === active ? HOVER_SPEED : 1);
        objects[id].animate?.(clocks[id], id === active);
      }
    }

    controls.target.lerp(focus, Math.min(1, dt * 3.5));
    if (performance.now() < dollyUntil) {
      const offset = camera.position.clone().sub(controls.target);
      const distance = THREE.MathUtils.lerp(offset.length(), dollyTo, Math.min(1, dt * 3));
      camera.position.copy(controls.target).add(offset.setLength(distance));
    }
    const cameraMoving = controls.update();
    renderer.render(scene, camera);

    const settling =
      lifting ||
      cameraMoving ||
      stampPress.busy() ||
      dusk !== duskTarget ||
      performance.now() < dollyUntil;
    if (!settling && performance.now() - lastPoke > sleepAfter) {
      asleep = true;
      host.dataset.asleep = 'true';
      sync();
    }
  }

  // Only render while the bench is on screen, the tab is visible and it isn't asleep.
  let onScreen = true;
  function sync() {
    renderer.setAnimationLoop(onScreen && !document.hidden && !asleep ? frame : null);
  }
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    sync();
  }).observe(host);
  document.addEventListener('visibilitychange', () => (document.hidden ? sync() : poke()));
  new ResizeObserver(() => {
    resize();
    poke();
  }).observe(host);
  resize();
  sync();

  return {
    select(id: BenchId | null) {
      poke();
      if (!options.reducedMotion) {
        if (!selected && id) restDistance = camera.position.distanceTo(controls.target);
        dollyTo = id ? restDistance * DOLLY_IN : restDistance;
        dollyUntil = performance.now() + DOLLY_MS;
      }
      selected = id;
      if (!id) {
        focus.copy(HOME_TARGET);
        return;
      }
      const position = objects[id].group.getWorldPosition(new THREE.Vector3());
      focus.set(position.x * 0.4, HOME_TARGET.y, position.z * 0.4);
      if (!options.reducedMotion) stampPress.start();
    },
    highlight(id: BenchId | null) {
      poke();
      highlighted = id;
    },
    setEvening(on: boolean) {
      poke();
      duskTarget = on ? 1 : 0;
    },
  };
}

export type Bench = Awaited<ReturnType<typeof mountBench>>;
