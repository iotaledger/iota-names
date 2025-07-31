import { SVG_CONFIG, TEXT_CONFIG } from '../constants/common.js';
import { wrapTextLines } from './textLayout.js';

export function generateLayoutForNameAndSubname(
    subname: string | null,
    name: string,
): { subnameLines: string[]; nameLines: string[] } {
    const hasSubname = Boolean(subname);

    const firstFontSize = TEXT_CONFIG.subnameFontSize;
    const firstLineHeight = TEXT_CONFIG.subnameLineHeight;

    const secondFontSize = hasSubname ? TEXT_CONFIG.nameFontSize : TEXT_CONFIG.subnameFontSize;
    const secondLineHeight = hasSubname
        ? TEXT_CONFIG.nameLineHeight
        : TEXT_CONFIG.subnameLineHeight;

    const totalTextHeight = SVG_CONFIG.textBoxHeight;

    const maxFirstLines = hasSubname
        ? Math.floor(
              (totalTextHeight - SVG_CONFIG.gapBetweenParagraphs - secondLineHeight) /
                  firstLineHeight,
          )
        : 0;

    const subnameLines = hasSubname ? wrapTextLines(subname!, firstFontSize, maxFirstLines) : [];

    const usedHeight =
        subnameLines.length * firstLineHeight +
        (subnameLines.length > 0 ? SVG_CONFIG.gapBetweenParagraphs : 0);

    const remainingHeight = totalTextHeight - usedHeight;
    const maxSecondLines = Math.floor(remainingHeight / secondLineHeight);

    const nameLines = wrapTextLines(name, secondFontSize, maxSecondLines);

    return { subnameLines, nameLines };
}
