import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  '',
  'work/event-form-automation/',
  'work/hardwood-hustle/',
  'work/cogsworths-forge/',
  'work/hdb-cats/',
  'work/hardening-this-site/',
  'work/mainframe-run/',
  'other/',
  'about/',
  'how-it-works/',
];

/** Records console errors, uncaught exceptions and CSP violations for a page. */
async function watchForProblems(page: Page) {
  const problems: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && problems.push(`console: ${msg.text()}`));
  page.on('pageerror', (err) => problems.push(`exception: ${err.message}`));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`CSP blocked ${e.blockedURI} (${e.violatedDirective})`);
    });
  });
  return problems;
}

for (const path of pages) {
  test(`/${path} loads cleanly and passes axe`, async ({ page }) => {
    const problems = await watchForProblems(page);
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    );
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    expect(problems).toEqual([]);
  });
}

test.describe('bench and tickets', () => {
  test('the 3D bench mounts over the poster', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('#bench')).toHaveClass(/live/, { timeout: 15_000 });
    await expect(page.locator('#bench canvas')).toBeVisible();
  });

  test('a ticket stub opens its ticket, and Escape puts focus back', async ({ page }) => {
    await page.goto('');
    const stub = page.locator('.stub[data-id="hoops"]');
    const ticket = page.locator('[data-ticket="hoops"]');

    await stub.click();
    await expect(ticket).toBeVisible();
    await expect(ticket).toBeFocused();
    await expect(stub).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(ticket).toBeHidden();
    await expect(stub).toBeFocused();
    await expect(stub).toHaveAttribute('aria-expanded', 'false');
  });

  test('tickets work from the keyboard alone', async ({ page }) => {
    await page.goto('');
    await page.locator('.stub[data-id="forms"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-ticket="forms"]')).toBeVisible();
    await page.getByRole('button', { name: 'Back to stack' }).first().click();
    await expect(page.locator('[data-ticket="forms"]')).toBeHidden();
  });

  test('opening a second ticket closes the first', async ({ page }) => {
    await page.goto('');
    await page.locator('.stub[data-id="forms"]').click();
    // The open ticket covers the stack, so reach the next stub the way a keyboard user would.
    await page.locator('.stub[data-id="cats"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-ticket="cats"]')).toBeVisible();
    await expect(page.locator('[data-ticket="forms"]')).toBeHidden();
  });
});

test('the bench can be driven from the keyboard', async ({ page }) => {
  await page.goto('');
  const bench = page.locator('#bench');
  await expect(bench).toHaveClass(/live/, { timeout: 15_000 });
  await bench.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.stub[data-id="forms"]')).toHaveClass(/lit/);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.stub[data-id="hoops"]')).toHaveClass(/lit/);
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-ticket="hoops"]')).toBeVisible();
});

test('each ticket carries a QR code for its case study', async ({ page }) => {
  await page.goto('');
  const qr = page.locator('[data-ticket="cats"] svg.qr');
  await expect(qr).toHaveAttribute('aria-label', /work\/hdb-cats\/$/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('ticket stubs are plain links to the case studies', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('.poster.day')).toBeVisible();
    await page.locator('.stub[data-id="cats"]').click();
    await expect(page).toHaveURL(/work\/hdb-cats\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('HDB Cats');
  });
});

test('the duplicate-booking demo flags the second store', async ({ page }) => {
  await page.goto('work/event-form-automation/');
  const stores = page.locator('.demo form');
  await stores.nth(0).getByRole('button', { name: 'Create form' }).click();
  await stores.nth(1).getByRole('button', { name: 'Create form' }).click();
  const log = page.locator('[data-log]');
  await expect(log.locator('li.warn')).toContainText('Duplicate: Store A already has');
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(log).toContainText('Nothing yet');
});

test('the YouTube player only loads after Play', async ({ page }) => {
  await page.goto('work/event-form-automation/');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.getByRole('link', { name: 'Play video' }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\//);
});

test('old URLs redirect to their new homes', async ({ page }) => {
  await page.goto('about.html');
  await expect(page).toHaveURL(/about\/$/);
});

test.describe('the lamp', () => {
  test('switching it on darkens the site and is remembered', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('');
    const lamp = page.locator('[data-lamp-switch]');
    await expect(page.locator('html')).toHaveAttribute('data-lamp', 'off');
    await lamp.click();
    await expect(lamp).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-lamp', 'on');
    await page.goto('about/');
    await expect(page.locator('html')).toHaveAttribute('data-lamp', 'on');
    await expect(page.locator('[data-lamp-switch]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('it starts on for visitors whose system is in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('');
    await expect(page.locator('html')).toHaveAttribute('data-lamp', 'on');
  });

  for (const path of ['', 'work/event-form-automation/', 'other/', 'about/']) {
    test(`/${path} keeps its contrast with the lamp on`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      expect(results.violations.flatMap((v) => v.nodes.map((n) => n.target.join(' ')))).toEqual([]);
    });
  }
});

test('every page points to a share image that exists', async ({ page, request }) => {
  for (const path of pages) {
    await page.goto(path);
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(image, path).toBeTruthy();
    // Share images use the production URL; check the same file on the local server.
    const local = new URL(image ?? '').pathname;
    const response = await request.get(`http://localhost:4321${local}`);
    expect(response.status(), `${path} → ${local}`).toBe(200);
  }
});

test('sound is off until switched on, then plays without errors', async ({ page }) => {
  const problems = await watchForProblems(page);
  await page.goto('');
  await expect(page.locator('#bench')).toHaveClass(/live/, { timeout: 15_000 });
  const sound = page.locator('[data-sound-switch]');
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.stub[data-id="forms"]').click();
  await page.locator('[data-lamp-switch]').click();
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.locator('[data-sound-switch]')).toHaveAttribute('aria-pressed', 'true', {
    timeout: 15_000,
  });
  expect(problems).toEqual([]);
});

test.describe('saving battery and data', () => {
  test('low-memory phones keep the still render until the visitor asks', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 1 });
    });
    await page.goto('');
    const wake = page.getByRole('button', { name: 'Load the 3D bench' });
    await expect(wake).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(page.locator('#bench canvas')).toHaveCount(0);
    await wake.click();
    await expect(page.locator('#bench')).toHaveClass(/live/);
  });

  test('the bench stops drawing when left alone and wakes when touched', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('');
    const bench = page.locator('#bench');
    await expect(bench).toHaveClass(/live/);
    await expect(bench).toHaveAttribute('data-asleep', 'true');
    await page.locator('#bench canvas').hover({ position: { x: 200, y: 200 } });
    await page.mouse.move(260, 240);
    await expect(bench).toHaveAttribute('data-asleep', 'false');
  });
});

test('project 006 opens from its stub and leads to the game', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('.stub[data-id="next"]')).toHaveCount(0);
  await page.locator('.stub[data-id="arcade"]').click();
  const ticket = page.locator('[data-ticket="arcade"]');
  await expect(ticket).toBeVisible();
  await expect(ticket).toContainText('Mainframe Run');
  await ticket.getByRole('link', { name: 'Open case study' }).click();
  await expect(page).toHaveURL(/work\/mainframe-run\/$/);
  await page.getByRole('link', { name: 'Play it live' }).click();
  await expect(page).toHaveURL(/play\/$/);
});
