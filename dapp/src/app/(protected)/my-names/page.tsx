// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Settings } from '@iota/apps-ui-icons';
import { Badge, BadgeType, Button, ButtonType, Title } from '@iota/apps-ui-kit';
import { useState } from 'react';

import { UserAuctions } from '@/auctions/components/UserAuctions';
import { AvailabilityCheck } from '@/components';
import { UpdateNameDialog } from '@/components/dialogs/UpdateNameDialog';
import { NameCard } from '@/components/name-card/NameCard';
import { NameCardBody } from '@/components/name-card/NameCardBody';
import { SubnameCountIndicator } from '@/components/name-card/NameCardBodyIndicators';
import { RegistrationNft, useRegistrationNfts } from '@/hooks';
import { MenuListItem } from '@/lib/types/components';
import { removeSuffixFromName, splitNameInParts } from '@/lib/utils/format/formatNames';

export default function MyNamesPage(): JSX.Element {
    const [updateNameDialog, setUpdateNameDialog] = useState<string | null>(null);

    const { data: domains } = useRegistrationNfts('domain');
    const { data: subdomains } = useRegistrationNfts('subdomain');

    const renderMenuOptions = (nft: RegistrationNft): MenuListItem[] => [
        {
            onClick: () => setUpdateNameDialog(nft.name),
            children: (
                <div className="flex flex-row gap-xxs">
                    <Settings /> Manage
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-col w-full gap-y-lg items-center">
            <AvailabilityCheck />
            {updateNameDialog ? (
                <UpdateNameDialog
                    name={updateNameDialog}
                    open
                    setOpen={() => setUpdateNameDialog(null)}
                />
            ) : null}
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>

            <div className="flex flex-row gap-sm items-stretch justify-center flex-wrap w-full">
                {domains?.map((nft) => {
                    const name = removeSuffixFromName(nft.name);

                    const subnames = subdomains?.filter((sub) => {
                        return sub.name !== nft.name && sub.name.endsWith(nft.name);
                    });

                    return (
                        <NameCard
                            key={nft.name}
                            name={name}
                            expiration={nft.expiration_timestamp_ms}
                            badge={<Badge type={BadgeType.PrimarySoft} label="Placeholder" />}
                            menuOptions={renderMenuOptions(nft)}
                        >
                            <NameCardBody title={`@${name}`}>
                                <SubnameCountIndicator
                                    subnameCount={subnames?.length ?? 0}
                                    onSubnameListClick={() => {}}
                                />

                                <Button
                                    text="Placeholder"
                                    type={ButtonType.Secondary}
                                    onClick={() => {}}
                                />
                            </NameCardBody>
                        </NameCard>
                    );
                })}
            </div>
            <div className="pt-md">
                <Title title="My subnames" />
            </div>
            {subdomains?.length ? (
                <div className="flex flex-row gap-sm items-stretch justify-center flex-wrap w-full">
                    {subdomains.map((subdomain) => {
                        const { namePart, subnamePart } = splitNameInParts(subdomain.name);
                        const name = removeSuffixFromName(namePart);

                        const subnames = subdomains.filter(
                            (sub) =>
                                sub.name !== subdomain.name && sub.name.endsWith(subdomain.name),
                        );

                        return (
                            <NameCard
                                key={subdomain.name}
                                name={name}
                                subname={subnamePart}
                                expiration={subdomain.expiration_timestamp_ms}
                                badge={<Badge type={BadgeType.PrimarySoft} label="Placeholder" />}
                                menuOptions={renderMenuOptions(subdomain)}
                            >
                                <NameCardBody title={`${subnamePart}@${name}`}>
                                    <SubnameCountIndicator
                                        subnameCount={subnames.length}
                                        onSubnameListClick={() => {}}
                                    />

                                    <Button
                                        text="Placeholder"
                                        type={ButtonType.Secondary}
                                        onClick={() => {}}
                                    />
                                </NameCardBody>
                            </NameCard>
                        );
                    })}
                </div>
            ) : null}
            <div className="pt-md w-full">
                <UserAuctions />
            </div>
        </div>
    );
}
