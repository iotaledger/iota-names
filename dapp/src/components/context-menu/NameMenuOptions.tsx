// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Settings } from '@iota/apps-ui-icons';
import { ListItem } from '@iota/apps-ui-kit';

import { RegistrationNft } from '@/lib/interfaces/registration.interfaces';

interface NameMenuOptionsProps {
    name: RegistrationNft;
    setUpdateNameDialog: (name: string | null) => void;
}
export function NameMenuOptions({ name, setUpdateNameDialog }: NameMenuOptionsProps) {
    return (
        <>
            <ListItem
                onClick={() => {
                    setUpdateNameDialog(name.name);
                }}
                hideBottomBorder
            >
                <Settings className="mr-xs" />
                Manage
            </ListItem>
        </>
    );
}
