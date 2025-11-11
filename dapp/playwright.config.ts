import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: 'html',
    expect: {
        timeout: 10_000,
    },
    use: {
        baseURL: 'http://localhost:3005',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'Chromium',
            testDir: './tests/common',
            use: {
                ...devices['Desktop Chrome'],
                userAgent: 'Playwright',
            },
            fullyParallel: true,
        },
    ],
    webServer: {
        command: process.env.CI ? 'pnpm start' : 'pnpm run dev',
        port: 3005,
        timeout: 30 * 1000,
        reuseExistingServer: !process.env.CI,
    },
});
