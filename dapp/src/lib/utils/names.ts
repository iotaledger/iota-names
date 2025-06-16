import { NameRecord } from '@iota/iota-names-sdk';

export function isNameRecordExpired(nameRecord: NameRecord) {
    return nameRecord.expirationTimestampMs < Date.now();
}
