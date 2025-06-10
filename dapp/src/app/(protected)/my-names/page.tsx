// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Button, KeyValueInfo, Title } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { AvailabilityCheck } from '@/components';
import { useAddSubname, useRegistrationNfts } from '@/hooks';

function MyNamesPage(): JSX.Element {
    const registrationNfts = useRegistrationNfts();
    const isDisabled = false;
    const [selectedSubname, setSelectedSubname] = useState<string | null>(null);
    const { data: addSubnameData, refetch: refetchAddSubname } = useAddSubname(
        selectedSubname || '',
    );

    const handleAddSubname = (subname: string): void => {
        // Actualizar el estado con el subnombre seleccionado
        console.log('1', subname);
        setSelectedSubname(subname);
        console.log('2', selectedSubname);
        console.log('3', addSubnameData);
        // Refetch para ejecutar la lógica del hook
        refetchAddSubname()
            .then((result) => console.log('Subname added successfully:', result))
            .catch((error) => console.error('Error adding subname:', error));
    };
    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>
            <div className="flex flex-col gap-x-sm items-center">
                {registrationNfts?.map((nameRecord) => (
                    <div
                        key={nameRecord.name}
                        className="flex flex-row gap-x-lg items-center w-full"
                    >
                        <KeyValueInfo
                            keyText={nameRecord.name}
                            value={nameRecord?.description ?? ''}
                            fullwidth
                        />
                        <Button
                            text="Add subname"
                            onClick={() => handleAddSubname(nameRecord.name)}
                            disabled={isDisabled}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MyNamesPage;
