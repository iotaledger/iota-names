// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

interface IconCardprops {
    title: string;
    body: string;
    icon: React.ReactNode;
}
export function IconCard({ title, body, icon }: IconCardprops): JSX.Element {
    return (
        <div className="w-full flex flex-col items-start gap-md md:max-w-[205px] lg:max-w-[270px]">
            {icon && <div className="[&_svg]:h-6 [&_svg]:w-6 text-names-primary-100">{icon}</div>}
            <div className="flex flex-col gap-x-xs">
                <h2 className="text-title-md text-names-primary-100">{title}</h2>
                {body && <p className="text-body-md text-names-neutral-70 ">{body}</p>}
            </div>
        </div>
    );
}
