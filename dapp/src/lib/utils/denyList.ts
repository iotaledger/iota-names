// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export const isNameWithBlockedWord = (name: string, blockedList: string[]) => {
    return blockedList.some((blockedWord) => name.includes(blockedWord));
};

export const isNameReserved = (name: string, reservedList: string[]) => {
    return reservedList.some((reservedWord) => name === `${reservedWord}.iota`);
};
