// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { MoreHoriz } from '@iota/apps-ui-icons';
import {
    Badge,
    BadgeType,
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
    LoadingIndicator,
    Panel,
} from '@iota/apps-ui-kit';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BreadcrumbItem, Breadcrumbs } from '@/components/breadcrumb/Breadcrumb';
import { ExtendedNameCard } from '@/components/name-card/ExtendedNameCard';
import { useRegistrationNfts } from '@/hooks';
import { useNameTree } from '@/hooks/useNameTree';
import { MY_NAMES_ROUTE } from '@/lib/constants';
import { findInNameTree } from '@/lib/utils/buildNameTree';
import { addNameSuffix, getNameLabel, normalizeNameInput } from '@/lib/utils/format/formatNames';

import { NAMES_CRUMB } from '../constants';

interface PageParams {
    nft: string;
}

export default function NftSubnamesPage({
    params,
}: {
    params: PageParams;
}): React.JSX.Element | null {
    const [displayedSubname, setDisplayedSubname] = useState<string | undefined>();

    const { data: subnames, isLoading: isLoadingSubnames } = useRegistrationNfts('subname');

    const nftName = addNameSuffix(params.nft);
    const nameTree = useNameTree(nftName);

    const router = useRouter();

    const nftSubnames = nameTree?.subnames;

    const subnameListPanel = useMemo(() => {
        if (!nameTree || !displayedSubname) return null;
        return findInNameTree(nameTree, displayedSubname);
    }, [nameTree, displayedSubname]);

    const pathname = usePathname();

    const nftBreadcrumb: BreadcrumbItem | undefined = nameTree
        ? {
              label: `@${normalizeNameInput(nftName)}`,
              path: pathname,
              isActive: displayedSubname ? false : true,
              onClick: () => displayedSubname && setDisplayedSubname(undefined),
          }
        : undefined;

    const subnamesBreadcrumb: BreadcrumbItem | undefined = displayedSubname
        ? {
              label: `${getNameLabel(displayedSubname)}`,
              path: pathname,
              isActive: true,
          }
        : undefined;

    useEffect(() => {
        if (!isLoadingSubnames && !nftSubnames?.length) {
            router.push(MY_NAMES_ROUTE.path);
            return;
        }
    }, [isLoadingSubnames, router, nftSubnames]);

    if (isLoadingSubnames && isLoadingSubnames) {
        return <LoadingIndicator />;
    }

    return nftSubnames && nftSubnames.length > 0 ? (
        <>
            <Breadcrumbs items={[NAMES_CRUMB, nftBreadcrumb, subnamesBreadcrumb]} />

            <div className="flex flex-row gap-xl">
                <div className="flex flex-row gap-lg items-center flex-wrap w-full">
                    {nftSubnames.map(({ name }) => {
                        const subnameNft = subnames?.find(
                            (nft) => normalizeNameInput(nft.name) === normalizeNameInput(name),
                        );

                        if (!subnameNft) {
                            return null;
                        }

                        return (
                            <ExtendedNameCard
                                key={name}
                                nft={subnameNft}
                                badge={
                                    displayedSubname === name ? (
                                        <Badge type={BadgeType.PrimarySolid} label="Displayed" />
                                    ) : undefined
                                }
                                onSubnameListClick={() => {
                                    setDisplayedSubname(name);
                                }}
                            />
                        );
                    })}
                </div>

                {subnameListPanel && displayedSubname ? (
                    <div className="max-w-[360px] w-full">
                        <Panel bgColor="bg-names-neutral-6">
                            <Header
                                title={`Subnames for ${getNameLabel(displayedSubname)}`}
                                onClose={() => {
                                    setDisplayedSubname(undefined);
                                }}
                            />
                            <div className="flex flex-col gap-xxs px-sm">
                                {subnameListPanel.subnames.map((nft) => (
                                    <Card
                                        key={nft.name}
                                        type={CardType.Default}
                                        isHoverable
                                        onClick={() => {}}
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
                        </Panel>
                    </div>
                ) : null}
            </div>
        </>
    ) : null;
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
