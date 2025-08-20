// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Link } from '@iota/apps-ui-icons';
import { Button, ButtonType } from '@iota/apps-ui-kit';
import { normalizeIotaName } from '@iota/iota-names-sdk';
import { formatAddress } from '@iota/iota-sdk/utils';

import { NameRecordData, useNameRecord } from '@/hooks';
import { useNameManageDialog } from '@/hooks/useNameMenuOptions';
import { useNameTree } from '@/hooks/useNameTree';
import { RegistrationNft } from '@/lib/interfaces';
import { getNameMenuOptions } from '@/lib/utils/getNameMenuOptions';
import { getNamePermissions, isNameRecordExpired } from '@/lib/utils/names';

import { NameDialogId } from '../dialogs/enums';
import { NameDialogsController } from '../dialogs/NameDialogsController';
import { NameCard } from './NameCard';
import { NameCardBody } from './NameCardBody';
import { SubnameCountIndicator } from './NameCardIndicators';

interface ExtendedNameCardProps {
    nft: RegistrationNft;
    onSubnameListClick: () => void;
    badge?: React.ReactNode;
    isActive?: boolean;
}

export function ExtendedNameCard({
    nft,
    onSubnameListClick,
    badge,
    isActive,
}: ExtendedNameCardProps) {
    const nameTree = useNameTree(nft.name);
    const { data: nameRecordData } = useNameRecord(nft.name);
    const { openDialogId, openDialog, closeDialog } = useNameManageDialog();

    const hasSubnames = nameTree ? nameTree?.subnames.length > 0 : false;
    const menuOptions = getNameMenuOptions(nft, hasSubnames, openDialog, nameRecordData);
    const label = normalizeIotaName(nft.name);

    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const targetAddress = nameRecord?.nameRecord?.targetAddress;
    const expired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord.nameRecord) : false;
    const namePermissions = nameRecord
        ? getNamePermissions(nameRecord.nameRecord)
        : { allowChildCreation: true, allowTimeExtension: true };

    const buttonText = (() => {
        if (expired) {
            return 'Renew Name';
        }
        return targetAddress ? formatAddress(targetAddress) : 'Connect to address';
    })();

    const handleButtonClick = () => {
        if (expired && namePermissions.allowTimeExtension) {
            openDialog(NameDialogId.RenewName);
        } else {
            openDialog(NameDialogId.ConnectToAddress);
        }
    };

    return (
        <>
            <NameCard name={nft.name} badge={badge} menuOptions={menuOptions} isSelected={isActive}>
                <NameCardBody name={label}>
                    <SubnameCountIndicator
                        onSubnameListClick={onSubnameListClick}
                        subnameCount={nameTree?.subnames?.length ?? 0}
                        onAddSubnameClick={() => openDialog(NameDialogId.CreateSubname)}
                        showAddSubnameLink={namePermissions.allowChildCreation}
                    />

                    <Button
                        text={buttonText}
                        type={ButtonType.Secondary}
                        onClick={handleButtonClick}
                        icon={targetAddress ? <Link /> : null}
                    />
                </NameCardBody>
            </NameCard>

            <NameDialogsController nft={nft} openDialogId={openDialogId} onClose={closeDialog} />
        </>
    );
}
