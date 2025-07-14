// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Add, MoreHoriz } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonType,
    Card,
    CardAction,
    CardActionType,
    CardImage,
    CardType,
    Header,
    ImageShape,
    ImageType,
    Panel,
} from '@iota/apps-ui-kit';
import { useMemo, useState } from 'react';

import { AvatarDisplay } from '@/components/name-record/AvatarDisplay';
import { useNameTree } from '@/hooks/useNameTree';
import { RegistrationNft } from '@/lib/interfaces';
import { NameTree } from '@/lib/utils/buildNameTree';
import { addNameSuffix, getNameLabel } from '@/lib/utils/format/formatNames';

interface SubnamesPanelProps {
    selectedName: RegistrationNft;
    onSubnameAddClick: (subname: string) => void;
    onClose: () => void;
}

export function SubnamesPanel({ selectedName, onSubnameAddClick, onClose }: SubnamesPanelProps) {
    const [nameTreePaths, setNameTreePaths] = useState<string[]>([]);
    const nameTree = useNameTree(addNameSuffix(selectedName.name));

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

    const isAtRoot = nameTreePaths.length === 0;
    const titleName = isAtRoot ? selectedName.name : currentTree.name;

    return (
        <Panel>
            <div className="w-full flex flex-row items-center justify-between">
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
                {currentTree.subnames.map((sub) => (
                    <Card
                        key={sub.name}
                        type={CardType.Default}
                        isHoverable
                        onClick={() => goDeeper(sub.name)}
                    >
                        <div className="flex flex-row items-center w-full gap-sm max-w-full">
                            <CardImage
                                type={ImageType.BgTransparent}
                                shape={ImageShape.SquareRounded}
                            >
                                <AvatarDisplay
                                    name={sub.name}
                                    size="full"
                                    fallbackUrl="/subname-card-fallback.png"
                                />
                            </CardImage>

                            <div className="min-w-0 text-title-md font-medium leading-[120%] tracking-[-0.15px] text-names-neutral-92 mr-auto break-words">
                                {getNameLabel(sub.name, { truncateLongSubnames: true })}
                            </div>

                            <CardAction
                                type={CardActionType.Button}
                                buttonType={ButtonType.Ghost}
                                icon={<MoreHoriz />}
                                onClick={() => {}}
                            />
                        </div>
                    </Card>
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
