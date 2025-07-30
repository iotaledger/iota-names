import { createCanvas, registerFont } from 'canvas';

registerFont('./src/fonts/RobotoFlex-Custom.ttf', { family: 'RobotoFlex' });

const canvas = createCanvas(1, 1);
const ctx = canvas.getContext('2d');

const SVG_WIDTH = 220;
const SVG_HEIGHT = 120;
const MARGIN = 15;
const MAX_TEXT_WIDTH = SVG_WIDTH - 2 * MARGIN;
const MAX_TEXT_HEIGHT = SVG_HEIGHT;

function measureTextWidth(text: string, fontSize: number): number {
    ctx.font = `bold ${fontSize}px RobotoFlex`;
    const width = ctx.measureText(text).width;
    return width;
}

function truncateLineToFit(text: string, fontSize: number): string {
    let truncated = text;
    let textWidth = measureTextWidth(truncated, fontSize);

    while (textWidth + measureTextWidth('…', fontSize) > MAX_TEXT_WIDTH && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
        textWidth = measureTextWidth(truncated, fontSize);
    }
    return truncated + '…';
}

export function wrapTextByWidth(text: string, fontSize: number): string[] {
    const lines: string[] = [];
    let currentLine = '';
    const lineHeightEm = 1.2;
    const lineHeightPx = fontSize * lineHeightEm;

    const maxLines = Math.floor(MAX_TEXT_HEIGHT / lineHeightPx);

    for (let i = 0; i < text.length; i++) {
        const testLine = currentLine + text[i];
        const width = measureTextWidth(testLine, fontSize);

        if (width > MAX_TEXT_WIDTH) {
            if (currentLine) {
                if (lines.length < maxLines - 1) {
                    lines.push(currentLine);
                } else {
                    const finalLine = truncateLineToFit(currentLine, fontSize);
                    lines.push(finalLine);
                    break;
                }
            }
            currentLine = text[i];
        } else {
            currentLine = testLine;
        }
    }

    if (lines.length < maxLines && currentLine) {
        lines.push(currentLine);
    }

    return lines;
}
