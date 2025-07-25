import { readFileSync } from 'node:fs';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import Fastify from 'fastify';
import * as z from 'zod';

const BASE = readFileSync('./src/base.svg', 'utf-8');

const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});

function generateSvg({ name, timestamp }: z.infer<typeof Params>): string {
    const formattedName = normalizeIotaName(name, 'at', {
        truncateLongParts: true,
        onlyFirstSubname: true,
    });

    const date = formatter.format(new Date(timestamp));

    const content = `
        <text x="0" y="0" fill="white">
            <tspan x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="17" font-weight="bold">${formattedName}</tspan>
            <tspan x="150" y="200" font-family="sans-serif" font-size="8">${date}</tspan>
        </text>
    `;
    return BASE.replace('{{ CONTENT }}', content);
}

const Params = z.object({
    name: z.string(),
    timestamp: z.coerce.number(),
});

const fastify = Fastify({
    logger: true,
});

fastify.get('/:name/:timestamp', async (request, reply) => {
    try {
        const params = await z.parseAsync(Params, request.params);
        const svg = generateSvg(params);
        reply.type('image/svg+xml').code(200);

        return svg;
    } catch (e) {
        console.log(e); // TODO: use pino method
        reply.code(500);
        return 'cooked';
    }
});

fastify.listen(
    {
        host: '0.0.0.0',
        port: Number(process.env['PORT']) || 3000,
    },
    (err) => {
        if (err) throw err;
    },
);
