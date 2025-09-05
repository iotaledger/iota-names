// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Add } from '@iota/apps-ui-icons';
import { Button, ButtonType, Header, Panel } from '@iota/apps-ui-kit';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import { useEffect, useMemo, useState } from 'react';

import { CreateSubnameDialog } from '@/components/dialogs/CreateSubnameDialog';
import { useNameRecord, useRegistrationNfts } from '@/hooks';
import { useNameTree } from '@/hooks/useNameTree';
import { RegistrationNft } from '@/lib/interfaces';
import { traverseNameTree } from '@/lib/utils/buildNameTree';
import { getNamePermissions, isNameRecordExpired } from '@/lib/utils/names';

import { NamePanelTile } from './NamePanelTile';

interface SubnamesPanelProps {
    selectedName: RegistrationNft;
    onClose: () => void;
    onRenewClick: (name: RegistrationNft) => void;
}

export function SubnamesPanel({ selectedName, onClose, onRenewClick }: SubnamesPanelProps) {
    const { data: subnames } = useRegistrationNfts('subname');

    const initialNameTree = useNameTree(selectedName.name);

    const [namePaths, setNamePaths] = useState<string[]>([]);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const isAtRoot = namePaths.length === 1;

    const currentNode = useMemo(
        () => traverseNameTree(initialNameTree, namePaths),
        [initialNameTree, namePaths],
    );
    const { data: nameRecord } = useNameRecord(currentNode?.name ?? '');
    const nameRecordData = nameRecord?.type === 'unavailable' ? nameRecord.nameRecord : null;

    useEffect(() => {
        if (initialNameTree) {
            const isNewRoot = namePaths[0] !== initialNameTree.name;
            // Reset name paths only if the initial name has changed
            if (!namePaths.length || isNewRoot) {
                setNamePaths([initialNameTree.name]);
            }
        }
    }, [initialNameTree]);

    const namePermissions = nameRecordData
        ? getNamePermissions(nameRecordData)
        : { allowChildCreation: true, allowTimeExtension: true };

    if (!currentNode) return null;

    const isExpired = nameRecordData ? isNameRecordExpired(nameRecordData) : false;

    const headerTitle = `Subnames for ${normalizeIotaName(
        isAtRoot ? selectedName.name : currentNode.name,
        'at',
        {
            onlyFirstSubname: !isAtRoot,
            truncateLongParts: true,
        },
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
                <div className="overflow-hidden rounded-[inherit] min-h-[50vh] md:min-h-full max-h-[90vh] md:max-h-[80vh] w-full flex flex-col">
                    <div className="[&_.header-bg-color_>.flex-grow]:overflow-hidden [&_.header-bg-color_>.flex-grow_*]:break-words">
                        <Header
                            onBack={isAtRoot ? undefined : goBack}
                            title={headerTitle}
                            onClose={onClose}
                        />
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                        <div className="flex flex-col gap-xxs px-sm w-full">
                            {subnamesRegistrations.map((sub) => (
                                <NamePanelTile
                                    key={sub.name}
                                    registration={sub}
                                    onClick={() => goDeeper(sub.name)}
                                    hasSubnames={currentNode.subnames.length > 0}
                                    onRenewClick={() => onRenewClick(sub)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-center justify-center py-sm">
                        <Button
                            text="New Subname"
                            type={ButtonType.Outlined}
                            onClick={() => setIsAddDialogOpen(true)}
                            icon={<Add />}
                            disabled={isExpired || !namePermissions.allowChildCreation}
                        />
                    </div>
                </div>
            </Panel>

            {isAddDialogOpen && (
                <CreateSubnameDialog name={currentNode.name} setOpen={setIsAddDialogOpen} />
            )}
        </>
    );
}
