import React from 'react';
import type { AnamnesisField } from '../../types/AnamnesisTypes';
import styles from './ClientAnamnesisForm.module.css';
import { useTheme } from '../../contexts/ThemeContext';
import {
    ChoiceDetailInput,
    ChoicePillRow,
    FieldShell,
    MultiChoiceWithOtherPills,
    formatMultiChoiceValue,
    parseMultiChoiceValue,
} from '../FormElements/AnamnesisPreview/AnamnesisPreviewFields';

interface Props {
    fields: AnamnesisField[];
    values: Record<number, string>;
    onChange: (fieldId: number, value: string) => void;
    isEdit?: boolean;
}

export default function ClientAnamnesisForm({
    fields,
    values,
    onChange,
    isEdit = false,
}: Props) {
    const { theme } = useTheme();

    if (fields.length === 0) return null;

    // Group fields by sector, preserving sector_order
    const sectorMap = new Map<
        string,
        { order: number; fields: AnamnesisField[] }
    >();
    for (const f of fields) {
        if (!sectorMap.has(f.sector)) {
            sectorMap.set(f.sector, { order: f.sector_order, fields: [] });
        }
        sectorMap.get(f.sector)!.fields.push(f);
    }
    const sectors = Array.from(sectorMap.entries()).sort(
        (a, b) => a[1].order - b[1].order,
    );

    const isVisible = (field: AnamnesisField): boolean => {
        if (!field.depends_on) return true;

        const parentValue = values[field.depends_on] ?? '';
        return field.show_when_value
            ? parentValue === field.show_when_value
            : parentValue !== '';
    };

    const getRadioValue = (field: AnamnesisField): string => {
        const currentValue = values[field.id] ?? '';
        if (field.field_type !== 'radio') return currentValue;
        if (currentValue.startsWith('Outro: ')) return 'Outro';
        return currentValue;
    };

    const getMultiChoiceValue = (field: AnamnesisField) =>
        parseMultiChoiceValue(values[field.id] ?? '', field.options ?? []);

    const getOtherText = (fieldId: number): string => {
        const currentValue = values[fieldId] ?? '';
        return currentValue.startsWith('Outro: ') ? currentValue.slice(7) : '';
    };

    return (
        <div data-theme={theme} className={styles.wrapper}>
            <div className={styles.form}>
                <header className={styles.header}>
                    <span className={styles.eyebrow}>
                        {isEdit ? 'Editar / Apagar' : 'Cadastro'}
                    </span>
                    <h2 className={styles.title}>Anamnese</h2>
                </header>

                {sectors.map(([sectorName, { fields: sectorFields }]) => {
                    const childrenByParent = new Map<
                        number,
                        AnamnesisField[]
                    >();
                    for (const f of sectorFields) {
                        if (f.depends_on) {
                            const siblings =
                                childrenByParent.get(f.depends_on) ?? [];
                            siblings.push(f);
                            childrenByParent.set(f.depends_on, siblings);
                        }
                    }

                    const sortedRootFields = sectorFields
                        .filter(field => !field.depends_on)
                        .sort((a, b) => a.order - b.order);

                    function renderField(
                        field: AnamnesisField,
                    ): React.ReactNode {
                        if (!isVisible(field)) return null;

                        const childFields = (
                            childrenByParent.get(field.id) ?? []
                        ).sort((a, b) => a.order - b.order);

                        const currentValue = values[field.id] ?? '';

                        const selectedRadioValue = getRadioValue(field);
                        const selectedMultiValue = getMultiChoiceValue(field);

                        const hasOtherOption =
                            field.field_type === 'radio' &&
                            (field.options ?? []).includes('Outro');
                        const otherIsSelected =
                            hasOtherOption && currentValue.startsWith('Outro');
                        const otherText = getOtherText(field.id);

                        const selectOption = (opt: string) => {
                            if (opt === 'Outro') {
                                onChange(field.id, 'Outro');
                            } else {
                                onChange(field.id, opt);
                            }
                        };

                        return (
                            <FieldShell
                                key={field.id}
                                label={field.label}
                                helper={
                                    field.field_type === 'radio'
                                        ? field.selection_mode === 'multiple'
                                            ? 'Marque uma ou mais opções.'
                                            : 'Escolha uma opção.'
                                        : field.field_type === 'textarea'
                                          ? 'Resposta descritiva.'
                                          : 'Resposta curta.'
                                }
                            >
                                {field.field_type === 'radio' &&
                                    field.options &&
                                    field.selection_mode === 'multiple' && (
                                        <>
                                            <MultiChoiceWithOtherPills
                                                options={field.options}
                                                value={selectedMultiValue}
                                                onChange={next =>
                                                    onChange(
                                                        field.id,
                                                        formatMultiChoiceValue(
                                                            next,
                                                        ),
                                                    )
                                                }
                                            />

                                            {(field.options ?? []).includes(
                                                'Outros',
                                            ) && (
                                                <ChoiceDetailInput
                                                    visible={selectedMultiValue.selected.includes(
                                                        'Outros',
                                                    )}
                                                    label='Outros'
                                                    value={
                                                        selectedMultiValue.otherText
                                                    }
                                                    placeholder={
                                                        field.placeholder ||
                                                        'Descreva...'
                                                    }
                                                    onChange={text =>
                                                        onChange(
                                                            field.id,
                                                            formatMultiChoiceValue(
                                                                {
                                                                    selected:
                                                                        selectedMultiValue.selected,
                                                                    otherText:
                                                                        text,
                                                                },
                                                            ),
                                                        )
                                                    }
                                                />
                                            )}
                                        </>
                                    )}

                                {field.field_type === 'radio' &&
                                    field.options &&
                                    field.selection_mode === 'single' && (
                                        <>
                                            <ChoicePillRow
                                                value={selectedRadioValue}
                                                options={field.options}
                                                name={`anamnesis-${field.id}`}
                                                onSelect={selectOption}
                                            />

                                            {hasOtherOption && (
                                                <ChoiceDetailInput
                                                    visible={otherIsSelected}
                                                    label='Outro'
                                                    value={otherText}
                                                    placeholder={
                                                        field.placeholder ||
                                                        'Informe...'
                                                    }
                                                    onChange={text => {
                                                        const newEntry = text
                                                            ? `Outro: ${text}`
                                                            : 'Outro';
                                                        onChange(
                                                            field.id,
                                                            newEntry,
                                                        );
                                                    }}
                                                />
                                            )}
                                        </>
                                    )}

                                {field.field_type === 'text' && (
                                    <input
                                        type='text'
                                        className={styles.textInput}
                                        value={values[field.id] ?? ''}
                                        placeholder={
                                            field.placeholder || undefined
                                        }
                                        onChange={e =>
                                            onChange(field.id, e.target.value)
                                        }
                                    />
                                )}

                                {field.field_type === 'textarea' && (
                                    <textarea
                                        className={styles.textarea}
                                        rows={3}
                                        value={values[field.id] ?? ''}
                                        placeholder={
                                            field.placeholder || undefined
                                        }
                                        onChange={e =>
                                            onChange(field.id, e.target.value)
                                        }
                                    />
                                )}

                                {childFields.map(childField =>
                                    renderField(childField),
                                )}
                            </FieldShell>
                        );
                    }

                    return (
                        <section key={sectorName} className={styles.sector}>
                            <h3 className={styles.sectorTitle}>{sectorName}</h3>
                            <div className={styles.fieldList}>
                                {sortedRootFields.map(field =>
                                    renderField(field),
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
