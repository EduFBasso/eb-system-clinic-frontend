import React from 'react';
import styles from './TimePicker10.module.css';

interface TimePicker10Props {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    minHour?: number;
    maxHour?: number;
    disabled?: boolean;
    style?: React.CSSProperties;
    stepMinutes?: 1 | 5 | 10 | 15 | 20 | 30;
    minHM?: string;
    maxHM?: string;
}

function normalizeHour(
    value: string,
    minHour: number,
    maxHour: number,
): [string, string] {
    if (!/^\d{2}:\d{2}$/.test(value)) {
        return [String(minHour).padStart(2, '0'), '00'];
    }
    const [hourValue, minuteValue] = value.split(':');
    const parsedHour = Number(hourValue);
    const parsedMinute = Number(minuteValue);
    const hour = Number.isNaN(parsedHour)
        ? minHour
        : Math.min(maxHour, Math.max(minHour, parsedHour));
    const minute = Number.isNaN(parsedMinute)
        ? 0
        : Math.min(59, Math.max(0, parsedMinute));
    return [String(hour).padStart(2, '0'), String(minute).padStart(2, '0')];
}

export const TimePicker10: React.FC<TimePicker10Props> = ({
    label,
    value,
    onChange,
    disabled,
    style,
    minHour = 6,
    maxHour = 21,
    stepMinutes = 10,
    minHM,
    maxHM,
}) => {
    if (minHour > maxHour) {
        minHour = 6;
        maxHour = 21;
    }

    let minH = minHour;
    let minM = 0;
    let maxH = maxHour;
    let maxM = 59;
    if (minHM && /^\d{2}:\d{2}$/.test(minHM)) {
        const [hourValue, minuteValue] = minHM.split(':').map(Number);
        if (!Number.isNaN(hourValue)) minH = hourValue;
        if (!Number.isNaN(minuteValue))
            minM = Math.min(59, Math.max(0, minuteValue));
    }
    if (maxHM && /^\d{2}:\d{2}$/.test(maxHM)) {
        const [hourValue, minuteValue] = maxHM.split(':').map(Number);
        if (!Number.isNaN(hourValue)) maxH = hourValue;
        if (!Number.isNaN(minuteValue))
            maxM = Math.min(59, Math.max(0, minuteValue));
    }

    const hoursOptions = React.useMemo(
        () =>
            Array.from({ length: maxH - minH + 1 }, (_, index) =>
                String(minH + index).padStart(2, '0'),
            ),
        [minH, maxH],
    );
    const [hour, minuteRaw] = React.useMemo(
        () => normalizeHour(value, minH, maxH),
        [value, minH, maxH],
    );
    const minute = minuteRaw.padStart(2, '0');
    const minuteOptions = React.useMemo(() => {
        const step = Math.max(1, stepMinutes || 1);
        let options = Array.from({ length: Math.ceil(60 / step) }, (_, index) =>
            String(index * step).padStart(2, '0'),
        ).filter(option => Number(option) < 60);
        if (hour === String(minH).padStart(2, '0')) {
            options = options.filter(option => Number(option) >= minM);
        }
        if (hour === String(maxH).padStart(2, '0')) {
            options = options.filter(option => Number(option) <= maxM);
        }
        if (!options.includes(minute)) options = [minute, ...options];
        return options;
    }, [hour, maxH, maxM, minH, minM, minute, stepMinutes]);

    const [openPart, setOpenPart] = React.useState<'hour' | 'minute' | null>(
        null,
    );
    const pickerRef = React.useRef<HTMLLabelElement | null>(null);

    React.useEffect(() => {
        function closeOnOutsideClick(event: PointerEvent) {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node)
            ) {
                setOpenPart(null);
            }
        }
        document.addEventListener('pointerdown', closeOnOutsideClick);
        return () =>
            document.removeEventListener('pointerdown', closeOnOutsideClick);
    }, []);

    function selectValue(part: 'hour' | 'minute', nextValue: string) {
        onChange(
            part === 'hour' ? `${nextValue}:${minute}` : `${hour}:${nextValue}`,
        );
        setOpenPart(null);
    }

    function renderPicker(
        part: 'hour' | 'minute',
        currentValue: string,
        options: string[],
    ) {
        const menuId = `${part}-options`;
        return (
            <div className={styles.picker}>
                <button
                    type='button'
                    className={styles.trigger}
                    aria-label={`${label || 'Horário'} ${part === 'hour' ? 'hora' : 'minuto'}`}
                    aria-haspopup='listbox'
                    aria-expanded={openPart === part}
                    aria-controls={menuId}
                    disabled={disabled}
                    onClick={() => setOpenPart(openPart === part ? null : part)}
                >
                    {currentValue}
                </button>
                {openPart === part && (
                    <div id={menuId} className={styles.menu} role='listbox'>
                        {options.map(option => (
                            <button
                                type='button'
                                key={option}
                                role='option'
                                aria-selected={option === currentValue}
                                className={`${styles.option} ${
                                    option === currentValue
                                        ? styles.optionSelected
                                        : ''
                                }`}
                                onClick={() => selectValue(part, option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <label
            ref={pickerRef}
            style={{ display: 'flex', flexDirection: 'column', ...style }}
        >
            {label && (
                <span
                    style={{ fontSize: 12, color: 'var(--color-text-muted)' }}
                >
                    {label}
                </span>
            )}
            <div style={{ display: 'flex', gap: 4 }}>
                {renderPicker('hour', hour, hoursOptions)}
                <span style={{ alignSelf: 'center', fontWeight: 600 }}>:</span>
                {renderPicker('minute', minute, minuteOptions)}
            </div>
        </label>
    );
};

export default TimePicker10;
