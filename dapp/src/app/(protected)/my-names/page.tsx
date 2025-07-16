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
import { useState } from 'react';

import { useGetUserAuctions } from '@/auctions';
import { groupUserAuctions, type AuctionCard } from '@/auctions/lib/utils/groupUserAuctions';
import { ExtendedAuctionCard } from '@/components/name-card/ExtendedAuctionCard';
import { ExtendedNameCard } from '@/components/name-card/ExtendedNameCard';
import { useRegistrationNfts } from '@/hooks';
import { RegistrationNft } from '@/lib/interfaces';
import { useAvailabilityCheckDialog } from '@/stores/useAvailabilityCheckDialog';

import { SubnamesPanel } from './components/SubnamesPanel';
import { GroupedNamesFilter } from './filters';

export default function MyNamesPage(): JSX.Element {
    const { open } = useAvailabilityCheckDialog();
    const [selectedName, setSelectedName] = useState<RegistrationNft | null>(null);

    const [selectedFilter, setSelectedFilter] = useState<GroupedNamesFilter>(
        GroupedNamesFilter.All,
    );
    const {
        data: names,
        error: isNamesErrored,
        isLoading: isLoadingRegistrations,
    } = useRegistrationNfts('name');
    const {
        data: subnames,
        error: isSubnamesErrored,
        isLoading: isLoadingSubnames,
    } = useRegistrationNfts('subname');
    const {
        data: auctionDetails,
        error: isAuctionsErrored,
        isLoading: isLoadingAuctions,
    } = useGetUserAuctions();

    const isLoadingCards = isLoadingAuctions || isLoadingSubnames || isLoadingRegistrations;

    const account = useCurrentAccount();

    const groupedAuctions = groupUserAuctions(auctionDetails, account?.address ?? '');

    const filteredNames: (RegistrationNft | AuctionCard)[] = (() => {
        const auctionCards = groupedAuctions ?? [];
        const namesRegistrations = names ?? [];
        const subnamesRegistrations = subnames ?? [];

        switch (selectedFilter) {
            case GroupedNamesFilter.All:
                return [...namesRegistrations, ...subnamesRegistrations, ...auctionCards];
            case GroupedNamesFilter.InAuction:
                return auctionCards;
            case GroupedNamesFilter.Owned:
                return namesRegistrations;
            case GroupedNamesFilter.Subnames:
                return subnamesRegistrations;
            default:
                return namesRegistrations;
        }
    })();

    const noCardToDisplay =
        !isLoadingCards &&
        filteredNames.length === 0 &&
        !isAuctionsErrored &&
        !isNamesErrored &&
        !isSubnamesErrored;

    const noAuctions = !auctionDetails || auctionDetails.length === 0;

    function handleChipSelect(filter: GroupedNamesFilter): void {
        setSelectedFilter(filter);
        setSelectedName(null);
    }

    return (
        <>
            <div className="flex flex-row gap-md items-center">
                <h2 className="text-headline-md text-names-neutral-92 font-bold leading-[120%] -tracking-[0.4px]">
                    Names
                </h2>

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
            </div>

            <div className="flex">
                <SegmentedButton>
                    {Object.entries(GroupedNamesFilter).map(([key, value]) => (
                        <ButtonSegment
                            key={key}
                            type={ButtonSegmentType.Rounded}
                            label={value}
                            selected={selectedFilter === value}
                            onClick={() => handleChipSelect(value)}
                            disabled={
                                (value === GroupedNamesFilter.InAuction && noAuctions) ||
                                (value === GroupedNamesFilter.Owned && !names?.length) ||
                                (value === GroupedNamesFilter.Subnames && !subnames?.length)
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
                            supportingText={`You don't own any ${selectedFilter === GroupedNamesFilter.Subnames ? 'subnames' : 'names'} yet.`}
                            icon={<Info />}
                        />
                    </div>
                ) : null}

                {isLoadingCards && (
                    <div className="w-full flex-1 flex flex-col items-center justify-center">
                        <LoadingIndicator size="w-10 h-10" />
                    </div>
                )}

                {((!isLoadingCards && filteredNames.length > 0) || selectedName) && (
                    <div className="w-full flex flex-row items-start justify-between gap-xl">
                        {!isLoadingCards && filteredNames.length > 0 && (
                            <div className="flex flex-row gap-lg items-center flex-wrap w-full">
                                {filteredNames.map((nft) =>
                                    'details' in nft ? (
                                        <ExtendedAuctionCard
                                            key={nft.details.name}
                                            name={nft.details.name}
                                            auctionDetails={nft.details}
                                        />
                                    ) : (
                                        <ExtendedNameCard
                                            key={nft.name}
                                            nft={nft}
                                            onSubnameListClick={() => setSelectedName(nft)}
                                        />
                                    ),
                                )}
                            </div>
                        )}
                        {selectedName && (
                            <SubnamesPanel
                                selectedName={selectedName}
                                onClose={() => setSelectedName(null)}
                            />
                        )}
                    </div>
                )}
            </>
        </>
    );
}
