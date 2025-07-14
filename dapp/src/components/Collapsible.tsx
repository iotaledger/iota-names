// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Accordion, AccordionContent, AccordionHeader, Title, TitleSize } from '@iota/apps-ui-kit';
import { useState } from 'react';

interface CollapsibleProps {
    title: string;
    titleSize?: TitleSize;
}
export function Collapsible({
    title,
    titleSize,
    children,
}: React.PropsWithChildren<CollapsibleProps>) {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <Accordion hideBorder={false}>
            <AccordionHeader isExpanded={isOpen} onToggle={() => setIsOpen((prev) => !prev)}>
                <Title title={title} size={titleSize} />
            </AccordionHeader>
            <AccordionContent isExpanded={isOpen}>{children}</AccordionContent>
        </Accordion>
    );
}
