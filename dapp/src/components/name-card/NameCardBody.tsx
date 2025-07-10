// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

interface NameCardBodyProps {
    name: string;
}

export function NameCardBody({ name, children }: React.PropsWithChildren<NameCardBodyProps>) {
    const formattedName = name.startsWith('@') ? name : `@${name}`;
    return (
        <div className="p-md flex flex-col gap-y-xs">
            <h4 className="text-names-neutral-92 text-title-md text-ellipsis overflow-hidden">
                {formattedName}
            </h4>

            <div className="flex flex-col gap-y-md">{children}</div>
        </div>
    );
}
