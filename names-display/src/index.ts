import { readFileSync } from 'node:fs';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import Fastify from 'fastify';
import * as z from 'zod';

const BASE = readFileSync('./src/base.svg', 'utf-8');
const ROBOTO_BASE64 = readFileSync('./src/fonts/roboto-flex.b64', 'utf-8');

const FONT_STYLE = `
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
  </style>
`;

const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});

function truncateWithEllipsis(text: string, maxLength: number): string {
    return text.length > maxLength ? text.slice(0, maxLength - 1) + '…' : text;
}
function splitTextForSvg(text: string, maxLengthPerLine = 13, maxLines = 4): string[] {
    const parts: string[] = [];

    for (let i = 0; i < text.length && parts.length < maxLines; i += maxLengthPerLine) {
        const isLastLine = parts.length === maxLines - 1;
        const chunk = text.slice(i, i + maxLengthPerLine);
        parts.push(
            isLastLine
                ? truncateWithEllipsis(chunk + text.slice(i + maxLengthPerLine), maxLengthPerLine)
                : chunk,
        );
    }

    return parts;
}

function generateSvg({ name, timestamp }: z.infer<typeof Params>): string {
    const formattedName = normalizeIotaName(name, 'at', {
        truncateLongParts: false,
        onlyFirstSubname: false,
    });
    const fontSize = formattedName.length > 14 ? 15 : 20;

    const lines = splitTextForSvg(formattedName.toUpperCase());
    const date = formatter.format(new Date(timestamp));

    const lineHeightEm = 1.2;
    const totalLineHeight = (lines.length - 1) * lineHeightEm;
    const startDy = -(totalLineHeight / 2);

    const contentLines = lines
        .map((line, i) => {
            const dy = i === 0 ? `${startDy}em` : `${lineHeightEm}em`;
            return `<tspan x="50%" dy="${dy}">${line}</tspan>`;
        })
        .join('\n');

    const content = `
        <text
            x="50%"
            y="50%"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="white"
            font-family="sans-serif"
            font-size="${fontSize}"
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

    return BASE.replace('{{ CONTENT }}', FONT_STYLE + content);
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
