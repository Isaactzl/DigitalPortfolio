import type { Bench, BenchId } from './bench';
import { lampIsOn, setLamp } from './lamp';
import { playThunk, setSound, soundIsOn } from './sound';

const scene = document.querySelector<HTMLElement>('#bench');
const slot = document.querySelector<HTMLElement>('.ticket-slot');
const stubs = [...document.querySelectorAll<HTMLElement>('.stub[data-id]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stacked = matchMedia('(max-width: 860px)');
/** Matches the ticket's slide transition in Ticket.astro. */
const SLIDE_MS = 550;
/** When the stamp lands, in both the 3D press and the ticket's stamp. */
const STAMP_LANDS_MS = 450;

let bench: Bench | null = null;
let openId: string | null = null;

const ticketFor = (id: string) => slot?.querySelector<HTMLElement>(`[data-ticket="${id}"]`);
const stubFor = (id: string) => stubs.find((s) => s.dataset.id === id);

function open(id: string) {
  const ticket = ticketFor(id);
  if (!ticket) return;
  // Switching tickets: the new one slides in over the old, so the old one can go at
  // once. No timer here, because a busy main thread can delay a timer for seconds.
  slot?.querySelectorAll<HTMLElement>('.ticket').forEach((other) => {
    if (other === ticket) return;
    other.classList.remove('open');
    other.hidden = true;
  });
  openId = id;
  ticket.hidden = false;
  // Force a layout so the slide-in transition starts from the off-screen position.
  void ticket.offsetWidth;
  ticket.classList.add('open');
  ticket.focus({ preventScroll: true });
  stubs.forEach((s) => s.setAttribute('aria-expanded', String(s.dataset.id === id)));
  bench?.select(id as BenchId);
  setTimeout(playThunk, reducedMotion ? 0 : STAMP_LANDS_MS);
  if (stacked.matches)
    slot?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

function hide(ticket: HTMLElement) {
  ticket.classList.remove('open');
  // A timer rather than transitionend: that event never fires if the slide is
  // interrupted, which left tickets stuck on screen on phones.
  setTimeout(
    () => {
      if (!ticket.classList.contains('open')) ticket.hidden = true;
    },
    reducedMotion ? 0 : SLIDE_MS,
  );
}

function close() {
  if (!openId) return;
  const id = openId;
  const ticket = ticketFor(id);
  if (ticket) hide(ticket);
  openId = null;
  stubs.forEach((s) => s.setAttribute('aria-expanded', 'false'));
  bench?.select(null);
  stubFor(id)?.focus();
}

stubs.forEach((stub) => {
  stub.addEventListener('click', (e) => {
    // Let modified clicks open the case study in a new tab as normal links do.
    if (e instanceof MouseEvent && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return;
    e.preventDefault();
    const id = stub.dataset.id;
    if (id) open(id);
  });
  stub.addEventListener('mouseenter', () => bench?.highlight((stub.dataset.id as BenchId) ?? null));
  stub.addEventListener('mouseleave', () => bench?.highlight(null));
});

slot?.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-close]')) close();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') close();
});

function webglAvailable() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

async function startBench() {
  if (!scene || !webglAvailable()) return;
  const tip = scene.querySelector<HTMLElement>('.tip');
  if (!tip) return;
  const labels = JSON.parse(scene.dataset.labels ?? '{}') as Record<BenchId, string>;
  const formsStub = stubFor('forms');
  const qrUrl = formsStub instanceof HTMLAnchorElement ? formsStub.href : location.href;
  const { mountBench } = await import('./bench');
  bench = await mountBench(scene, {
    labels,
    tip,
    reducedMotion,
    qrUrl,
    evening: lampIsOn(),
    onSelect: open,
    onLampClick: () => setLamp(!lampIsOn()),
    onHover: lightStub,
  });
  enableBenchKeyboard(scene);
  requestAnimationFrame(() => scene.classList.add('live'));
}

function lightStub(id: string | null) {
  stubs.forEach((s) => s.classList.toggle('lit', s.dataset.id === id));
}

/** Arrow keys step through the objects on the bench; Enter opens the one that's lifted. */
function enableBenchKeyboard(host: HTMLElement) {
  const order = stubs.map((s) => s.dataset.id as BenchId);
  let cursor = -1;
  const show = (index: number) => {
    cursor = (index + order.length) % order.length;
    bench?.highlight(order[cursor]);
    lightStub(order[cursor]);
  };

  host.tabIndex = 0;
  host.setAttribute(
    'aria-label',
    'The workbench. Use the arrow keys to pick an object and Enter to open it. The same projects are listed as tickets.',
  );
  host.addEventListener('keydown', (e) => {
    if (e.target !== host) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') show(cursor + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') show(cursor - 1);
    else if ((e.key === 'Enter' || e.key === ' ') && cursor >= 0) open(order[cursor]);
    else return;
    e.preventDefault();
  });
  host.addEventListener('blur', () => {
    cursor = -1;
    bench?.highlight(null);
    lightStub(null);
  });
}

document.addEventListener('lamp:change', () => bench?.setEvening(lampIsOn()));

/**
 * Phones that ask to save data, or have very little memory, keep the still render
 * until the visitor asks for the 3D. Everyone else gets it once the page is idle.
 */
function shouldHoldBack() {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  return (
    nav.connection?.saveData === true ||
    (nav.deviceMemory ?? 8) <= 2 ||
    matchMedia('(prefers-reduced-data: reduce)').matches
  );
}

const wakeButton = document.querySelector<HTMLButtonElement>('[data-wake-bench]');
if (shouldHoldBack() && wakeButton) {
  wakeButton.hidden = false;
  wakeButton.addEventListener(
    'click',
    () => {
      wakeButton.hidden = true;
      void startBench();
    },
    { once: true },
  );
} else {
  // The poster carries first paint; the 3D loads once the browser has a quiet moment.
  const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
  idle(() => void startBench());
}

const soundSwitch = document.querySelector<HTMLButtonElement>('[data-sound-switch]');
if (soundSwitch) {
  soundSwitch.setAttribute('aria-pressed', String(soundIsOn()));
  soundSwitch.addEventListener('click', () => {
    const on = !soundIsOn();
    setSound(on);
    soundSwitch.setAttribute('aria-pressed', String(on));
  });
}
