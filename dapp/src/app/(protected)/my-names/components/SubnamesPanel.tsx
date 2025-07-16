// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Add } from '@iota/apps-ui-icons';
import { Button, ButtonType, Header, Panel } from '@iota/apps-ui-kit';
import { useEffect, useState } from 'react';

import { CreateSubnameDialog } from '@/components/dialogs/CreateSubnameDialog';
import { useRegistrationNfts } from '@/hooks';
import { useNameTree } from '@/hooks/useNameTree';
import { RegistrationNft } from '@/lib/interfaces';
import { formatNameLabel, normalizeName } from '@/lib/utils/format/formatNames';

import { NamePanelTile } from './NamePanelTile';

interface SubnamesPanelProps {
    selectedName: RegistrationNft;
    onClose: () => void;
}

export function SubnamesPanel({ selectedName, onClose }: SubnamesPanelProps) {
    const { data: subnames } = useRegistrationNfts('subname');

    const nftName = normalizeName(selectedName.name);
    const rootTree = useNameTree(nftName);

    const [navigationStack, setNavigationStack] = useState<(typeof rootTree)[]>([rootTree]);

    const [isAddNewSubnameDialogOpen, setIsAddNewSubnameDialogOpen] = useState(false);

    useEffect(() => {
        if (rootTree) {
            setNavigationStack([rootTree]);
        }
    }, [rootTree]);

    const currentTree = navigationStack[navigationStack.length - 1];

    function goDeeper(subname: string) {
        const child = currentTree?.subnames.find((n) => n.name === subname);
        if (child) {
            setNavigationStack((prev) => [...prev, child]);
        }
    }

    function goBack() {
        setNavigationStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }

    if (!currentTree) return null;

    const subnamesRegistrations = currentTree.subnames
        .map((subname) => (subnames ?? []).find((sub) => sub.name === subname.name))
        .filter((sub) => !!sub);

    const isAtRoot = navigationStack.length === 1;
    const nameInHeader = isAtRoot ? selectedName.name : currentTree.name;
    const headerTitle = `Subnames for ${formatNameLabel(nameInHeader, {
        onlyFirstSubname: true,
        truncateLongSubnames: true,
    })}`;

    return (
        <>
            <Panel>
                <div className="w-full flex flex-row items-center justify-between overflow-hidden rounded-[inherit]">
                    <Header
                        onBack={isAtRoot ? undefined : () => goBack()}
                        title={headerTitle}
                        onClose={onClose}
                    />
                </div>

                <div className="flex flex-col gap-xxs px-sm w-full">
                    {subnamesRegistrations.map((sub) => (
                        <NamePanelTile
                            key={sub.name}
                            registration={sub}
                            onClick={() => goDeeper(sub.name)}
                            hasSubnames={currentTree.subnames.length > 0}
                        />
                    ))}
                </div>

                <div className="flex flex-col items-center justify-center py-sm">
                    <Button
                        text="New Subname"
                        type={ButtonType.Outlined}
                        onClick={() => setIsAddNewSubnameDialogOpen(true)}
                        icon={<Add />}
                    />
                </div>
            </Panel>

            {isAddNewSubnameDialogOpen && (
                <CreateSubnameDialog
                    name={currentTree.name}
                    setOpen={setIsAddNewSubnameDialogOpen}
                />
            )}
        </>
    );
}
