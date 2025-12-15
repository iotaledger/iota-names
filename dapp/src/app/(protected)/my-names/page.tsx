// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Add, Info, Refresh, Warning } from '@iota/apps-ui-icons';
import {
    Badge,
    BadgeType,
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
import { normalizeIotaName } from '@iota/iota-names-sdk';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { useAuctions } from '@/auctions';
import { groupUserAuctions, type AuctionCard } from '@/auctions/lib/utils/groupUserAuctions';
import { RenewSubnameDialog } from '@/components/dialogs/RenewSubameDialog';
import { ExtendedAuctionCard } from '@/components/name-card/ExtendedAuctionCard';
import { ExtendedNameCard } from '@/components/name-card/ExtendedNameCard';
import { CardSkeletonLoader } from '@/components/skeletons/CardSkeletonLoader';
import { useGetPublicName, useRefreshAuctions, useRegistrationNfts } from '@/hooks';
import { RegistrationNft } from '@/lib/interfaces';
import { useAvailabilityCheckDialog } from '@/stores/useAvailabilityCheckDialog';

import { SubnamesDialog } from './components/SubnamesDialog';
import { GroupedNamesFilter } from './filters';

export default function MyNamesPage(): JSX.Element {
    const { open } = useAvailabilityCheckDialog();
    const account = useCurrentAccount();

    const [selectedNameForRenewal, setSelectedNameForRenewal] = useState<RegistrationNft | null>(
        null,
    );
    const [rightPanelSelectedName, setRightPanelSelectedName] = useState<RegistrationNft | null>(
        null,
    );
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
    } = useAuctions({
        type: 'user',
        userAddress: account?.address,
        status: 'all',
    });

    const { isRefreshing, handleRefresh } = useRefreshAuctions(auctionDetails);

    const address = useCurrentAccount()?.address ?? '';
    const { data: publicName } = useGetPublicName(address);

    const isLoadingCards = isLoadingAuctions || isLoadingSubnames || isLoadingRegistrations;

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

    const totalItemsCount = filteredNames.length;

    const noCardToDisplay =
        !isLoadingCards &&
        filteredNames.length === 0 &&
        !isAuctionsErrored &&
        !isNamesErrored &&
        !isSubnamesErrored;

    const noAuctions = auctionDetails.every((auction) => auction.metadata === null);

    function handleFilterSelect(filter: GroupedNamesFilter): void {
        setSelectedFilter(filter);
        closePanel();
    }

    function isPublicName(name: RegistrationNft): boolean {
        return publicName ? publicName === name.name : false;
    }

    function handleNameRenewed(name: RegistrationNft): void {
        closePanel();
        toast.success(
            `${normalizeIotaName(name.name, 'at', {
                truncateLongParts: true,
            })} renewed successfully!`,
        );
    }

    function closePanel() {
        setRightPanelSelectedName(null);
    }

    return (
        <>
            <div className="flex flex-row gap-md items-center pt-[80px] md:pt-0 btn-alt-bg">
                <h2 className="text-headline-md text-names-neutral-92 font-bold leading-[120%] -tracking-[0.4px]">
                    My Names
                </h2>

                <div className="flex gap-sm">
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
                    {selectedFilter === GroupedNamesFilter.InAuction ||
                    selectedFilter === GroupedNamesFilter.All ? (
                        <Button
                            type={ButtonType.Outlined}
                            icon={
                                isRefreshing ? (
                                    <LoadingIndicator size="w-5 h-5" />
                                ) : (
                                    <Refresh className="w-5 h-5" />
                                )
                            }
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            testId="refresh-button"
                        />
                    ) : null}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-md">
                <SegmentedButton>
                    {Object.entries(GroupedNamesFilter).map(([key, value]) => (
                        <ButtonSegment
                            key={key}
                            type={ButtonSegmentType.Rounded}
                            label={value}
                            selected={selectedFilter === value}
                            onClick={() => handleFilterSelect(value)}
                            disabled={
                                (value === GroupedNamesFilter.InAuction && noAuctions) ||
                                (value === GroupedNamesFilter.Owned && !names?.length) ||
                                (value === GroupedNamesFilter.Subnames && !subnames?.length)
                            }
                        />
                    ))}
                </SegmentedButton>
                {!isLoadingCards && (
                    <p className="text-label-md whitespace-nowrap text-names-neutral-70 ml-2 sm:ml-0">
                        {totalItemsCount} Total
                    </p>
                )}
            </div>

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
                <div className="flex w-full justify-start">
                    <CardSkeletonLoader />
                </div>
            )}

            {((!isLoadingCards && filteredNames.length > 0) || rightPanelSelectedName) && (
                <div className="flex flex-row items-start justify-between gap-xl">
                    <div className="gap-lg w-full flex flex-row flex-wrap items-center justify-center sm:justify-start">
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
                                    onSubnameListClick={() => {
                                        setRightPanelSelectedName(nft);
                                    }}
                                    isActive={rightPanelSelectedName?.name === nft.name}
                                    badge={
                                        isPublicName(nft) ? (
                                            <Badge
                                                type={BadgeType.PrimarySolid}
                                                label="Public Name"
                                            />
                                        ) : null
                                    }
                                />
                            ),
                        )}
                    </div>

                    {rightPanelSelectedName && (
                        <>
                            <SubnamesDialog
                                selectedName={rightPanelSelectedName}
                                onClose={closePanel}
                                onRenewClick={(name) => setSelectedNameForRenewal(name)}
                            />
                        </>
                    )}
                </div>
            )}
            {selectedNameForRenewal && (
                <RenewSubnameDialog
                    name={selectedNameForRenewal.name}
                    setOpen={() => setSelectedNameForRenewal(null)}
                    onRenew={() => handleNameRenewed(selectedNameForRenewal)}
                />
            )}
        </>
    );
}
