// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

import { RegistrationNft } from '@/lib/interfaces';
import { buildNameTree, findInNameTree, NameTree } from '@/lib/utils/buildNameTree';
import { addNameSuffix } from '@/lib/utils/format/formatNames';

import { useRegistrationNfts } from './useRegistrationNfts';

export function useNameTree(name: string): NameTree | null {
    const { data: names, isLoading: isLoadingNames } = useRegistrationNfts('name');
    const { data: subnames, isLoading: isLoadingSubnames } = useRegistrationNfts('subname');
    const nftName = addNameSuffix(name);

    const namesTree = useOwnedNamesTree(names ?? [], subnames ?? []);

    return useMemo(() => {
        return findInNameTree(namesTree, nftName);
    }, [nftName, isLoadingNames, isLoadingSubnames, namesTree]);
}

export function useOwnedNamesTree(
    names: RegistrationNft[],
    subnames: RegistrationNft[],
): NameTree[] {
    const namesTree = useMemo(() => {
        const ownedSubnamesSet = new Set((subnames ?? []).map((sub) => sub.name));
        return (names ?? []).map(({ name }) => buildNameTree(name, ownedSubnamesSet));
    }, [names, subnames]);

    return namesTree;
}
