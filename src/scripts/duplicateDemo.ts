import { claimEvent, type Claim } from './bookings';

function describe(claim: Claim, event: string) {
  switch (claim.kind) {
    case 'created':
      return `Store ${claim.store} created "${event}". Link and QR code ready to send.`;
    case 'reused':
      return `Store ${claim.store} already made this form. Reusing the existing link.`;
    case 'duplicate':
      return `Duplicate: Store ${claim.owner} already has "${event}". Check with them before sending.`;
  }
}

export function initDuplicateDemo(root: HTMLElement) {
  const log = root.querySelector<HTMLOListElement>('[data-log]');
  if (!log) return;
  const empty = log.firstElementChild?.cloneNode(true) as HTMLElement;
  const owners = new Map<string, string>();
  let minutes = 9 * 60 + 12;

  function write(message: string, warn: boolean) {
    log?.querySelector('.empty')?.remove();
    minutes += 3 + Math.floor(Math.random() * 9);
    const item = document.createElement('li');
    if (warn) item.className = 'warn';
    const time = document.createElement('time');
    time.textContent = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const text = document.createElement('span');
    text.textContent = message;
    item.append(time, text);
    log?.prepend(item);
  }

  root.querySelectorAll<HTMLFormElement>('form[data-store]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const store = form.dataset.store ?? '?';
      const event = new FormData(form).get('event')?.toString() ?? '';
      const claim = claimEvent(owners, store, event);
      write(describe(claim, event), claim.kind === 'duplicate');
    });
  });

  root.querySelector('[data-reset]')?.addEventListener('click', () => {
    owners.clear();
    log.replaceChildren(empty.cloneNode(true));
  });
}
