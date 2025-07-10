// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import { buildNameTree, findInNameTree, NameTree } from '@/lib/utils/buildNameTree';
import { addNameSuffix } from '@/lib/utils/format/formatNames';

import { useRegistrationNfts } from './useRegistrationNfts';

export function useNameTree(name: string): NameTree | null {
    const { data: names } = useRegistrationNfts('name');
    const { data: subnames } = useRegistrationNfts('subname');

    const nftName = addNameSuffix(name);

    const namesTree = useMemo(() => {
        const ownedSubnames = subnames?.map((sub) => sub.name) ?? [];
        return (names ?? []).map(({ name }) => buildNameTree(name, ownedSubnames));
    }, [names, subnames]);

    return useMemo(() => {
        return findInNameTree(namesTree, nftName);
    }, [namesTree, nftName]);
}
