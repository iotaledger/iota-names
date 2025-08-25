// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Button,
    ButtonType,
    Checkbox,
    Dialog,
    DialogBody,
    DialogContent,
    DialogPosition,
    Header,
} from '@iota/apps-ui-kit';
import TOS from '@legal/tos.mdx';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { TermsAndConds } from '@/lib/utils/termsAndConditions';

export function TermsAndConditionsDialog() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const modalParam = searchParams.get('modal');
    const open = modalParam === 'terms_conditions';

    const [termsAccepted, setTermsAccepted] = useState(TermsAndConds.areAccepted);

    function handleAccept() {
        if (termsAccepted) {
            TermsAndConds.accept();
        }
        handleClose();
    }

    function handleClose() {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('modal');
        router.replace(`${window.location.pathname}/?${params.toString()}`, { scroll: false });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(open) => {
                if (!open) {
                    handleClose();
                }
            }}
        >
            <DialogContent
                containerId="overlay-portal-container"
                position={DialogPosition.Center}
                isFixedPosition
                customWidth="w-full max-w-md md:max-w-2xl xl:max-w-[744px]"
            >
                <Header title="Terms & Conditions" onClose={handleClose} />
                <DialogBody>
                    <div className="flex flex-col gap-xl">
                        <div className="flex flex-col gap-md">
                            <span className="text-label-md text-names-neutral-70">
                                Effective Date: 4th of September
                            </span>
                            <div className="text-body-md text-names-neutral-92">
                                <TOS />
                            </div>
                        </div>
                        <div className="flex flex-row items-center justify-between">
                            <Checkbox
                                name="terms_conditions"
                                label="I have read, understand, and agree to the Terms of Service"
                                onCheckedChange={() => setTermsAccepted(true)}
                                isChecked={termsAccepted}
                            />
                            <Button
                                onClick={handleAccept}
                                type={ButtonType.Primary}
                                disabled={!termsAccepted}
                                text="Accept"
                            />
                        </div>
                    </div>
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
}
