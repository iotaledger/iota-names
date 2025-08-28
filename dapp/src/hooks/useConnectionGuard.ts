import { useAutoConnectWallet, useCurrentWallet } from '@iota/dapp-kit';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { PROTECTED_ROUTES } from '@/lib/constants';

export function useConnectionGuard() {
    const autoConnect = useAutoConnectWallet();
    const { isConnected } = useCurrentWallet();
    const pathname = usePathname();
    const router = useRouter();

    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route.path));
    const needRedirect = autoConnect === 'attempted' && !isConnected && isProtectedRoute;

    useEffect(() => {
        if (needRedirect) {
            router.replace('/');
        }
    }, [needRedirect, router]);

    return {
        autoConnect,
        isProtectedRoute,
        needRedirect,
    };
}
