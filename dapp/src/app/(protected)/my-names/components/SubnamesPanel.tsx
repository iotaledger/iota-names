// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Add, MoreHoriz } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonType,
    Card,
    CardAction,
    CardActionType,
    CardBody,
    CardImage,
    CardType,
    Header,
    ImageShape,
    ImageType,
    Panel,
} from '@iota/apps-ui-kit';
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
                            type={CardType.Default}
                            isHoverable
                            onClick={() => goDeeper(nft.name)}
                        >
                            <CardImage
                                type={ImageType.BgTransparent}
                                shape={ImageShape.SquareRounded}
                            >
                                <div className="flex w-full h-full items-center justify-center bg-black rounded-lg">
                                    <PlaceholderSvg />
                                </div>
                            </CardImage>
                            <CardBody title={nft.name} />
                            <CardAction
                                type={CardActionType.Button}
                                buttonType={ButtonType.Ghost}
                                icon={<MoreHoriz />}
                                onClick={() => {}}
                            />
                        </Card>
                    ))}
                </div>
                <div className="flex flex-col items-center justify-center py-sm">
                    <div>
                        <Button
                            text="New Subname"
                            type={ButtonType.Outlined}
                            onClick={() => {}}
                            icon={<Add />}
                        />
                    </div>
                </div>
            </Panel>
        </div>
    );
}

function PlaceholderSvg() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
        >
            <path
                d="M14.8714 7.52631C15.0698 7.52631 15.2308 7.68743 15.2308 7.88617V12.3275C15.2308 12.4227 15.1929 12.5143 15.1254 12.5819L9.82064 17.8945C9.75316 17.962 9.66172 18 9.56631 18H5.13124C4.93278 18 4.77189 17.8388 4.77189 17.6401V13.1987C4.77189 13.1032 4.80979 13.0117 4.87727 12.9441L10.2874 7.52631H14.8714Z"
                fill="url(#paint0_linear_11465_1911)"
            />
            <path
                d="M9.928 2C10.1265 2 10.2874 2.16112 10.2874 2.35986V7.52598H5.12858C4.93012 7.52597 4.76923 7.36483 4.76923 7.16609V2.35986C4.76923 2.16113 4.93012 2.00001 5.12858 2H9.928Z"
                fill="url(#paint1_linear_11465_1911)"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_11465_1911"
                    x1="13.6154"
                    y1="6.69231"
                    x2="2.1042"
                    y2="13.4304"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="#D34BFF" />
                    <stop offset="0.288525" stop-color="#278FFF" />
                    <stop offset="0.673162" stop-color="#14F0D6" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_11465_1911"
                    x1="13.6154"
                    y1="6.69231"
                    x2="2.1042"
                    y2="13.4304"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="#D34BFF" />
                    <stop offset="0.288525" stop-color="#278FFF" />
                    <stop offset="0.673162" stop-color="#14F0D6" />
                </linearGradient>
            </defs>
        </svg>
    );
}
