// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Accordion, AccordionContent, AccordionHeader, Title } from '@iota/apps-ui-kit';
import { useState } from 'react';

type AccordionInfoProps = {
    title: string;
    children: React.ReactNode;
};

export function CollapsibleInfo({ title, children }: AccordionInfoProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Accordion hideBorder={false}>
            <AccordionHeader isExpanded={isOpen} onToggle={() => setIsOpen((prev) => !prev)}>
                <Title title={title} />
            </AccordionHeader>
            <AccordionContent isExpanded={isOpen}>{children}</AccordionContent>
        </Accordion>
    );
}
