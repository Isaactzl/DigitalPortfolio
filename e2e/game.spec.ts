import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Spawn (1,1) to beside terminal 1 at (11,1), ending facing it. Mirrors FLOOR in src/game/map.ts. */
const PATH_TO_TERMINAL_1 = [
  ...Array(3).fill('ArrowRight'),
  ...Array(2).fill('ArrowDown'),
  ...Array(2).fill('ArrowRight'),
  ...Array(2).fill('ArrowUp'),
  ...Array(5).fill('ArrowRight'),
];

async function watchForProblems(page: Page) {
  const problems: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && problems.push(msg.text()));
  page.on('pageerror', (err) => problems.push(err.message));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`CSP blocked ${e.blockedURI} (${e.violatedDirective})`);
    });
  });
  return problems;
}

/** Answers whatever question is open, correctly, using the page's own question bank. */
async function answerCorrectly(page: Page) {
  const dialog = page.getByRole('dialog');
  const id = await dialog.getAttribute('data-question-id');
  const question = await page.evaluate((qid) => {
    const bank = JSON.parse(document.getElementById('question-bank')!.textContent!);
    for (const q of bank) {
      if (q.id === qid) return q;
      if (q.followUp?.id === qid) return q.followUp;
    }
    return null;
  }, id);
  expect(question, `question ${id} in bank`).not.toBeNull();
  if (question.kind === 'choice') {
    await dialog
      .getByRole('button', { name: question.choices[question.answer], exact: true })
      .click();
  } else {
    await dialog.getByRole('textbox').fill(question.answer[0]);
    await dialog.getByRole('button', { name: 'Submit' }).click();
  }
}

test('the game page loads cleanly and passes axe', async ({ page }) => {
  const problems = await watchForProblems(page);
  await page.goto('play/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mainframe Run');
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact ?? ''),
  );
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  expect(problems).toEqual([]);
});

test('walking to the first terminal and answering right cracks it', async ({ page }) => {
  const problems = await watchForProblems(page);
  await page.goto('play/');
  await page.getByRole('button', { name: 'Start run' }).click();
  await expect(page.locator('#game canvas')).toBeVisible();

  for (const key of PATH_TO_TERMINAL_1) {
    await page.keyboard.press(key);
    await page.waitForTimeout(140);
  }
  await page.keyboard.press('e');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await answerCorrectly(page);
  await expect(dialog).toContainText('Cracked');
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('[data-hud="cracked"]')).toHaveText('1/5');

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact ?? ''),
  );
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  expect(problems).toEqual([]);
});

test('running out of time shows the revision report', async ({ page }) => {
  // Four simulated minutes is ~15,000 rendered frames, which takes longer than the default limit.
  test.setTimeout(120_000);
  await page.clock.install();
  await page.goto('play/');
  await page.getByRole('button', { name: 'Start run' }).click();
  await page.clock.runFor(245_000);
  await expect(page.getByRole('heading', { name: 'Out of time' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run again' })).toBeVisible();
});

test('phones get touch controls and no sideways scroll', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone-only check');
  await page.goto('play/');
  await page.getByRole('button', { name: 'Start run' }).click();
  await expect(page.getByRole('button', { name: 'Move up' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hack' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
