import { normalizeIotaName } from '@iota/iota-names-sdk';
import z from 'zod';

import {
    DATE_CONFIG,
    SVG_CONFIG,
    TEXT_CONFIG,
    TEXT_TO_SVG_INTER,
    TEXT_TO_SVG_ROBOTO,
} from '../constants/common.js';
import { generateLayoutForNameAndSubname } from './generateLayout.js';

interface LineRenderingInfo {
    text: string;
    fontSize: number;
    lineHeight: number;
    measuredWidth: number;
}

export const Params = z.object({
    name: z.string(),
    timestamp: z.coerce.number(),
});

type RenderSvgParameters = z.infer<typeof Params> & {
    addDataTestText?: boolean;
    template: string;
};
export function renderSvg({ name, timestamp, addDataTestText, template }: RenderSvgParameters) {
    const formattedDate = TEXT_CONFIG.dateFormatter.format(new Date(timestamp));

    const [rawSubname, rawName] = normalizeIotaName(name, 'at').split('@');
    const subnameLines = rawSubname
        ? generateLayoutForNameAndSubname(rawSubname.toUpperCase(), '').subnameLines
        : [];
    const nameLines = generateLayoutForNameAndSubname('', `@${rawName.toUpperCase()}`).nameLines;

    const hasSubname = subnameLines.length > 0;

    const subnameFontSize = TEXT_CONFIG.subnameFontSize;
    const subnameLineHeight = TEXT_CONFIG.subnameLineHeight;
    const nameFontSize = hasSubname
        ? TEXT_CONFIG.nameFontSizeWithSubname
        : TEXT_CONFIG.nameFontSize;

    const nameLineHeight = hasSubname
        ? TEXT_CONFIG.nameLineHeightWithSubname
        : TEXT_CONFIG.nameLineHeight;

    const gapBetweenBlocks = hasSubname ? SVG_CONFIG.gapBetweenParagraphs : 0;

    const allTextLines: LineRenderingInfo[] = [];

    for (const textLine of subnameLines) {
        const measuredWidth = TEXT_TO_SVG_ROBOTO.getMetrics(textLine, {
            fontSize: subnameFontSize,
        }).width;
        allTextLines.push({
            text: textLine,
            fontSize: subnameFontSize,
            lineHeight: subnameLineHeight,
            measuredWidth,
        });
    }

    for (const textLine of nameLines) {
        const measuredWidth = TEXT_TO_SVG_ROBOTO.getMetrics(textLine, {
            fontSize: nameFontSize,
        }).width;
        allTextLines.push({
            text: textLine,
            fontSize: nameFontSize,
            lineHeight: nameLineHeight,
            measuredWidth,
        });
    }

    const maximumBlockWidth = allTextLines.reduce(
        (currentMax, lineInfo) =>
            lineInfo.measuredWidth > currentMax ? lineInfo.measuredWidth : currentMax,
        0,
    );

    const subnameBlockHeight = subnameLines.length * subnameLineHeight;
    const nameBlockHeight = nameLines.length * nameLineHeight;
    const totalTextBlockHeight = subnameBlockHeight + gapBetweenBlocks + nameBlockHeight;

    const horizontalOffset =
        SVG_CONFIG.paddingX + (SVG_CONFIG.textBoxWidth - maximumBlockWidth) / 2;
    const verticalOffset =
        SVG_CONFIG.textBoxTop + (SVG_CONFIG.textBoxHeight - totalTextBlockHeight) / 2;

    let currentYPosition = verticalOffset;

    let svgContent = '';

    for (let index = 0; index < allTextLines.length; index++) {
        const lineInfo = allTextLines[index];

        if (index === subnameLines.length && hasSubname) {
            currentYPosition += gapBetweenBlocks;
        }

        const xPosition = horizontalOffset + (maximumBlockWidth - lineInfo.measuredWidth) / 2;

        const yMiddle = currentYPosition + lineInfo.lineHeight / 2;

        const pathData = TEXT_TO_SVG_ROBOTO.getD(lineInfo.text, {
            x: xPosition,
            y: yMiddle,
            fontSize: lineInfo.fontSize,
            anchor: 'middle',
        });

        const dataTestText = addDataTestText ? ` data-test-line-text="${lineInfo.text}"` : '';

        svgContent += `<path d="${pathData}"${dataTestText} fill="${TEXT_CONFIG.color}"/>\n`;

        currentYPosition += lineInfo.lineHeight;
    }

    const dateTestId = addDataTestText ? ` data-test-date="${formattedDate}"` : '';
    const dateX = SVG_CONFIG.svgWidth - DATE_CONFIG.paddingRight;
    const dateY = SVG_CONFIG.svgHeight - DATE_CONFIG.paddingBottom;
    const datePath = TEXT_TO_SVG_INTER.getD(formattedDate, {
        x: dateX,
        y: dateY,
        fontSize: DATE_CONFIG.fontSize,
        anchor: 'right bottom',
    });
    svgContent += `<path d="${datePath}"${dateTestId} fill="${TEXT_CONFIG.color}"/>\n`;

    return template.replace('{{{CONTENT}}}', svgContent);
}
