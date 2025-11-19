// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { execTryCatch } from '../setup/toggleSmartContract';
import { iotaNamesClient } from '../setup/utils';

export async function addBlockedLabels(labels: string[]) {
    const formattedLabels = `['${labels.join("', '")}']`;

    const command = `iota client ptb \
        --make-move-vec "<0x1::string::String>" "${formattedLabels}" \
        --assign labels \
        --move-call ${iotaNamesClient.config.packageId}::deny_list::add_blocked_labels \
            @${iotaNamesClient.config.iotaNamesObjectId} \
            @${iotaNamesClient.config.adminCap} \
            labels`;

    return await execTryCatch(command.replace(/\n/g, ' '));
}

export async function addReservedLabels(labels: string[]) {
    const formattedLabels = `['${labels.join("', '")}']`;

    const command = `iota client ptb \
        --make-move-vec "<0x1::string::String>" "${formattedLabels}" \
        --assign labels \
        --move-call ${iotaNamesClient.config.packageId}::deny_list::add_reserved_labels \
            @${iotaNamesClient.config.iotaNamesObjectId} \
            @${iotaNamesClient.config.adminCap} \
            labels`;

    return await execTryCatch(command.replace(/\n/g, ' '));
}
