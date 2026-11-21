import { defineConfig, devices } from '@playwright/test';

const ci = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? 'github' : 'list',
  // CI runners have no GPU, so the 3D renders in software and can keep the page busy for
  // over a second at a time. Animations still finish there, just later.
  expect: { timeout: ci ? 15_000 : 5_000 },
  use: {
    baseURL: 'http://localhost:4321/DigitalPortfolio/',
    // Locally, use the installed Chrome instead of downloading a browser.
    channel: ci ? undefined : 'chrome',
    launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321/DigitalPortfolio/',
    reuseExistingServer: !ci,
  },
});
