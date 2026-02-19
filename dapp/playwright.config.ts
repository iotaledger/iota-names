import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: 'html',
    expect: {
        timeout: 10_000,
    },
    use: {
        baseURL: 'http://localhost:3005',
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'Chromium',
            testDir: './tests/common',
            use: {
                ...devices['Desktop Chrome'],
                userAgent: 'Playwright',
            },
            fullyParallel: false,
        },
        {
            name: 'Management flow',
            use: {
                ...devices['Desktop Chrome'],
                userAgent: 'Playwright',
            },
            testDir: './tests/management',
            fullyParallel: false,
        },
        {
            name: 'Purchase setup',
            testMatch: /purchase\.setup\.ts/,
        },
        {
            name: 'Purchase flow',
            use: {
                ...devices['Desktop Chrome'],
                userAgent: 'Playwright',
            },
            testDir: './tests/purchase',
            dependencies: ['Purchase setup'],
            fullyParallel: false,
        },
        // Auction tests are disabled - auction functionality is hidden from UI
        // {
        //     name: 'Auctions setup',
        //     testMatch: /auctions\.setup\.ts/,
        //     dependencies: ['Purchase flow'],
        // },
        // {
        //     name: 'Auctions flow',
        //     use: {
        //         ...devices['Desktop Chrome'],
        //         userAgent: 'Playwright',
        //     },
        //     testDir: './tests/auctions',
        //     dependencies: ['Auctions setup'],
        // },
    ],
    webServer: {
        command: process.env.CI ? 'pnpm start' : 'pnpm run dev',
        port: 3005,
        timeout: 30 * 1000,
        reuseExistingServer: !process.env.CI,
    },
});
