// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export type NameTree = {
    name: string;
    subnames: NameTree[];
};

export function buildNameTree(name: string, ownedSubnames: string[]): NameTree {
    const normalizedName = name.toLowerCase();
    const parts = normalizedName.split('.');

    const children = ownedSubnames
        .filter((sub) => {
            if (sub === normalizedName) return false;
            const subParts = sub.split('.');
            return (
                subParts.slice(-parts.length).join('.') === parts.join('.') &&
                subParts.length === parts.length + 1
            );
        })
        .sort();

    return {
        name,
        subnames: children.map((child) => buildNameTree(child, ownedSubnames)),
    };
}

export function findInNameTree(tree: NameTree | NameTree[], target: string): NameTree | null {
    const nodes = Array.isArray(tree) ? tree : [tree];

    for (const node of nodes) {
        if (node.name.toLowerCase() === target.toLowerCase()) {
            return node;
        }

        const found = findInNameTree(node.subnames, target);
        if (found) return found;
    }

    return null;
}
