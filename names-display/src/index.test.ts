import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('names-display service', () => {
    describe('SVG generation', () => {
        it('should generate valid SVG with name and timestamp', async () => {
            const { generateSvg } = await import('./test-utils.js');

            const result = generateSvg({
                name: 'test.iota',
                timestamp: 1640995200000, // 2022-01-01
            });

            expect(result).toContain('<svg');
            expect(result).toContain('</svg>');
            expect(result).toContain('test.iota');
            expect(result).toContain('January 1, 2022');
        });

        it('should normalize IOTA names correctly', async () => {
            const { generateSvg } = await import('./test-utils.js');

            const result = generateSvg({
                name: 'TEST.IOTA',
                timestamp: 1640995200000,
            });

            expect(result).toContain('test.iota');
        });

        it('should format dates correctly', async () => {
            const { generateSvg } = await import('./test-utils.js');

            const result = generateSvg({
                name: 'example.iota',
                timestamp: 1672531200000, // 2023-01-01
            });

            expect(result).toContain('January 1, 2023');
        });
    });

    describe('Parameter validation', () => {
        it('should validate required parameters', async () => {
            const { validateParams } = await import('./test-utils.js');

            const validParams = {
                name: 'test.iota',
                timestamp: '1640995200000',
            };

            const result = validateParams(validParams);
            expect(result.success).toBe(true);
            expect(result.data?.name).toBe('test.iota');
            expect(result.data?.timestamp).toBe(1640995200000);
        });

        it('should reject invalid parameters', async () => {
            const { validateParams } = await import('./test-utils.js');

            const invalidParams = {
                name: '',
                timestamp: 'invalid',
            };

            const result = validateParams(invalidParams);
            expect(result.success).toBe(false);
        });
    });

    describe('Base SVG template', () => {
        it('should load base SVG template', () => {
            const baseSvg = readFileSync('./src/base.svg', 'utf-8');
            expect(baseSvg).toContain('<svg');
            expect(baseSvg).toContain('{{ CONTENT }}');
        });
    });
});
