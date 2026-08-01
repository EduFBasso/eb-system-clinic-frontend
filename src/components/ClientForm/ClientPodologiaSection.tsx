import { useEffect, useState } from 'react';
import type { AnamnesisField } from '../../types/AnamnesisTypes';
import styles from './ClientPodologiaSection.module.css';

interface Props {
    fields: AnamnesisField[];
    values: Record<number, string>;
    loading: boolean;
    onChange: (fieldId: number, value: string) => void;
}

function normalizeSectorName(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function isGeneralSector(sector: string) {
    return normalizeSectorName(sector) === 'historico';
}

function parseCsvValue(raw: string) {
    return raw
        .split(',')
        .map(token => token.trim())
        .filter(Boolean);
}

function parseMultiChoiceValue(value: string, options: string[]) {
    const entries = parseCsvValue(value);
    const selected = options.filter(option =>
        option !== 'Outros'
            ? entries.includes(option)
            : entries.includes('Outros') ||
              entries.some(item => item.startsWith('Outros:')),
    );
    const otherEntry = entries.find(item => item.startsWith('Outros:'));

    return {
        selected,
        otherText: otherEntry
            ? otherEntry.slice('Outros:'.length).trimStart()
            : '',
    };
}

function normalizeFieldLabel(value: string) {
    return normalizeSectorName(value).replace(/\s+/g, ' ').trim();
}

function normalizeFieldOptions(options: AnamnesisField['options'] | unknown) {
    if (Array.isArray(options)) {
        return options
            .map(option => String(option ?? '').trim())
            .filter(Boolean);
    }

    if (typeof options !== 'string') {
        return [];
    }

    const trimmed = options.trim();
    if (!trimmed) return [];

    try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
            return parsed
                .map(option => String(option ?? '').trim())
                .filter(Boolean);
        }
    } catch {
        /* fall back to CSV parsing */
    }

    return trimmed
        .split(',')
        .map(option => option.trim())
        .filter(Boolean);
}

function serializeCsvValue(values: string[]) {
    return values.join(', ');
}

function isFieldVisible(
    field: AnamnesisField,
    valueByFieldId: Map<number, string>,
    fieldById: Map<number, AnamnesisField>,
): boolean {
    if (!field.depends_on) return true;

    const parent = fieldById.get(field.depends_on);
    if (!parent) return false;
    if (!isFieldVisible(parent, valueByFieldId, fieldById)) return false;

    const parentValue = valueByFieldId.get(parent.id) ?? '';
    if (!field.show_when_value) {
        return parentValue.trim().length > 0;
    }

    if (
        field.field_type === 'text' &&
        parent.selection_mode === 'multiple' &&
        field.show_when_value === 'Outros'
    ) {
        return false;
    }

    if (parent.selection_mode === 'multiple') {
        return parseCsvValue(parentValue).includes(field.show_when_value);
    }

    return parentValue === field.show_when_value;
}

function renderInputControl(
    field: AnamnesisField,
    currentValue: string,
    onChange: (fieldId: number, value: string) => void,
    draftValue: string | undefined,
    setDraftValue: (fieldId: number, value: string) => void,
    otherDraftValue: string | undefined,
    setOtherDraftValue: (fieldId: number, value: string) => void,
) {
    const options = normalizeFieldOptions(field.options);
    const displayValue = draftValue ?? currentValue;

    if (field.field_type === 'textarea') {
        return (
            <textarea
                className={styles.podologiaTextarea}
                rows={4}
                value={displayValue}
                placeholder={field.placeholder || ''}
                onChange={e => {
                    const nextValue = e.target.value;
                    setDraftValue(field.id, nextValue);
                    onChange(field.id, nextValue);
                }}
            />
        );
    }

    if (field.field_type === 'text') {
        return (
            <input
                type='text'
                className={styles.inlineTextInput}
                value={displayValue}
                placeholder={field.placeholder || ''}
                onChange={e => {
                    const nextValue = e.target.value;
                    setDraftValue(field.id, nextValue);
                    onChange(field.id, nextValue);
                }}
            />
        );
    }

    if (!options.length) {
        return (
            <input
                type='text'
                className={styles.inlineTextInput}
                value={currentValue}
                placeholder={field.placeholder || ''}
                onChange={e => onChange(field.id, e.target.value)}
            />
        );
    }

    if (field.selection_mode === 'multiple') {
        const parsed = parseMultiChoiceValue(currentValue, options);
        const selected = new Set(parsed.selected);

        return (
            <div className={styles.optionList}>
                {options.map(option => (
                    <label key={option} className={styles.optionItem}>
                        <input
                            className={styles.selectorControl}
                            type='checkbox'
                            name={`field_${field.id}`}
                            checked={selected.has(option)}
                            onChange={e => {
                                const next = new Set(selected);
                                if (e.target.checked) {
                                    next.add(option);
                                } else {
                                    next.delete(option);
                                }

                                const nextSelected = [...next].filter(
                                    item => item !== 'Outros',
                                );
                                if (next.has('Outros')) {
                                    nextSelected.push(
                                        parsed.otherText
                                            ? `Outros: ${parsed.otherText}`
                                            : 'Outros',
                                    );
                                } else {
                                    setOtherDraftValue(field.id, '');
                                }

                                onChange(
                                    field.id,
                                    serializeCsvValue(nextSelected),
                                );
                            }}
                        />
                        <span>{option}</span>
                    </label>
                ))}

                {selected.has('Outros') && (
                    <div className={styles.otherInputRow}>
                        <input
                            type='text'
                            className={styles.inlineTextInput}
                            value={otherDraftValue ?? parsed.otherText}
                            placeholder='Outros: descreva aqui'
                            onChange={e => {
                                const detail = e.target.value;
                                setOtherDraftValue(field.id, detail);
                                const nextSelected = [...selected].filter(
                                    item => item !== 'Outros',
                                );
                                nextSelected.push(
                                    detail ? `Outros: ${detail}` : 'Outros',
                                );
                                onChange(
                                    field.id,
                                    serializeCsvValue(nextSelected),
                                );
                            }}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={styles.optionList}>
            {options.map(option => (
                <label key={option} className={styles.optionItem}>
                    <input
                        className={styles.selectorControl}
                        type='radio'
                        name={`field_${field.id}`}
                        checked={currentValue === option}
                        onChange={() => onChange(field.id, option)}
                    />
                    <span>{option}</span>
                </label>
            ))}
        </div>
    );
}

export default function ClientPodologiaSection({
    fields,
    values,
    loading,
    onChange,
}: Props) {
    const [draftValues, setDraftValues] = useState<Record<number, string>>({});
    const [otherDraftValues, setOtherDraftValues] = useState<
        Record<number, string>
    >({});

    useEffect(() => {
        setDraftValues({});
        setOtherDraftValues({});
    }, [fields]);

    const podologiaFields = fields.filter(
        field => !isGeneralSector(field.sector),
    );

    const valueByFieldId = new Map<number, string>(
        Object.entries(values).map(([key, value]) => [Number(key), value]),
    );
    const fieldById = new Map<number, AnamnesisField>(
        fields.map(field => [field.id, field]),
    );

    const grouped = podologiaFields.reduce<Record<string, AnamnesisField[]>>(
        (acc, field) => {
            if (!acc[field.sector]) acc[field.sector] = [];
            acc[field.sector].push(field);
            return acc;
        },
        {},
    );

    const orderedSectors = Object.keys(grouped).sort((a, b) => {
        const first = grouped[a][0];
        const second = grouped[b][0];
        return first.sector_order - second.sector_order;
    });

    if (loading) {
        return (
            <p className={styles.podologiaEmpty}>
                Carregando campos de podologia...
            </p>
        );
    }

    if (!podologiaFields.length) {
        return (
            <p className={styles.podologiaEmpty}>
                Nenhum campo dinâmico de podologia encontrado para este tenant.
            </p>
        );
    }

    return (
        <div className={styles.podologiaGrid}>
            {orderedSectors.map(sector => {
                const visibleFields = grouped[sector]
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .filter(field =>
                        isFieldVisible(field, valueByFieldId, fieldById),
                    );

                return (
                    <section
                        key={sector}
                        className={styles.podologiaSectorCard}
                    >
                        <h3 className={styles.podologiaSectorTitle}>
                            {sector}
                        </h3>
                        {visibleFields.map(field => (
                            <div
                                key={field.id}
                                className={styles.podologiaField}
                            >
                                {normalizeFieldLabel(field.label) !==
                                    normalizeFieldLabel(sector) && (
                                    <label className={styles.podologiaLabel}>
                                        {field.label}
                                    </label>
                                )}
                                {renderInputControl(
                                    field,
                                    values[field.id] ?? '',
                                    onChange,
                                    draftValues[field.id],
                                    (fieldId, nextValue) =>
                                        setDraftValues(prev => ({
                                            ...prev,
                                            [fieldId]: nextValue,
                                        })),
                                    otherDraftValues[field.id],
                                    (fieldId, nextValue) =>
                                        setOtherDraftValues(prev => ({
                                            ...prev,
                                            [fieldId]: nextValue,
                                        })),
                                )}
                            </div>
                        ))}
                    </section>
                );
            })}
        </div>
    );
}
