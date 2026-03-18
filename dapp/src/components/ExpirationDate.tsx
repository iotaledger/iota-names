// Copyright (c) 2026 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Warning } from '@iota/apps-ui-icons';
import {
    Badge,
    BadgeType,
    InfoBox,
    InfoBoxStyle,
    InfoBoxType,
    RadioButton,
    Select,
    SelectOption,
} from '@iota/apps-ui-kit';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNamesConfig } from '@/hooks/useNamesConfig';
import { formatExpirationDate } from '@/lib/utils/format/formatExpirationDate';

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

interface ExpirationDateProps {
    parentExpirationDate: Date | null;
    currentExpirationDate: Date | null;
    maxDate: Date | null;
    minDate?: Date | null;
    onChange: (date: Date | null) => void;
    onExpirationTypeChange?: (isParentExpiration: boolean) => void;
}

const PLACEHOLDER_ID = '__placeholder__';

export function ExpirationDate({
    parentExpirationDate,
    currentExpirationDate,
    maxDate,
    minDate,
    onChange,
    onExpirationTypeChange,
}: ExpirationDateProps) {
    const { data: config, isLoading: isLoadingConfig } = useNamesConfig();

    const [month, setMonth] = useState<number | null>(null);
    const [day, setDay] = useState<number | null>(null);
    const [year, setYear] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [isParentExpiration, setIsParentExpiration] = useState<boolean>(true);
    const [customExpirationDate, setCustomExpirationDate] = useState<Date | null>(null);
    const currentYear = new Date().getFullYear();

    const parentTime = parentExpirationDate?.getTime() ?? null;
    useEffect(() => {
        if (isParentExpiration && parentExpirationDate) {
            onChange(parentExpirationDate);
        }
    }, [parentTime, isParentExpiration]);

    const emitChange = useCallback(
        (mon: number | null, day: number | null, year: number | null) => {
            if (
                mon !== null &&
                day !== null &&
                year !== null &&
                maxDate !== null &&
                minDate !== null &&
                !isLoadingConfig &&
                config?.subnamesConfig
            ) {
                const minimumDuration = Number(config.subnamesConfig.minimum_duration);
                const now = new Date();
                const selectedDate = new Date(
                    year,
                    mon,
                    day,
                    now.getHours(),
                    now.getMinutes(),
                    now.getSeconds(),
                    now.getMilliseconds(),
                );

                const minimumDate =
                    minDate && minDate > selectedDate
                        ? new Date(minDate.getTime() + minimumDuration)
                        : new Date(now.getTime() + 2 * minimumDuration);

                if (selectedDate > maxDate) {
                    setError("Must be less than or equal to the parent name's date");
                    setCustomExpirationDate(null);
                    onChange(null);
                } else if (selectedDate < minimumDate) {
                    setError(`Must be ${formatExpirationDate(minimumDate)} or later`);
                    setCustomExpirationDate(null);
                    onChange(null);
                } else {
                    setError(null);
                    setCustomExpirationDate(selectedDate);
                    onChange(selectedDate);
                }
            } else {
                setError(null);
                setCustomExpirationDate(null);
                onChange(null);
            }
        },
        [onChange, maxDate, minDate, config, isLoadingConfig],
    );

    const monthOptions: SelectOption[] = useMemo(
        () => [
            {
                id: PLACEHOLDER_ID,
                renderLabel: () => (
                    <span className="text-body-lg text-names-neutral-40">Month</span>
                ),
            },
            ...MONTH_NAMES.map((name, index) => ({
                id: String(index),
                renderLabel: () => <span className="text-body-lg">{name}</span>,
            })),
        ],
        [],
    );

    const yearOptions: SelectOption[] = useMemo(
        () => [
            {
                id: PLACEHOLDER_ID,
                renderLabel: () => <span className="text-body-lg text-names-neutral-40">Year</span>,
            },
            ...Array.from(
                { length: (maxDate?.getFullYear() ?? currentYear) - currentYear + 1 },
                (_, i) => {
                    const year = currentYear + i;
                    return {
                        id: String(year),
                        renderLabel: () => <span className="text-body-lg">{year}</span>,
                    };
                },
            ),
        ],
        [currentYear, maxDate],
    );

    const daysInMonth = new Date(year ?? currentYear, (month ?? 0) + 1, 0).getDate();
    const dayOptions: SelectOption[] = useMemo(
        () => [
            {
                id: PLACEHOLDER_ID,
                renderLabel: () => <span className="text-body-lg text-names-neutral-40">Day</span>,
            },
            ...Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                return {
                    id: String(day),
                    renderLabel: () => <span className="text-body-lg">{day}</span>,
                };
            }),
        ],
        [daysInMonth],
    );

    type DateField = 'month' | 'day' | 'year';
    const setters: Record<DateField, (v: number) => void> = {
        month: setMonth,
        day: setDay,
        year: setYear,
    };

    const handleChange = (field: DateField) => (value: string) => {
        if (value === PLACEHOLDER_ID) return;
        const num = Number(value);
        setters[field](num);
        const next = { month, day, year, [field]: num };

        // Clamp the day if it exceeds the number of days in the selected month
        if (next.month !== null && next.year !== null && next.day !== null) {
            const maxDays = new Date(next.year, next.month + 1, 0).getDate();
            if (next.day > maxDays) {
                next.day = maxDays;
                setDay(maxDays);
            }
        }

        emitChange(next.month, next.day, next.year);
    };

    return (
        <>
            <div className="flex flex-col gap-y-md w-full">
                <span className="text-label-lg text-names-neutral-92">Expiration Date</span>
                <div className="flex items-center justify-between gap-x-sm">
                    <RadioButton
                        name="parent_expiration"
                        isChecked={isParentExpiration}
                        onChange={() => {
                            setIsParentExpiration(true);
                            onChange(parentExpirationDate);
                            onExpirationTypeChange?.(true);
                        }}
                        label="Same as parent"
                    />
                    <Badge
                        type={BadgeType.Neutral}
                        label={
                            parentExpirationDate ? formatExpirationDate(parentExpirationDate) : ''
                        }
                    />
                </div>
                <RadioButton
                    name="custom_expiration"
                    isChecked={!isParentExpiration}
                    onChange={() => {
                        setIsParentExpiration(false);
                        onChange(customExpirationDate);
                        onExpirationTypeChange?.(false);
                    }}
                    isDisabled={
                        parentExpirationDate?.toDateString() ===
                        currentExpirationDate?.toDateString()
                    }
                    label="Custom"
                />
            </div>
            <div className="flex flex-col gap-y-xs w-full">
                <div className="flex flex-row gap-x-xs w-full">
                    <div className="flex-1">
                        <Select
                            options={monthOptions}
                            value={month !== null ? String(month) : PLACEHOLDER_ID}
                            onValueChange={handleChange('month')}
                            disabled={isParentExpiration}
                        />
                    </div>
                    <div className="flex-1">
                        <Select
                            options={dayOptions}
                            value={day !== null ? String(day) : PLACEHOLDER_ID}
                            onValueChange={handleChange('day')}
                            disabled={isParentExpiration}
                        />
                    </div>
                    <div className="flex-1">
                        <Select
                            options={yearOptions}
                            value={year !== null ? String(year) : PLACEHOLDER_ID}
                            onValueChange={handleChange('year')}
                            disabled={isParentExpiration}
                        />
                    </div>
                </div>
                {error && !isParentExpiration && (
                    <InfoBox
                        type={InfoBoxType.Error}
                        style={InfoBoxStyle.Elevated}
                        icon={<Warning />}
                        title="Expiration Date Invalid"
                        supportingText={error}
                    />
                )}
            </div>
        </>
    );
}
