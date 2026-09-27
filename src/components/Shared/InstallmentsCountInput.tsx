import { useEffect, useState } from 'react';
import {
    MAX_INSTALLMENTS_COUNT,
    MIN_INSTALLMENTS_COUNT,
    normalizeInstallmentsCount,
} from '../../utils/TreatmentHelpers';

interface InstallmentsCountInputProps {
    className: string;
    value: number;
    onValueChange: (value: number) => void;
    disabled?: boolean;
}

export function InstallmentsCountInput({
    className,
    value,
    onValueChange,
    disabled = false,
}: InstallmentsCountInputProps) {
    const [draft, setDraft] = useState(() => String(value));

    useEffect(() => {
        setDraft(String(value));
    }, [value]);

    function handleChange(rawValue: string) {
        setDraft(rawValue);
        const nextValue = Number(rawValue);
        if (
            Number.isInteger(nextValue) &&
            nextValue >= MIN_INSTALLMENTS_COUNT &&
            nextValue <= MAX_INSTALLMENTS_COUNT
        ) {
            onValueChange(nextValue);
        }
    }

    function handleBlur() {
        const normalizedValue = normalizeInstallmentsCount(draft);
        setDraft(String(normalizedValue));
        onValueChange(normalizedValue);
    }

    return (
        <input
            className={className}
            type='number'
            inputMode='numeric'
            min={MIN_INSTALLMENTS_COUNT}
            max={MAX_INSTALLMENTS_COUNT}
            step={1}
            value={draft}
            onChange={event => handleChange(event.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
        />
    );
}
