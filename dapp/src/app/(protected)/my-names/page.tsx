// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import {
    // Add,
    // Assets,
    // Calendar,
    // Delete,
    // Info,
    // Link,
    // Pined,
    Settings,
    Warning,
} from '@iota/apps-ui-icons';
import { Button, ButtonType, Title } from '@iota/apps-ui-kit';
import { useMemo, useState } from 'react';

import { UserAuctions } from '@/auctions/components/UserAuctions';
import { DeleteNameDialog, UpdateNameDialog } from '@/components';
import { CreateSubnameDialog } from '@/components/dialogs/CreateSubnameDialog';
import { DropdownMenuOption } from '@/components/DropdownMenuOptions';
import { NameCard } from '@/components/name-card/NameCard';
import { NameCardBody } from '@/components/name-card/NameCardBody';
import { SubnameCountIndicator } from '@/components/name-card/NameCardIndicators';
import { useRegistrationNfts } from '@/hooks';
import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';
import { MenuListItem } from '@/lib/types/components';
import { normalizeNameInput, splitNameInParts } from '@/lib/utils/format/formatNames';

export default function MyNamesPage(): JSX.Element {
    const [updateNameDialog, setUpdateNameDialog] = useState<string | null>(null);
    const [deleteNameDialog, setDeleteNameDialog] = useState<RegistrationNft | null>(null);
    const [subnameAddDialog, setSubnameAddDialog] = useState<RegistrationNft | null>(null);

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
            onClick: () => setUpdateNameDialog(nft.name),
            children: <DropdownMenuOption icon={<Settings />} label="Manage" />,
            hideBottomBorder: true,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Pined />} label="Make name default" />,
        //     hideBottomBorder: true,
        // },
        {
            onClick: () => setDeleteNameDialog(nft),
            children: <DropdownMenuOption icon={<Warning />} label="Delete" />,
            isHidden: !(nft.isExpired && !namesWithChildren.has(nft.name)),
            hideBottomBorder: true,
        },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Assets />} label="Personalize Avatar" />,
        //     hideBottomBorder: true,
        // },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Delete />} label="Remove Avatar" />,
        //     isDisabled: true,
        // },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Add />} label="Create Subname" />,
        // },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Link />} label="Link to Wallet Address" />,
        // },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Calendar />} label="Renew Name" />,
        //     hideBottomBorder: true,
        // },
        // {
        //     onClick: () => {},
        //     children: <DropdownMenuOption icon={<Info />} label="View All Info" />,
        //     hideBottomBorder: true,
        // },
    ];

    return (
        <div className="flex flex-col w-full gap-y-lg items-center py-24 md:py-lg">
            {updateNameDialog ? (
                <UpdateNameDialog
                    name={updateNameDialog}
                    open
                    setOpen={() => setUpdateNameDialog(null)}
                />
            ) : null}
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
                                    onAddSubnameClick={() => setSubnameAddDialog(nft)}
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
                                        onAddSubnameClick={() => setSubnameAddDialog(subname)}
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
            {!!subnameAddDialog && (
                <CreateSubnameDialog
                    name={subnameAddDialog.name}
                    open={!!subnameAddDialog}
                    setOpen={() => setSubnameAddDialog(null)}
                />
            )}
        </div>
    );
}
