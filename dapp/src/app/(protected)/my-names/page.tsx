// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Add, Info, Warning } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonSegment,
    ButtonSegmentType,
    ButtonType,
    InfoBox,
    InfoBoxStyle,
    InfoBoxType,
    LoadingIndicator,
    SegmentedButton,
} from '@iota/apps-ui-kit';
import { useCurrentAccount } from '@iota/dapp-kit';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useGetUserAuctions } from '@/auctions';
import { groupUserAuctions, type AuctionCard } from '@/auctions/lib/utils/groupUserAuctions';
import { Breadcrumbs } from '@/components/breadcrumb/Breadcrumb';
import { ExtendedAuctionCard } from '@/components/name-card/ExtendedAuctionCard';
import { ExtendedNameCard } from '@/components/name-card/ExtendedNameCard';
import { useRegistrationNfts } from '@/hooks';
import { MY_NAMES_ROUTE } from '@/lib/constants';
import { RegistrationNft } from '@/lib/interfaces';
import { normalizeNameInput } from '@/lib/utils/format/formatNames';

import { NAMES_CRUMB } from './constants';
import { GroupedNamesFilter } from './filters';

export default function MyNamesPage(): JSX.Element {
    const [selectedFilter, setSelectedFilter] = useState<GroupedNamesFilter>(
        GroupedNamesFilter.All,
    );
    const {
        data: names,
        error: isNamesErrored,
        isLoading: isLoadingRegistrations,
    } = useRegistrationNfts('name');
    const {
        data: auctionDetails,
        error: isAuctionsErrored,
        isLoading: isLoadingAuctions,
    } = useGetUserAuctions();

    const isLoadingCards = isLoadingAuctions || isLoadingRegistrations;

    const router = useRouter();
    const pathname = usePathname();
    const account = useCurrentAccount();

    const groupedAuctions = groupUserAuctions(auctionDetails, account?.address ?? '');

    const filteredNames: (RegistrationNft | AuctionCard)[] = useMemo(() => {
        const inAuction = groupedAuctions ?? [];
        const owned = names ?? [];

        switch (selectedFilter) {
            case GroupedNamesFilter.All:
                return [...owned, ...inAuction];
            case GroupedNamesFilter.InAuction:
                return inAuction;
            case GroupedNamesFilter.Owned:
                return owned;
            default:
                return owned;
        }
    }, [auctionDetails, names, selectedFilter]);

    const noCardToDisplay =
        !isLoadingCards && filteredNames.length === 0 && !isAuctionsErrored && !isNamesErrored;

    function handleSubnameListClick(name: string): void {
        router.push(MY_NAMES_ROUTE.path + `/${normalizeNameInput(name)}`);
    }

    return (
        <>
            <Breadcrumbs
                items={[{ ...NAMES_CRUMB, isActive: pathname === NAMES_CRUMB.path }]}
                trailingElement={<Button type={ButtonType.Outlined} text="Name" icon={<Add />} />}
            />

            <div className="flex">
                <SegmentedButton>
                    {Object.entries(GroupedNamesFilter).map(([key, value]) => (
                        <ButtonSegment
                            key={key}
                            type={ButtonSegmentType.Rounded}
                            label={value}
                            selected={selectedFilter === value}
                            onClick={() => setSelectedFilter(value)}
                        />
                    ))}
                </SegmentedButton>
            </div>

            <div className="flex-1 flex flex-row gap-lg items-center flex-wrap w-full">
                {selectedFilter === GroupedNamesFilter.InAuction && !isLoadingAuctions ? (
                    isAuctionsErrored ? (
                        <InfoBox
                            style={InfoBoxStyle.Elevated}
                            type={InfoBoxType.Error}
                            supportingText="Failed to load auctions. Please try again later."
                            icon={<Warning />}
                        />
                    ) : !auctionDetails || auctionDetails.length === 0 ? (
                        <InfoBox
                            style={InfoBoxStyle.Elevated}
                            type={InfoBoxType.Default}
                            supportingText="You haven't participated in any auctions yet."
                            icon={<Info />}
                        />
                    ) : null
                ) : noCardToDisplay ? (
                    <InfoBox
                        style={InfoBoxStyle.Elevated}
                        type={InfoBoxType.Default}
                        supportingText="You don't own any names yet."
                        icon={<Info />}
                    />
                ) : null}

                {isLoadingCards && (
                    <div className="w-full flex-1 flex flex-col items-center justify-center">
                        <LoadingIndicator size="w-10 h-10" />
                    </div>
                )}

                {!isLoadingCards &&
                    filteredNames.map((nft) =>
                        isAuctionCard(nft) ? (
                            <ExtendedAuctionCard
                                key={nft.details.name}
                                name={nft.details.name}
                                auctionDetails={nft.details}
                            />
                        ) : (
                            <ExtendedNameCard
                                key={nft.name}
                                nft={nft}
                                onSubnameListClick={() => handleSubnameListClick(nft.name)}
                            />
                        ),
                    )}
            </div>
        </>
    );
}

function isAuctionCard(name: RegistrationNft | AuctionCard): name is AuctionCard {
    return 'details' in name && 'status' in name;
}
