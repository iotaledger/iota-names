// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Title } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { AvailabilityCheck } from '@/components';
import { NameDisplayCard } from '@/components/cards/NameDisplayCard';
import { AvatarSelectDialog } from '@/components/dialogs/AvatarSelectDialog';
import { useRegistrationNfts } from '@/hooks';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

export default function MyNamesPage(): JSX.Element {
    const registrationNfts = useRegistrationNfts();
    const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
    const [selectedNameRegistration, setSelectedNameRegistration] =
        useState<RegistrationNft | null>(null);

    function handleUpdateDisplayClick(registration: RegistrationNft) {
        setSelectedNameRegistration(registration);
        setIsAvatarSelectorOpen(true);
    }

    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-md">
                {registrationNfts?.map((nameRecord) => (
                    <NameDisplayCard
                        key={nameRecord.image_url}
                        registration={nameRecord}
                        onUpdateDisplayClick={() => handleUpdateDisplayClick(nameRecord)}
                    />
                ))}

                {selectedNameRegistration && (
                    <AvatarSelectDialog
                        open={isAvatarSelectorOpen}
                        setOpen={setIsAvatarSelectorOpen}
                        registration={selectedNameRegistration}
                    />
                )}
            </div>
        </div>
    );
}
