'use client';

import CookiePolicy from '@legal/cookiePolicy.mdx';

export default function Page(): React.JSX.Element {
    return (
        <main className="flex flex-col min-h-screen">
            <div className="container w-full h-full pt-20 flex flex-col flex-1">
                <div className="flex flex-col w-full gap-y-lg py-lg flex-1">
                    <span className="text-label-md text-names-neutral-70">
                        Last updated: 9th October 2025
                    </span>
                    <div className="text-body-md text-names-neutral-92">
                        <CookiePolicy />
                    </div>
                </div>
            </div>
        </main>
    );
}
