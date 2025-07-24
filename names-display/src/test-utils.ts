import { readFileSync } from 'node:fs';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import * as z from 'zod';

const BASE = readFileSync('./src/base.svg', 'utf-8');

const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});

const Params = z.object({
    name: z.string(),
    timestamp: z.coerce.number(),
});

export function generateSvg({ name, timestamp }: z.infer<typeof Params>): string {
    const formattedName = normalizeIotaName(name, 'dot');
    const date = formatter.format(new Date(timestamp));

    const content = `
        <text x="0" y="0" fill="white">
            <tspan x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="17" font-weight="bold">${formattedName}</tspan>
            <tspan x="150" y="200" font-family="sans-serif" font-size="8">${date}</tspan>
        </text>
    `;
    return BASE.replace('{{ CONTENT }}', content);
}

export function validateParams(params: unknown) {
    return Params.safeParse(params);
}