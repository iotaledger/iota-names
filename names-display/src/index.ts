import { readFileSync } from 'node:fs';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import Fastify from 'fastify';
import * as z from 'zod';

import { wrapTextByWidth } from './utils/measureTextWith';

const BASE = readFileSync('./src/base.svg', 'utf-8');
const ROBOTO_BASE64 = readFileSync('./src/fonts/roboto-flex.b64', 'utf-8');

const NAME_FONT_SIZE = 20;
const NAME_FONT_SIZE_WITH_SUBNAME = 16;

const FONT_STYLES = `
  <style>
    @font-face {
      font-family: 'RobotoFlex';
      src: url(data:font/woff2;charset=utf-8;base64,${ROBOTO_BASE64}) format('woff2');
      font-weight: normal;
      font-style: normal;
    }

    text {
      font-family: 'RobotoFlex', sans-serif;
    }

    .subname + .name {
        margin-top: 4px;
    }
  </style>
`;

const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});

function generateSvg({ name, timestamp }: z.infer<typeof Params>): string {
    const formattedName = normalizeIotaName(name, 'at', {
        truncateLongParts: false,
        onlyFirstSubname: false,
    });

    let subnameLines: string[] = [];
    let nameLines: string[] = [];

    let [subnames, _name] = formattedName.split('@').map((e) => e.toUpperCase());
    _name = `@${_name}`;

    const hasSubname = !!subnames;
    const nameFontSize = hasSubname ? NAME_FONT_SIZE_WITH_SUBNAME : NAME_FONT_SIZE;
    const subnameFontSize = NAME_FONT_SIZE;

    nameLines = wrapTextByWidth(_name, nameFontSize);
    subnameLines = wrapTextByWidth(subnames, subnameFontSize);

    const date = formatter.format(new Date(timestamp));

    const lineHeightEm = 1.2;
    const totalLineHeight = (subnameLines.length + nameLines.length - 1) * lineHeightEm;
    const startDy = -(totalLineHeight / 2);

    const contentLines = [
        ...subnameLines.map((line, i) => {
            const dy = i === 0 ? `${startDy}em` : `${lineHeightEm}em`;
            return `<tspan x="50%" dy="${dy}" style="${subnameFontSize}px;">${line}</tspan>`;
        }),
        ...nameLines.map((line, i) => {
            const dy =
                subnameLines.length > 0
                    ? `${lineHeightEm}em`
                    : i === 0
                      ? `${startDy}em`
                      : `${lineHeightEm}em`;
            return `<tspan x="50%" dy="${dy}" style="font-size: ${nameFontSize}px; ${subnameLines.length > 0 && i === 0 ? 'padding-top: 4px;' : ''}">${line}</tspan>`;
        }),
    ].join('\n');

    const content = `
        <text
            x="50%"
            y="50%"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="white"
            font-family="sans-serif"
            font-weight="bold"
        >
            ${contentLines}
        </text>
        <text
        x="150"
        y="200"
        font-family="sans-serif"
        font-size="8"
        fill="white"
        >
        ${date}
       </text>
    `;

    return BASE.replace('{{ CONTENT }}', FONT_STYLES + content);
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
        console.log(svg);
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
