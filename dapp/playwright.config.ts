import { defineConfig, devices } from '@playwright/test';

const PURCHASE_SETUP_PROJECT_NAME = 'Purchase setup';
const AUCTIONS_SETUP_PROJECT_NAME = 'Auctions setup';
const PURCHASE_PROJECT_NAME = 'chromium purchase mode';
const AUCTIONS_PROJECT_NAME = 'chromium auctions';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests',
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
            name: PURCHASE_SETUP_PROJECT_NAME,
            testMatch: /purchase\.setup\.ts/,
        },
        {
            name: PURCHASE_PROJECT_NAME,
            use: {
                ...devices['Desktop Chrome'],
                userAgent: 'Playwright',
            },
            testDir: './tests/purchase',
            dependencies: [PURCHASE_SETUP_PROJECT_NAME],
        },
        {
            name: AUCTIONS_SETUP_PROJECT_NAME,
            testMatch: /auctions\.setup\.ts/,
            dependencies: [PURCHASE_PROJECT_NAME],
        },
        {
            name: AUCTIONS_PROJECT_NAME,
            use: {
                ...devices['Desktop Chrome'],
                userAgent: 'Playwright',
            },
            testDir: './tests/auctions',
            dependencies: [AUCTIONS_SETUP_PROJECT_NAME],
        },
    ],
    webServer: {
        command: 'pnpm run dev',
        port: 3005,
        timeout: 30 * 1000,
        reuseExistingServer: !process.env.CI,
    },
});
