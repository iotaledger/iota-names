// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Accordion, AccordionContent, AccordionHeader, Title } from '@iota/apps-ui-kit';

type AccordionInfoProps = {
    id: string;
    title: string;
    isExpanded: boolean;
    onToggle: (id: string) => void;
    children: React.ReactNode;
};

export function AccordionInfo({ id, title, isExpanded, onToggle, children }: AccordionInfoProps) {
    return (
        <Accordion hideBorder={false}>
            <AccordionHeader isExpanded={isExpanded} onToggle={() => onToggle(id)}>
                <Title title={title} />
            </AccordionHeader>
            <AccordionContent isExpanded={isExpanded}>{children}</AccordionContent>
        </Accordion>
    );
}
