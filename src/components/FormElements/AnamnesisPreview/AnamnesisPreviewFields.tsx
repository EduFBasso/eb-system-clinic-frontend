import React from 'react';
import styles from './AnamnesisPreviewFields.module.css';

export type YesNoDetailValue = 'Não' | `Sim: ${string}`;

export type MultiChoiceValue = {
    selected: string[];
    otherText: string;
};

export function parseConcatenatedEntries(value: string): string[] {
    return (value || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
}

export function buildConcatenatedEntries(entries: string[]): string {
    return entries
        .map(item => item.trim())
        .filter(Boolean)
        .join(', ');
}

export function parseYesNoDetail(value: YesNoDetailValue) {
    if (value.startsWith('Sim: ')) {
        return { checked: 'Sim' as const, detail: value.slice(5) };
    }
    return { checked: 'Não' as const, detail: '' };
}

export function formatMultiChoiceValue(value: MultiChoiceValue) {
    const base = value.selected.filter(option => option !== 'Outros');
    if (value.selected.includes('Outros') && value.otherText.trim()) {
        base.push(`Outros: ${value.otherText.trim()}`);
    }
    return buildConcatenatedEntries(base) || 'Sem resposta';
}

export function FieldShell({
    label,
    helper,
    children,
}: {
    label: string;
    helper: string;
    children: React.ReactNode;
}) {
    return (
        <div className={styles.fieldBlock}>
            <div className={styles.fieldHeader}>
                <label className={styles.fieldLabel}>{label}</label>
                <span className={styles.fieldHelper}>{helper}</span>
            </div>
            {children}
        </div>
    );
}

export function ChoicePillRow({
    value,
    options,
    onSelect,
    name,
}: {
    value: string;
    options: string[];
    onSelect: (value: string) => void;
    name: string;
}) {
    return (
        <div className={styles.choiceRow}>
            {options.map(option => {
                const selected = value === option;
                return (
                    <label
                        key={option}
                        className={
                            selected
                                ? `${styles.choicePill} ${styles.choicePillSelected}`
                                : styles.choicePill
                        }
                    >
                        <input
                            type='radio'
                            className={styles.hiddenInput}
                            name={name}
                            checked={selected}
                            onChange={() => onSelect(option)}
                        />
                        {option}
                    </label>
                );
            })}
        </div>
    );
}

export function ChoiceDetailInput({
    visible,
    label,
    value,
    onChange,
    placeholder,
}: {
    visible: boolean;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <div className={visible ? styles.detailAreaVisible : styles.detailArea}>
            <label className={styles.detailLabel}>{label}</label>
            <input
                type='text'
                className={styles.textInput}
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={!visible}
            />
        </div>
    );
}

export function SerializedValueBox({ value }: { value: string }) {
    return (
        <div className={styles.serializedBox}>
            <span className={styles.serializedLabel}>Prévia salva</span>
            <code className={styles.serializedValue}>{value}</code>
        </div>
    );
}

export function MultiChoiceWithOtherPills({
    options,
    value,
    onChange,
}: {
    options: string[];
    value: MultiChoiceValue;
    onChange: (value: MultiChoiceValue) => void;
}) {
    function toggleOption(option: string) {
        const exists = value.selected.includes(option);
        const selected = exists
            ? value.selected.filter(item => item !== option)
            : [...value.selected, option];

        onChange({
            selected,
            otherText: option === 'Outros' && exists ? '' : value.otherText,
        });
    }

    return (
        <div className={styles.checkboxGrid}>
            {options.map(option => {
                const selected = value.selected.includes(option);
                return (
                    <label
                        key={option}
                        className={
                            selected
                                ? `${styles.checkPill} ${styles.checkPillSelected}`
                                : styles.checkPill
                        }
                    >
                        <input
                            type='checkbox'
                            className={styles.hiddenInput}
                            checked={selected}
                            onChange={() => toggleOption(option)}
                        />
                        <span className={styles.checkIcon} aria-hidden='true'>
                            {selected ? '✓' : '+'}
                        </span>
                        {option}
                    </label>
                );
            })}
        </div>
    );
}

export function SingleChoiceWithOtherField({
    label,
    helper,
    name,
    options,
    value,
    otherPrefix,
    otherPlaceholder,
    onChange,
}: {
    label: string;
    helper: string;
    name: string;
    options: string[];
    value: string;
    otherPrefix: string;
    otherPlaceholder: string;
    onChange: (value: string) => void;
}) {
    const hasOther = value === 'Outro' || value.startsWith(otherPrefix);
    const otherValue = value.startsWith(otherPrefix)
        ? value.slice(otherPrefix.length)
        : '';

    return (
        <FieldShell label={label} helper={helper}>
            <ChoicePillRow
                value={
                    hasOther && value.startsWith(otherPrefix) ? 'Outro' : value
                }
                options={options}
                name={name}
                onSelect={option =>
                    onChange(option === 'Outro' ? 'Outro' : option)
                }
            />

            <ChoiceDetailInput
                visible={hasOther}
                label='Outro'
                value={otherValue}
                onChange={detail =>
                    onChange(detail ? `${otherPrefix}${detail}` : 'Outro')
                }
                placeholder={otherPlaceholder}
            />
        </FieldShell>
    );
}
