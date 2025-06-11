// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Button, Title } from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';

import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

import { NameRecordDisplay } from '../name-record/NameRecordDisplay';

interface NameDisplayCardProps {
    registration: RegistrationNft;
    onUpdateDisplayClick?: () => void;
}

export function NameDisplayCard({
    registration,
    onUpdateDisplayClick,
}: NameDisplayCardProps): React.JSX.Element {
    const ownerAddress = useCurrentAccount()?.address ?? '';

    const canChangeAvatar =
        registration.expiration_timestamp_ms && registration.expiration_timestamp_ms > Date.now();

    return (
        <div className="flex flex-col gap-xs items-center outline outline-1 outline-primary-80 rounded-lg">
            <NameRecordDisplay registration={registration} ownerAddress={ownerAddress} />

            <div>
                <Title title={registration.name} />
                {canChangeAvatar && <Button text="Update Avatar" onClick={onUpdateDisplayClick} />}
            </div>
        </div>
    );
}
