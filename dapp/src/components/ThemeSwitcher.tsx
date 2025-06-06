// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

'use client';

import { DarkMode, LightMode } from '@iota/apps-ui-icons';
import { Button, ButtonType } from '@iota/apps-ui-kit';

import { useTheme } from '../hooks/useTheme';
import { Theme, ThemePreference } from '../lib/enums';

export function ThemeSwitcher(): React.JSX.Element {
    const { theme, themePreference, setThemePreference } = useTheme();

    const ThemeIcon = theme === Theme.Dark ? DarkMode : LightMode;

    function handleOnClick(): void {
        const newTheme =
            themePreference === ThemePreference.Light
                ? ThemePreference.Dark
                : ThemePreference.Light;
        setThemePreference(newTheme);
    }

    return (
        <Button
            onClick={handleOnClick}
            type={ButtonType.Ghost}
            icon={<ThemeIcon className="h-5 w-5" />}
        />
    );
}
