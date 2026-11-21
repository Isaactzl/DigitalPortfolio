import type { Bench, BenchId } from './bench';
import { lampIsOn, setLamp } from './lamp';

const scene = document.querySelector<HTMLElement>('#bench');
const slot = document.querySelector<HTMLElement>('.ticket-slot');
const stubs = [...document.querySelectorAll<HTMLElement>('.stub[data-id]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const stacked = matchMedia('(max-width: 860px)');
/** Matches the ticket's slide transition in Ticket.astro. */
const SLIDE_MS = 550;

let bench: Bench | null = null;
let openId: string | null = null;

const ticketFor = (id: string) => slot?.querySelector<HTMLElement>(`[data-ticket="${id}"]`);
const stubFor = (id: string) => stubs.find((s) => s.dataset.id === id);

function open(id: string) {
  const ticket = ticketFor(id);
  if (!ticket) return;
  if (openId && openId !== id) hide(openId);
  openId = id;
  ticket.hidden = false;
  // Force a layout so the slide-in transition starts from the off-screen position.
  void ticket.offsetWidth;
  ticket.classList.add('open');
  ticket.focus({ preventScroll: true });
  stubs.forEach((s) => s.setAttribute('aria-expanded', String(s.dataset.id === id)));
  bench?.select(id as BenchId);
  if (stacked.matches)
    slot?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}

function hide(id: string) {
  const ticket = ticketFor(id);
  if (!ticket) return;
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
  hide(id);
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
  const { mountBench } = await import('./bench');
  bench = await mountBench(scene, {
    labels,
    tip,
    reducedMotion,
    evening: lampIsOn(),
    onSelect: open,
    onLampClick: () => setLamp(!lampIsOn()),
    onHover: (id) => stubs.forEach((s) => s.classList.toggle('lit', s.dataset.id === id)),
  });
  requestAnimationFrame(() => scene.classList.add('live'));
}

document.addEventListener('lamp:change', () => bench?.setEvening(lampIsOn()));

// The poster carries first paint; the 3D loads once the browser has a quiet moment.
const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 200));
idle(() => void startBench());
