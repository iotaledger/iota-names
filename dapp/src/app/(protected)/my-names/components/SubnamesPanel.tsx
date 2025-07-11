// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Card, CardBody, CardType, Header, Panel } from '@iota/apps-ui-kit';
import { useEffect, useMemo, useState } from 'react';

import { useNameTree } from '@/hooks/useNameTree';
import { RegistrationNft } from '@/lib/interfaces';
import { findInNameTree } from '@/lib/utils/buildNameTree';
import { addNameSuffix, getNameLabel } from '@/lib/utils/format/formatNames';

interface SubnamesPanelProps {
    selectedName: RegistrationNft;
    onClose: () => void;
}

export function SubnamesPanel({ selectedName, onClose }: SubnamesPanelProps) {
    const nftName = addNameSuffix(selectedName.name);
    const nameTree = useNameTree(nftName);

    const rootNode = useMemo(() => {
        if (!nameTree || !selectedName.name) return null;
        return findInNameTree(nameTree, selectedName.name);
    }, [nameTree, selectedName.name]);

    const [navigationStack, setNavigationStack] = useState<(typeof rootNode)[]>([]);

    useEffect(() => {
        if (rootNode) {
            setNavigationStack([rootNode]);
        }
    }, [rootNode]);

    const currentNode = navigationStack[navigationStack.length - 1];

    const goBack = () => {
        setNavigationStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    };

    const goDeeper = (childName: string) => {
        const child = currentNode?.subnames.find((n) => n.name === childName);
        if (child) {
            setNavigationStack((prev) => [...prev, child]);
        }
    };

    if (!currentNode) return null;

    const headerTitle = `Subnames for ${getNameLabel(navigationStack.length > 1 ? currentNode.name : selectedName.name)}`;
    const isOnRoot = navigationStack.length === 1;

    return (
        <div className="max-w-[360px] w-full">
            <Panel>
                <div className="w-full flex flex-row items-center justify-between">
                    <Header
                        onBack={isOnRoot ? undefined : goBack}
                        title={headerTitle}
                        onClose={onClose}
                    />
                </div>

                <div className="flex flex-col gap-xxs px-sm">
                    {currentNode.subnames.map((nft) => (
                        <Card
                            key={nft.name}
                            type={CardType.Filled}
                            onClick={() => goDeeper(nft.name)}
                        >
                            <CardBody title={nft.name} />
                        </Card>
                    ))}
                </div>
            </Panel>
        </div>
    );
}
