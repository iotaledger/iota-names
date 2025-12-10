import { Network } from '@iota/iota-sdk/client';
import { NANOS_PER_IOTA } from '@iota/iota-sdk/utils';

import { getDefaultNetwork } from '@/config/config';

export const AUCTION_MIN_OVERBID_VALUE_IOTA =
    (() => {
        switch (getDefaultNetwork()) {
            case Network.Localnet:
            case Network.Devnet:
                return BigInt(1);
            default:
                return BigInt(10);
        }
    })() * NANOS_PER_IOTA;
