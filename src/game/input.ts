import type { Dir } from './movement';

const KEYS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};
const ACTION_KEYS = new Set(['e', ' ', 'Enter']);

/**
 * Keyboard and on-screen buttons feed one queue. Taps are queued so quick
 * presses aren't lost mid-glide; a held direction keeps walking.
 */
export function createInput(root: HTMLElement) {
  const queue: Dir[] = [];
  const held = new Set<Dir>();
  let action = false;
  let paused = false;
  let enabled = false;

  const press = (dir: Dir) => {
    if (queue.length < 3) queue.push(dir);
    held.add(dir);
  };

  window.addEventListener('keydown', (e) => {
    if (!enabled || e.target instanceof HTMLInputElement) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const dir = KEYS[key];
    if (dir) {
      e.preventDefault();
      if (!e.repeat) press(dir);
    } else if (ACTION_KEYS.has(key)) {
      e.preventDefault();
      action = true;
    } else if (key === 'Escape') {
      paused = !paused;
    }
  });
  window.addEventListener('keyup', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const dir = KEYS[key];
    if (dir) held.delete(dir);
  });

  root.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((button) => {
    const dir = button.dataset.dir as Dir;
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      press(dir);
    });
    for (const end of ['pointerup', 'pointerleave', 'pointercancel'] as const) {
      button.addEventListener(end, () => held.delete(dir));
    }
  });
  root.querySelector('[data-action]')?.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    action = true;
  });

  return {
    enable(on: boolean) {
      enabled = on;
      if (!on) this.clear();
    },
    /** The next step to take: a queued tap first, otherwise a direction still held down. */
    nextDir(): Dir | null {
      return queue.shift() ?? [...held].pop() ?? null;
    },
    takeAction() {
      const pressed = action;
      action = false;
      return pressed;
    },
    get paused() {
      return paused;
    },
    clear() {
      queue.length = 0;
      held.clear();
      action = false;
    },
  };
}
