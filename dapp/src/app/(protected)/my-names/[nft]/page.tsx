// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Close } from '@iota/apps-ui-icons';
import {
    Badge,
    BadgeType,
    ButtonUnstyled,
    Card,
    CardBody,
    CardType,
    LoadingIndicator,
    Panel,
    Title,
} from '@iota/apps-ui-kit';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BreadcrumbItem, Breadcrumbs } from '@/components/breadcrumb/Breadcrumb';
import { ExtendedNameCard } from '@/components/name-card/ExtendedNameCard';
import { useRegistrationNfts } from '@/hooks';
import { useNameTree } from '@/hooks/useNameTree';
import { MY_NAMES_ROUTE } from '@/lib/constants';
import { findInNameTree } from '@/lib/utils/buildNameTree';
import { addNameSuffix, normalizeNameInput } from '@/lib/utils/format/formatNames';

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
        if (!nameTree || !displayedSubname) return undefined;
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

    const displayedBreadcrumb: BreadcrumbItem | undefined = displayedSubname
        ? {
              label: `@${normalizeNameInput(displayedSubname)}`,
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
            <Breadcrumbs items={[NAMES_CRUMB, nftBreadcrumb, displayedBreadcrumb]} />

            <div className="flex flex-row gap-xl">
                <div className="flex flex-row gap-lg items-center flex-wrap w-full">
                    {nftSubnames.map(({ name, subnames: childSubnames }) => {
                        const subnameNft = subnames?.find(
                            (nft) => normalizeNameInput(nft.name) === normalizeNameInput(name),
                        );

                        const childSubnameRegistrations = childSubnames
                            .map((sub) => {
                                const subnameNft = subnames?.find(
                                    (nft) =>
                                        normalizeNameInput(nft.name) ===
                                        normalizeNameInput(sub.name),
                                );
                                return subnameNft;
                            })
                            .filter((nft) => nft !== undefined);

                        if (!subnameNft) {
                            return null;
                        }

                        return (
                            <ExtendedNameCard
                                key={name}
                                nft={subnameNft}
                                ownedSubnames={childSubnameRegistrations}
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

                {subnameListPanel ? (
                    <div className="max-w-[360px] w-full">
                        <Panel>
                            <div className="w-full flex flex-row items-center justify-between pr-md--rs">
                                <Title title={`Subnames for ${nftName}`} />
                                <ButtonUnstyled
                                    className="text-names-neutral-70 hover:text-names-neutral-92"
                                    onClick={() => {
                                        setDisplayedSubname(undefined);
                                    }}
                                >
                                    <Close />
                                </ButtonUnstyled>
                            </div>
                            <div className="flex flex-col gap-lg px-md">
                                {subnameListPanel.subnames.map((nft) => (
                                    <Card key={nft.name} type={CardType.Filled}>
                                        <CardBody title={nft.name} />
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
