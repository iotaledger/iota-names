import { IOTA_DECIMALS } from '@iota/iota-sdk/utils';
import { BigNumber } from 'bignumber.js';

export function toNanos(iota: string) {
    try {
        return BigInt(new BigNumber(iota).shiftedBy(IOTA_DECIMALS).toNumber());
    } catch {
        return BigInt(0);
    }
}
