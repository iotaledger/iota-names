// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

interface NameCardBodyProps {
    name: string;
    onNameClick?: () => void;
}

export function NameCardBody({
    name,
    children,
    onNameClick,
}: React.PropsWithChildren<NameCardBodyProps>) {
    return (
        <div className="p-md flex flex-col gap-y-xs" data-testid="name-card-body">
            <h4
                className={`text-names-neutral-92 text-title-md truncate overflow-hidden ${onNameClick ? 'cursor-pointer hover:text-names-neutral-100 transition-colors' : ''}`}
                onClick={onNameClick}
            >
                {name}
            </h4>

            <div className="flex flex-col gap-y-xs">{children}</div>
        </div>
    );
}
