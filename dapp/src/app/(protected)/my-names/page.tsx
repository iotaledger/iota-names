// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { Add } from '@iota/apps-ui-icons';
import {
    Button,
    ButtonSegment,
    ButtonSegmentType,
    ButtonType,
    SegmentedButton,
} from '@iota/apps-ui-kit';
import { usePathname, useRouter } from 'next/navigation';

import { UserAuctions } from '@/auctions/components/UserAuctions';
import { Breadcrumbs } from '@/components/breadcrumb/Breadcrumb';
import { ExtendedNameCard } from '@/components/name-card/ExtendedNameCard';
import { useRegistrationNfts } from '@/hooks';
import { MY_NAMES_ROUTE } from '@/lib/constants';
import { normalizeNameInput } from '@/lib/utils/format/formatNames';

import { NAMES_CRUMB } from './constants';

export default function MyNamesPage(): JSX.Element {
    const { data: names } = useRegistrationNfts('name');
    const { data: subnames } = useRegistrationNfts('subname');

    const router = useRouter();
    const pathname = usePathname();

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
                    <ButtonSegment type={ButtonSegmentType.Rounded} label="All" selected />
                    <ButtonSegment type={ButtonSegmentType.Rounded} label="In Auction" />
                    <ButtonSegment type={ButtonSegmentType.Rounded} label="Owned" />
                </SegmentedButton>
            </div>

            <div className="flex flex-row gap-lg items-center flex-wrap w-full">
                {names?.map((nft) => (
                    <ExtendedNameCard
                        key={nft.name}
                        nft={nft}
                        ownedSubnames={subnames}
                        onSubnameListClick={() => handleSubnameListClick(nft.name)}
                    />
                ))}
            </div>

            <div className="pt-md w-full">
                <UserAuctions />
            </div>
        </>
    );
}
