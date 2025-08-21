// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Add } from '@iota/apps-ui-icons';
import { Button, ButtonType, Header, Panel } from '@iota/apps-ui-kit';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import { useEffect, useMemo, useState } from 'react';

import { CreateSubnameDialog } from '@/components/dialogs/CreateSubnameDialog';
import { NameRecordData, useNameRecord, useRegistrationNfts } from '@/hooks';
import { useNameTree } from '@/hooks/useNameTree';
import { RegistrationNft } from '@/lib/interfaces';
import { traverseNameTree } from '@/lib/utils/buildNameTree';
import { getNamePermissions } from '@/lib/utils/names';

import { NamePanelTile } from './NamePanelTile';

interface SubnamesPanelProps {
    selectedName: RegistrationNft;
    onClose: () => void;
}

export function SubnamesPanel({ selectedName, onClose }: SubnamesPanelProps) {
    const { data: subnames } = useRegistrationNfts('subname');

    const initialNameTree = useNameTree(selectedName.name);

    const [namePaths, setNamePaths] = useState<string[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const isAtRoot = namePaths.length === 1;
    const { data: nameRecordData } = useNameRecord(selectedName.name);
    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;
    const namePermissions = nameRecord
        ? getNamePermissions(nameRecord.nameRecord)
        : { allowChildCreation: true, allowTimeExtension: true };

    const currentNode = useMemo(
        () => traverseNameTree(initialNameTree, namePaths),
        [initialNameTree, namePaths],
    );

    useEffect(() => {
        if (initialNameTree) {
            const isNewRoot = namePaths[0] !== initialNameTree.name;
            // Reset name paths only if the initial name has changed
            if (!namePaths.length || isNewRoot) {
                setNamePaths([initialNameTree.name]);
            }
        }
    }, [initialNameTree]);

    if (!currentNode) return null;

    const headerTitle = `Subnames for ${normalizeIotaName(
        isAtRoot ? selectedName.name : currentNode.name,
        'at',
        { onlyFirstSubname: true, truncateLongParts: true },
    )}`;

    const subnamesRegistrations = currentNode.subnames
        .map((sub) => subnames?.find((s) => s.name === sub.name))
        .filter((sub) => !!sub);

    function goDeeper(name: string) {
        setNamePaths((prev) => [...prev, name]);
    }

    function goBack() {
        setNamePaths((prev) => prev.slice(0, -1));
    }

    return (
        <>
            <Panel>
                <div className="rounded-[inherit] w-full h-full overflow-hidden">
                    <Header
                        onBack={isAtRoot ? undefined : goBack}
                        title={headerTitle}
                        onClose={onClose}
                    />

                    <div className="flex flex-col gap-xxs px-sm w-full">
                        {subnamesRegistrations.map((sub) => (
                            <NamePanelTile
                                key={sub.name}
                                registration={sub}
                                onClick={() => goDeeper(sub.name)}
                                hasSubnames={currentNode.subnames.length > 0}
                            />
                        ))}
                    </div>
                    {namePermissions.allowChildCreation && (
                        <div className="flex flex-col items-center justify-center py-sm">
                            <Button
                                text="New Subname"
                                type={ButtonType.Outlined}
                                onClick={() => setIsAddDialogOpen(true)}
                                icon={<Add />}
                            />
                        </div>
                    )}
                </div>
            </Panel>

            {isAddDialogOpen && (
                <CreateSubnameDialog name={currentNode.name} setOpen={setIsAddDialogOpen} />
            )}
        </>
    );
}
