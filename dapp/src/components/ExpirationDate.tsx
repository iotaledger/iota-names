// Copyright (c) 2026 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { Warning } from '@iota/apps-ui-icons';
import { InfoBox, InfoBoxStyle, InfoBoxType, Select, SelectOption } from '@iota/apps-ui-kit';
import { MINIMUM_SUBNAME_DURATION } from '@iota/iota-names-sdk';
import { useCallback, useMemo, useState } from 'react';

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
    onChange: (date: Date | null) => void;
    maxDate: Date | null;
    minDate: Date | null;
    disabled?: boolean;
}

const PLACEHOLDER_ID = '__placeholder__';

export function ExpirationDate({ onChange, maxDate, minDate, disabled }: ExpirationDateProps) {
    const [month, setMonth] = useState<number | null>(null);
    const [day, setDay] = useState<number | null>(null);
    const [year, setYear] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const currentYear = new Date().getFullYear();

    const emitChange = useCallback(
        (mon: number | null, day: number | null, year: number | null) => {
            if (mon !== null && day !== null && year !== null && maxDate !== null) {
                const date = new Date(Date.UTC(year, mon, day));
                const now = new Date();
                const todayOnly = new Date(
                    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
                );
                const minimumDate = minDate
                    ? new Date(
                          Math.max(minDate.getTime(), todayOnly.getTime()) +
                              MINIMUM_SUBNAME_DURATION,
                      )
                    : todayOnly;

                if (date > maxDate) {
                    setError("Must be less than or equal to the parent name's date");
                    onChange(null);
                } else if (date < minimumDate) {
                    setError(`Must be ${formatExpirationDate(minimumDate)} or later`);
                    onChange(null);
                } else {
                    setError(null);
                    onChange(date);
                }
            } else {
                setError(null);
                onChange(null);
            }
        },
        [onChange, maxDate],
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
        [currentYear],
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
        <div className="flex flex-col gap-y-xs w-full">
            <div className="flex flex-row gap-x-xs w-full">
                <div className="flex-1">
                    <Select
                        options={monthOptions}
                        value={month !== null ? String(month) : PLACEHOLDER_ID}
                        onValueChange={handleChange('month')}
                        disabled={disabled}
                    />
                </div>
                <div className="flex-1">
                    <Select
                        options={dayOptions}
                        value={day !== null ? String(day) : PLACEHOLDER_ID}
                        onValueChange={handleChange('day')}
                        disabled={disabled}
                    />
                </div>
                <div className="flex-1">
                    <Select
                        options={yearOptions}
                        value={year !== null ? String(year) : PLACEHOLDER_ID}
                        onValueChange={handleChange('year')}
                        disabled={disabled}
                    />
                </div>
            </div>
            {error && !disabled && (
                <InfoBox
                    type={InfoBoxType.Error}
                    style={InfoBoxStyle.Elevated}
                    icon={<Warning />}
                    title="Expiration Date Invalid"
                    supportingText={error}
                />
            )}
        </div>
    );
}
