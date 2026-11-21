import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  '',
  'work/event-form-automation/',
  'work/hardwood-hustle/',
  'work/cogsworths-forge/',
  'work/hdb-cats/',
  'work/hardening-this-site/',
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
  await expect(page.locator('[data-ticket="next"] svg.qr')).toHaveCount(0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('ticket stubs are plain links to the case studies', async ({ page }) => {
    await page.goto('');
    await expect(page.locator('.poster')).toBeVisible();
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
