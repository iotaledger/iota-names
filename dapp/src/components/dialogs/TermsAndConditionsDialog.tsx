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
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { TermsAndConds } from '@/lib/utils/termsAndConditions';

export function TermsAndConditionsDialog() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const modalParam = searchParams.get('modal');
    const open = modalParam === 'terms_conditions';

    const [termsAccepted, setTermsAccepted] = useState(TermsAndConds.areTermsAndCondsAccepted);

    function handleAccept() {
        if (termsAccepted) {
            TermsAndConds.acceptTermsAndConds();
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
                                Effective Date: Lorem ipsum
                            </span>
                            <p className="text-body-md text-names-neutral-92">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas ac
                                aliquam neque, quis ullamcorper ipsum. Name ac purus a magna
                                ullamcorper venenatis ac eu nulla. Integer odio nunc, pretium sed
                                nibh non, dignissim mattis metus. Donec quis bibendum mi. Donec sed
                                tortor ullamcorper, tempus urna porta, sollicitudin nulla. Donec
                                mattis lectus non consectetur sollicitudin. Nunc vel erat sit amet
                                lectus condimentum fermentum. Vestibulum dapibus eros ut congue
                                consectetur. Integer laoreet, leo id hendrerit accumsan, nulla
                                mauris bibendum nisi, id hendrerit erat nunc porttitor erat.
                                Pellentesque vitae purus ac urna lacinia commodo. In quis nulla
                                dapibus, mattis metus ac, vulputate arcu. Vestibulum quis velit
                                risus. Name lacus nisi, lobortis ac tristique eget, viverra ut
                                libero. Nulla interdum, nibh at egestas fermentum, lorem lectus
                                consectetur felis, nec rutrum nibh arcu vel lorem. Proin id urna sit
                                amet odio luctus vulputate vestibulum ut diam.
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
