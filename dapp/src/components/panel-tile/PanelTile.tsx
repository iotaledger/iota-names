// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { MoreHoriz } from '@iota/apps-ui-icons';
import {
    ButtonType,
    ButtonUnstyled,
    Card,
    CardAction,
    CardActionType,
    CardImage,
    CardType,
    Divider,
    ImageShape,
    ImageType,
} from '@iota/apps-ui-kit';
import clsx from 'clsx';

import { AvatarDisplay } from '../name-record/AvatarDisplay';
import { PanelTileType } from './enums';

interface PanelTileProps {
    type?: PanelTileType;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    onClick?: React.ComponentProps<typeof Card>['onClick'];
    onActionClick?: React.ComponentProps<typeof CardAction>['onClick'];
    footer?: React.ReactNode;
}

export function PanelTile({
    type = PanelTileType.Default,
    title,
    subtitle,
    icon,
    onClick,
    onActionClick,
    footer,
}: PanelTileProps) {
    const CARD_BG_COLOR: Record<PanelTileType, string> = {
        [PanelTileType.Default]: 'bg-transparent',
        [PanelTileType.Warning]: 'bg-[#342109]',
        [PanelTileType.Destructive]: 'bg-[#47000C]',
    };
    return (
        <div
            className={clsx(
                'flex flex-col',
                type !== PanelTileType.Default && 'rounded-xl overflow-hidden',
                CARD_BG_COLOR[type],
            )}
        >
            <div className="relative">
                <Card type={CardType.Default}>
                    <div className="flex flex-row items-center w-full gap-sm max-w-full">
                        <ButtonUnstyled
                            className="state-layer flex flex-row w-full items-center max-w-full min-w-0 gap-sm"
                            onClick={onClick}
                        >
                            <CardImage
                                type={ImageType.BgTransparent}
                                shape={ImageShape.SquareRounded}
                            >
                                <AvatarDisplay
                                    name={title}
                                    size="full"
                                    fallbackUrl="/subname-card-fallback.png"
                                />
                            </CardImage>

                            <div className="flex flex-col gap-xxs w-full min-w-0">
                                <div className="flex flex-row items-center w-full">
                                    <div className="w-full text-title-md font-medium leading-[120%] tracking-[-0.15px] text-names-neutral-92 mr-auto break-words text-left">
                                        {title}
                                    </div>

                                    {icon && <span className="ml-2">{icon}</span>}
                                </div>

                                {subtitle && (
                                    <div className="text-title-sm font-normal text-names-neutral-60">
                                        {subtitle}
                                    </div>
                                )}
                            </div>
                        </ButtonUnstyled>

                        <CardAction
                            type={CardActionType.Button}
                            buttonType={ButtonType.Ghost}
                            icon={<MoreHoriz />}
                            onClick={onActionClick}
                        />
                    </div>
                </Card>
            </div>

            {footer && (
                <>
                    <Divider />
                    {footer}
                </>
            )}
        </div>
    );
}
