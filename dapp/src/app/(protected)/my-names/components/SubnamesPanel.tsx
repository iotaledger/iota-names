// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Add } from '@iota/apps-ui-icons';
import { Button, ButtonType, Header, Panel } from '@iota/apps-ui-kit';
import { useMemo, useState } from 'react';

import { useRegistrationNfts } from '@/hooks';
import { useNameTree } from '@/hooks/useNameTree';
import { RegistrationNft } from '@/lib/interfaces';
import { NameTree } from '@/lib/utils/buildNameTree';
import { addNameSuffix, getNameLabel } from '@/lib/utils/format/formatNames';

import { NamePanelTile } from './NamePanelTile';

interface SubnamesPanelProps {
    selectedName: RegistrationNft;
    onSubnameAddClick: (subname: string) => void;
    onClose: () => void;
}

export function SubnamesPanel({ selectedName, onSubnameAddClick, onClose }: SubnamesPanelProps) {
    const [nameTreePaths, setNameTreePaths] = useState<string[]>([]);
    const nameTree = useNameTree(addNameSuffix(selectedName.name));
    const { data: subnames } = useRegistrationNfts('subname');

    const currentTree = useMemo(
        () => traverseNameTree(nameTree, nameTreePaths),
        [nameTree, selectedName.name, nameTreePaths],
    );

    function goDeeper(subname: string) {
        setNameTreePaths((p) => [...p, subname]);
    }

    function goBack() {
        setNameTreePaths((p) => p.slice(0, -1));
    }

    if (!currentTree) return null;

    const subnamesRegistrations = currentTree.subnames
        .map((subname) => (subnames ?? []).find((sub) => sub.name === subname.name))
        .filter((sub) => !!sub);
    const isAtRoot = nameTreePaths.length === 0;
    const titleName = isAtRoot ? selectedName.name : currentTree.name;

    return (
        <Panel>
            <div className="w-full flex flex-row items-center justify-between overflow-hidden rounded-[inherit]">
                <Header
                    onBack={isAtRoot ? undefined : () => goBack()}
                    title={`Subnames for ${getNameLabel(titleName, {
                        onlyFirstSubname: true,
                        truncateLongSubnames: true,
                    })}`}
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
                    onClick={() => onSubnameAddClick(currentTree.name)}
                    icon={<Add />}
                />
            </div>
        </Panel>
    );
}

function traverseNameTree(nameTree: NameTree | null, paths: string[]) {
    if (!nameTree) return null;
    let currentNameTree: NameTree | null = nameTree;

    for (const subname of paths) {
        if (!currentNameTree) break;
        currentNameTree = currentNameTree.subnames.find((child) => child.name === subname) || null;
    }
    return currentNameTree;
}
