/**
 * A small stand-in for the real tool's duplicate check: the first store to
 * claim an event owns it, and the other store gets flagged instead of creating
 * a second form.
 */
export function initDuplicateDemo(root: HTMLElement) {
  const log = root.querySelector<HTMLOListElement>('[data-log]');
  if (!log) return;
  const empty = log.firstElementChild?.cloneNode(true) as HTMLElement;
  const owners = new Map<string, string>();
  let minutes = 9 * 60 + 12;

  function write(message: string, warn = false) {
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
      const owner = owners.get(event);
      if (owner && owner !== store) {
        write(
          `Duplicate: Store ${owner} already has "${event}". Check with them before sending.`,
          true,
        );
      } else if (owner) {
        write(`Store ${store} already made this form. Reusing the existing link.`);
      } else {
        owners.set(event, store);
        write(`Store ${store} created "${event}". Link and QR code ready to send.`);
      }
    });
  });

  root.querySelector('[data-reset]')?.addEventListener('click', () => {
    owners.clear();
    log.replaceChildren(empty.cloneNode(true));
  });
}
