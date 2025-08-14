// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

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
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface TermsAndConditionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TermsAndConditionsDialog({ open, onOpenChange }: TermsAndConditionsDialogProps) {
    const [termsAccepted, setTermsAccepted] = useState(false);
    const router = useRouter();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                containerId="overlay-portal-container"
                position={DialogPosition.Center}
                isFixedPosition
                customWidth="w-full max-w-md md:max-w-2xl xl:max-w-[744px]"
            >
                <Header title="Terms & Conditions" onClose={() => onOpenChange(false)} />
                <DialogBody>
                    <div className="flex flex-col gap-xl">
                        <div className="flex flex-col gap-md">
                            <span className="text-label-md text-names-neutral-70">
                                Effective Date: [RELEASE DATE]
                            </span>
                            <p className="text-body-md text-names-neutral-92">
                                The IOTA Names Service does not collect, store, or process personal data. All interactions occur on a public blockchain. The Service does not use cookies, track users, or store IP addresses or off-chain identifiers.
                            </p>
                        </div>
                        <div className="flex flex-row items-center justify-between">
                            <Checkbox
                                name="terms_conditions"
                                label="I have read, understand, and agree to the Terms of Service"
                                onCheckedChange={() => setTermsAccepted(true)}
                                isChecked={termsAccepted}
                            />
                            <Button
                                onClick={() => router.push('/')}
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
