// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

interface NameCardBodyProps {
    title: string;
}

export function NameCardBody({ title, children }: React.PropsWithChildren<NameCardBodyProps>) {
    return (
        <div className="p-md flex flex-col gap-y-xs">
            <h4 className="text-names-neutral-92 text-title-md text-ellipsis overflow-hidden">
                {title}
            </h4>

            <div className="flex flex-col gap-y-md">{children}</div>
        </div>
    );
}
