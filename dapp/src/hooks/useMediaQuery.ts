// Copyright (c) 2026 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

export function useMediaQuery(width: string): boolean {
    const [screenWidth, setscreenWidth] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(width);

        const update = () => setscreenWidth(media.matches);
        update();

        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, [width]);

    return screenWidth;
}
