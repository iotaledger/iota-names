// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Link } from '@iota/apps-ui-icons';
import { Badge, BadgeType, Button, ButtonType } from '@iota/apps-ui-kit';
import { isSubname, normalizeIotaName } from '@iota/iota-names-sdk';
import { formatAddress } from '@iota/iota-sdk/utils';

import { NameRecordData, useNameRecord } from '@/hooks';
import { useNameManageDialog } from '@/hooks/useNameMenuOptions';
import { useNamesPurchaseMode } from '@/hooks/useNamesPurchaseMode';
import { useNameTree } from '@/hooks/useNameTree';
import { RegistrationNft } from '@/lib/interfaces';
import { getNameMenuOptions } from '@/lib/utils/getNameMenuOptions';
import {
    getNamePermissions,
    isGracePeriodExpired,
    isNameRecordCloseToExpiration,
    isNameRecordExpired,
} from '@/lib/utils/names';

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
    const { data: paymentMode } = useNamesPurchaseMode();

    const menuOptions = getNameMenuOptions(
        nft,
        hasSubnames,
        openDialog,
        nameRecordData,
        paymentMode?.isPaymentAuthorized,
    );
    const label = normalizeIotaName(nft.name);

    const nameRecord = nameRecordData as
        | Extract<NameRecordData, { type: 'unavailable' }>
        | undefined;

    const targetAddress = nameRecord?.nameRecord?.targetAddress;
    const isNameSubname = nameRecord?.nameRecord ? isSubname(nameRecord.nameRecord.name) : false;
    const namePermissions = nameRecord
        ? getNamePermissions(nameRecord.nameRecord)
        : { allowChildCreation: true, allowTimeExtension: true };

    const expired = nameRecord?.nameRecord ? isNameRecordExpired(nameRecord.nameRecord) : false;
    const isCloseToExpire = nameRecord?.nameRecord
        ? isNameRecordCloseToExpiration(nameRecord?.nameRecord)
        : false;
    const isNameGracePeriodExpired = nameRecord?.nameRecord
        ? isGracePeriodExpired(nameRecord?.nameRecord)
        : false;

    const buttonText = (() => {
        if (expired && !isNameGracePeriodExpired) {
            return 'Renew Name';
        }
        if (isNameGracePeriodExpired) {
            return isNameSubname ? 'Delete Subname' : 'Delete Name';
        }
        return targetAddress ? formatAddress(targetAddress) : 'Connect to address';
    })();

    const handleButtonClick = () => {
        if (expired && !isNameGracePeriodExpired && namePermissions.allowTimeExtension) {
            openDialog(NameDialogId.RenewName);
        } else if (isNameGracePeriodExpired) {
            openDialog(NameDialogId.Delete);
        } else {
            openDialog(NameDialogId.ConnectToAddress);
        }
    };

    return (
        <>
            <NameCard
                name={nft.name}
                badge={badge}
                menuOptions={menuOptions}
                isSelected={isActive}
                testId="name-card"
            >
                <NameCardBody name={label}>
                    <div className="flex items-center justify-between">
                        {!expired && !isNameGracePeriodExpired && (
                            <SubnameCountIndicator
                                onSubnameListClick={onSubnameListClick}
                                subnameCount={nameTree?.subnames?.length ?? 0}
                                onAddSubnameClick={() => openDialog(NameDialogId.CreateSubname)}
                                showAddSubnameLink={namePermissions.allowChildCreation}
                            />
                        )}
                        {isNameGracePeriodExpired ? (
                            <Badge type={BadgeType.Error} label="Expired | Unrenewable" />
                        ) : expired && !isNameGracePeriodExpired ? (
                            <Badge type={BadgeType.Error} label="Expired" />
                        ) : isCloseToExpire ? (
                            <Badge type={BadgeType.Warning} label="Expiring" />
                        ) : null}
                    </div>

                    <Button
                        text={buttonText}
                        type={
                            isNameGracePeriodExpired ? ButtonType.Destructive : ButtonType.Secondary
                        }
                        onClick={handleButtonClick}
                        icon={targetAddress ? <Link /> : null}
                    />
                </NameCardBody>
            </NameCard>

            <NameDialogsController nft={nft} openDialogId={openDialogId} onClose={closeDialog} />
        </>
    );
}
