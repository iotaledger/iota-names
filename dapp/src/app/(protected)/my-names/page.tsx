// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    Add,
    Assets,
    Calendar,
    Delete,
    Link,
    // Calendar,
    // Delete,
    // Info,
    // Link,
    // Pined,
    Warning,
} from '@iota/apps-ui-icons';
import { Button, ButtonType, Title } from '@iota/apps-ui-kit';
import { useMemo, useState } from 'react';

import { UserAuctions } from '@/auctions/components/UserAuctions';
import { DeleteNameDialog } from '@/components';
import { ConnectToAddressDialog } from '@/components/dialogs/ConnectToAddressDialog';
import { CreateSubnameDialog } from '@/components/dialogs/CreateSubnameDialog';
import { PersonalizeAvatarDialog } from '@/components/dialogs/PersonalizeAvatarDialog';
import { RenewNameDialog } from '@/components/dialogs/RenewNameDialog';
import { DropdownMenuOption } from '@/components/DropdownMenuOptions';
import { NameCard } from '@/components/name-card/NameCard';
import { NameCardBody } from '@/components/name-card/NameCardBody';
import { SubnameCountIndicator } from '@/components/name-card/NameCardIndicators';
import { useRegistrationNfts } from '@/hooks';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';
import { MenuListItem } from '@/lib/types/components';
import { normalizeNameInput, splitNameInParts } from '@/lib/utils/format/formatNames';

export default function MyNamesPage(): JSX.Element {
    const [deleteNameDialog, setDeleteNameDialog] = useState<RegistrationNft | null>(null);
    const [createSubnameDialog, setCreateSubnameDialog] = useState<RegistrationNft | null>(null);
    const [personalizeAvatarName, setPersonalizeAvatarName] = useState<string | null>(null);
    const [connectToAddress, setConnectToAddress] = useState<string | null>(null);
    const [renewName, setRenewName] = useState<RegistrationNft | null>(null);

    const { data: names } = useRegistrationNfts('name');
    const { data: subnames } = useRegistrationNfts('subname');

    const namesWithChildren = useMemo(() => {
        const parents = new Set<string>();

        [...(names ?? []), ...(subnames ?? [])].forEach(({ name }) => {
            const firstDot = name.indexOf('.');
            if (firstDot !== -1) {
                const parentName = name.slice(firstDot + 1);
                parents.add(parentName);
            }
        });

        return parents;
    }, [names, subnames]);

    const renderMenuOptions = (nft: RegistrationNft): MenuListItem[] => [
        {
            onClick: () => setConnectToAddress(nft.name),
            children: <DropdownMenuOption icon={<Link />} label="Connect to Address" />,
            hideBottomBorder: true,
        },
        {
            onClick: () => setDeleteNameDialog(nft),
            children: <DropdownMenuOption icon={<Warning />} label="Delete" />,
            isHidden: !(nft.isExpired && !namesWithChildren.has(nft.name)),
            hideBottomBorder: true,
        },
        {
            onClick: () => setPersonalizeAvatarName(nft.name),
            children: <DropdownMenuOption icon={<Assets />} label="Personalize Avatar" />,
            hideBottomBorder: true,
        },
        {
            onClick: () => {},
            children: <DropdownMenuOption icon={<Delete />} label="Remove Avatar" />,
            isDisabled: true,
        },
        {
            onClick: () => setCreateSubnameDialog(nft),
            children: <DropdownMenuOption icon={<Add />} label="Create Subname" />,
        },
        {
            onClick: () => setRenewName(nft),
            children: <DropdownMenuOption icon={<Calendar />} label="Renew Name" />,
            hideBottomBorder: true,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Info />} label="View All Info" />,
        //     hideBottomBorder: true,
        // },
    ];

    return (
        <div className="flex flex-col w-full gap-y-lg items-center py-24 md:py-lg">
            {deleteNameDialog ? (
                <DeleteNameDialog
                    nft={deleteNameDialog}
                    open
                    setOpen={() => setDeleteNameDialog(null)}
                />
            ) : null}
            <div className="pt-md">
                <Title title="My names" testId="my-names-page" />
            </div>

            <div className="flex flex-row gap-sm items-center justify-center flex-wrap w-full">
                {names?.map((nft) => {
                    const name = normalizeNameInput(nft.name);
                    const nftSubnames = subnames?.filter((sub) => {
                        return sub.name !== nft.name && sub.name.endsWith(nft.name);
                    });

                    return (
                        <NameCard
                            key={nft.name}
                            name={nft.name}
                            menuOptions={renderMenuOptions(nft)}
                        >
                            <NameCardBody title={`@${name}`}>
                                <SubnameCountIndicator
                                    subnameCount={nftSubnames?.length ?? 0}
                                    onAddSubnameClick={() => setCreateSubnameDialog(nft)}
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

            {subnames?.length ? (
                <div className="flex flex-row gap-sm items-stretch justify-center flex-wrap w-full">
                    {subnames.map((subname) => {
                        const { namePart, subnamePart } = splitNameInParts(subname.name);
                        const name = normalizeNameInput(namePart);

                        const nftSubnames = subnames.filter(
                            (sub) => sub.name !== subname.name && sub.name.endsWith(subname.name),
                        );

                        return (
                            <NameCard
                                key={subname.name}
                                name={subname.name}
                                menuOptions={renderMenuOptions(subname)}
                            >
                                <NameCardBody title={`${subnamePart}@${name}`}>
                                    <SubnameCountIndicator
                                        subnameCount={nftSubnames.length}
                                        onAddSubnameClick={() => setCreateSubnameDialog(subname)}
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
            {!!createSubnameDialog && (
                <CreateSubnameDialog
                    name={createSubnameDialog.name}
                    setOpen={() => setCreateSubnameDialog(null)}
                />
            )}
            {!!personalizeAvatarName && (
                <PersonalizeAvatarDialog
                    name={personalizeAvatarName}
                    setOpen={() => setPersonalizeAvatarName(null)}
                />
            )}
            {!!connectToAddress && (
                <ConnectToAddressDialog
                    name={connectToAddress}
                    setOpen={() => setConnectToAddress(null)}
                />
            )}
            {!!renewName && (
                <RenewNameDialog setOpen={() => setRenewName(null)} name={renewName.name} />
            )}
        </div>
    );
}
