import { NameRecord } from '@iota/iota-names-sdk';

export function isNameRecordExpired(nameRecord: NameRecord) {
    return nameRecord.expirationTimestampMs < Date.now();
}

export function getNamePermissions(nameRecord: NameRecord) {
    let allowChildCreation = false;
    let allowTimeExtension = false;

    if ('S_AC' in nameRecord.data) {
        allowChildCreation = nameRecord.data.S_AC === '1';
    }
    if ('S_ATE' in nameRecord.data) {
        allowTimeExtension = nameRecord.data.S_ATE === '1';
    }

    return {
        allowChildCreation,
        allowTimeExtension,
    };
}
