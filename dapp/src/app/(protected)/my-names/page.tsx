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
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useGetUserAuctions } from '@/auctions';
import { groupUserAuctions, type AuctionCard } from '@/auctions/lib/utils/groupUserAuctions';
import { Breadcrumbs } from '@/components/breadcrumb/Breadcrumb';
import { ExtendedAuctionCard } from '@/components/name-card/ExtendedAuctionCard';
import { ExtendedNameCard } from '@/components/name-card/ExtendedNameCard';
import { useRegistrationNfts } from '@/hooks';
import { MY_NAMES_ROUTE } from '@/lib/constants';
import { RegistrationNft } from '@/lib/interfaces';
import { normalizeNameInput } from '@/lib/utils/format/formatNames';
import { useAvailabilityCheckDialog } from '@/stores/useAvailabilityCheckDialog';

import { NAMES_CRUMB } from './constants';
import { GroupedNamesFilter } from './filters';

export default function MyNamesPage(): JSX.Element {
    const { open } = useAvailabilityCheckDialog();
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
    const account = useCurrentAccount();

    const groupedAuctions = groupUserAuctions(auctionDetails, account?.address ?? '');

    const filteredNames: (RegistrationNft | AuctionCard)[] = (() => {
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
    })();

    const noCardToDisplay =
        !isLoadingCards && filteredNames.length === 0 && !isAuctionsErrored && !isNamesErrored;
    const noAuctions = !auctionDetails || auctionDetails.length === 0;

    function handleSubnameListClick(name: string): void {
        router.push(MY_NAMES_ROUTE.path + `/${normalizeNameInput(name)}`);
    }

    return (
        <>
            <Breadcrumbs
                items={[{ ...NAMES_CRUMB, isActive: true }]}
                trailingElement={
                    <Button
                        type={ButtonType.Outlined}
                        text="Name"
                        icon={<Add />}
                        onClick={() =>
                            open({
                                autoFocusInput: true,
                            })
                        }
                    />
                }
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
                            disabled={
                                (value === GroupedNamesFilter.InAuction && noAuctions) ||
                                (value === GroupedNamesFilter.Owned && !names?.length)
                            }
                        />
                    ))}
                </SegmentedButton>
            </div>

            <>
                {selectedFilter === GroupedNamesFilter.InAuction && !isLoadingAuctions ? (
                    isAuctionsErrored || noAuctions ? (
                        <div className="flex">
                            <InfoBox
                                style={InfoBoxStyle.Elevated}
                                type={isAuctionsErrored ? InfoBoxType.Error : InfoBoxType.Default}
                                supportingText={
                                    isAuctionsErrored
                                        ? 'Failed to load auctions. Please try again later.'
                                        : "You haven't participated in any auctions yet."
                                }
                                icon={isAuctionsErrored ? <Warning /> : <Info />}
                            />
                        </div>
                    ) : null
                ) : noCardToDisplay ? (
                    <div className="flex">
                        <InfoBox
                            style={InfoBoxStyle.Elevated}
                            type={InfoBoxType.Default}
                            supportingText="You don't own any names yet."
                            icon={<Info />}
                        />
                    </div>
                ) : null}

                {isLoadingCards && (
                    <div className="w-full flex-1 flex flex-col items-center justify-center">
                        <LoadingIndicator size="w-10 h-10" />
                    </div>
                )}

                {!isLoadingCards && filteredNames.length > 0 && (
                    <div className="flex flex-row gap-lg items-center flex-wrap w-full">
                        {filteredNames.map((nft) =>
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
                )}
            </>
        </>
    );
}

function isAuctionCard(name: RegistrationNft | AuctionCard): name is AuctionCard {
    return 'details' in name && 'status' in name;
}
