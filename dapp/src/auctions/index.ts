// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

export { AuctionItem } from './components/AuctionItem';
export { AuctionStatusBadge } from './components/AuctionStatusBadge';
export { UserAuctions } from './components/UserAuctions';
export { AuctionBidDialog } from './components/dialogs/AuctionBidDialog';

export { useAuctionBid } from './hooks/useAuctionBid';
export { useAuctionHouse } from './hooks/useAuctionHouse';
export { useClaimAuctionTransaction } from './hooks/useClaimAuctionTransaction';
export { useGetAddressAuctionHistory } from './hooks/useGetAddressAuctionHistory';
export { useGetAuctionMetadata } from './hooks/useGetAuctionMetadata';
export { useGetUserAuctions } from './hooks/useGetUserAuctions';
export type { AuctionDetails } from './hooks/useGetUserAuctions';

export * from './lib/types';
export * from './lib/utils';

export { IotaNamesIndexerClient } from './services/IotaNamesIndexerClient';
