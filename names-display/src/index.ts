import { readFileSync } from 'node:fs';
import Fastify from 'fastify';
import * as z from 'zod';

import { renderSvg } from './utils/renderSvg.js';

const baseSvgTemplate = readFileSync(new URL('./svg/base.svg', import.meta.url), 'utf-8');

export const Params = z.object({
    name: z.string(),
    timestamp: z.coerce.number(),
});

const fastify = Fastify({ logger: true });

fastify.get('/:name/:timestamp', async (req, reply) => {
    const params = await z.parseAsync(Params, req.params);
    try {
        const svg = renderSvg({ ...params, template: baseSvgTemplate });
        reply.type('image/svg+xml').code(200);
        return svg;
    } catch (e) {
        console.error(e);
        reply.code(500);
        return 'Error generating SVG';
    }
});

fastify.listen({ host: '0.0.0.0', port: Number(process.env.PORT) || 3000 });
