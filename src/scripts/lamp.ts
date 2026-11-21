/** The desk lamp doubles as the site's dark mode: lamp on means evening. */
export const lampIsOn = () => document.documentElement.dataset.lamp === 'on';

export function setLamp(on: boolean) {
  document.documentElement.dataset.lamp = on ? 'on' : 'off';
  try {
    localStorage.setItem('lamp', on ? 'on' : 'off');
  } catch {
    // Private mode or blocked storage: the switch still works for this visit.
  }
  syncSwitches();
  document.dispatchEvent(new CustomEvent('lamp:change', { detail: on }));
}

function syncSwitches() {
  const on = lampIsOn();
  document.querySelectorAll<HTMLButtonElement>('[data-lamp-switch]').forEach((button) => {
    button.setAttribute('aria-pressed', String(on));
  });
}

export function initLampSwitches() {
  syncSwitches();
  document.querySelectorAll<HTMLButtonElement>('[data-lamp-switch]').forEach((button) => {
    button.addEventListener('click', () => setLamp(!lampIsOn()));
  });
}
