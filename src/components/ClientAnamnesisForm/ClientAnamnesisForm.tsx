import React from 'react';
import type { AnamneseBaseData } from '../../types/ClientData';
import styles from './ClientAnamnesisForm.module.css';
import { useTheme } from '../../contexts/ThemeContext';

interface Props {
    anamneseBase: AnamneseBaseData;
    onBaseChange: <K extends keyof AnamneseBaseData>(
        key: K,
        value: AnamneseBaseData[K],
    ) => void;
    isEdit?: boolean;
}

export default function ClientAnamnesisForm({
    anamneseBase,
    onBaseChange,
    isEdit = false,
}: Props) {
    const { theme } = useTheme();

    const yesNoOptions = ['Não', 'Sim'];
    const painOptions = ['Baixa', 'Moderada', 'Alta'];
    const sportOptions = ['Não', 'Leve', 'Moderada', 'Intensa'];

    const historyOptions = [
        'Hipertensão',
        'Diabetes',
        'Problemas Cardíacos',
        'Convulsão',
        'Problemas Respiratórios',
        'Câncer',
        'Alergia Grave',
    ];

    const splitYesNoDetail = (raw: string) => {
        const value = raw || '';
        if (value.startsWith('Sim: ')) {
            return { selected: 'Sim', detail: value.slice('Sim: '.length) };
        }
        if (value === 'Sim') {
            return { selected: 'Sim', detail: '' };
        }
        return { selected: 'Não', detail: '' };
    };

    const serializeYesNoDetail = (selected: 'Sim' | 'Não', detail: string) => {
        if (selected === 'Não') return 'Não';
        return detail.trim() ? `Sim: ${detail}` : 'Sim: ';
    };

    const parseHistory = (raw: unknown) => {
        const selected = new Set<string>();
        let other = '';
        const tokens = Array.isArray(raw)
            ? raw
            : typeof raw === 'string'
              ? raw.split(',')
              : [];

        tokens.forEach(token => {
            const rawValue = String(token ?? '');
            const value = rawValue.trim();
            if (!value) return;

            // Accept both "Outros: texto" and the transient "Outros:" value
            // so the checkbox remains checked immediately after click.
            // Use rawValue (without trim) to preserve typed spaces in "Outros" text.
            if (/^\s*Outros:\s*/.test(rawValue)) {
                selected.add('Outros');
                other = rawValue.replace(/^\s*Outros:\s*/, '');
                return;
            }

            if (historyOptions.includes(value)) {
                selected.add(value);
            }
        });
        return { selected, other };
    };

    const serializeHistory = (selected: Set<string>, other: string) => {
        const values = historyOptions
            .filter(option => selected.has(option))
            .concat(selected.has('Outros') ? [`Outros: ${other}`] : []);
        return values.join(', ');
    };

    const medicationState = splitYesNoDetail(anamneseBase.takes_medication);
    const surgeryState = splitYesNoDetail(anamneseBase.had_surgery);
    const historyState = parseHistory(anamneseBase.clinical_history);

    const setYesNoField = (
        field: 'takes_medication' | 'had_surgery',
        selected: 'Sim' | 'Não',
        detail: string,
    ) => {
        onBaseChange(field, serializeYesNoDetail(selected, detail) as never);
    };

    const toggleHistoryOption = (option: string, checked: boolean) => {
        const nextSelected = new Set(historyState.selected);
        if (checked) {
            nextSelected.add(option);
        } else {
            nextSelected.delete(option);
        }
        onBaseChange(
            'clinical_history',
            serializeHistory(nextSelected, historyState.other) as never,
        );
    };

    const updateHistoryOther = (other: string) => {
        const nextSelected = new Set(historyState.selected);
        nextSelected.add('Outros');
        onBaseChange(
            'clinical_history',
            serializeHistory(nextSelected, other) as never,
        );
    };

    const clearHistoryOther = () => {
        const nextSelected = new Set(historyState.selected);
        nextSelected.delete('Outros');
        onBaseChange(
            'clinical_history',
            serializeHistory(nextSelected, '') as never,
        );
    };

    return (
        <div data-theme={theme} className={styles.wrapper}>
            <div className={styles.form}>
                <header className={styles.header}>
                    <span className={styles.eyebrow}>
                        {isEdit ? 'Editar / Apagar' : 'Cadastro'}
                    </span>
                    <h2 className={styles.title}>Anamnese Geral</h2>
                </header>
                <section className={styles.sector}>
                    <h3 className={styles.sectorTitle}>Saúde essencial</h3>
                    <div className={styles.fieldList}>
                        <div className={styles.fieldRow}>
                            <label className={styles.fieldLabel}>
                                Toma medicação?
                            </label>
                            <div className={styles.optionList}>
                                {yesNoOptions.map(option => (
                                    <label
                                        key={option}
                                        className={styles.optionItem}
                                    >
                                        <input
                                            className={styles.selectorControl}
                                            type='radio'
                                            name='takes_medication'
                                            checked={
                                                medicationState.selected ===
                                                option
                                            }
                                            onChange={() =>
                                                setYesNoField(
                                                    'takes_medication',
                                                    option as 'Sim' | 'Não',
                                                    medicationState.detail,
                                                )
                                            }
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>

                            {medicationState.selected === 'Sim' && (
                                <div className={styles.detailFieldRow}>
                                    <input
                                        type='text'
                                        className={styles.inlineTextInput}
                                        placeholder='Descreva a medicação...'
                                        value={medicationState.detail}
                                        onChange={e =>
                                            setYesNoField(
                                                'takes_medication',
                                                'Sim',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <div className={styles.fieldRow}>
                            <label className={styles.fieldLabel}>
                                Já fez cirurgia?
                            </label>
                            <div className={styles.optionList}>
                                {yesNoOptions.map(option => (
                                    <label
                                        key={option}
                                        className={styles.optionItem}
                                    >
                                        <input
                                            className={styles.selectorControl}
                                            type='radio'
                                            name='had_surgery'
                                            checked={
                                                surgeryState.selected === option
                                            }
                                            onChange={() =>
                                                setYesNoField(
                                                    'had_surgery',
                                                    option as 'Sim' | 'Não',
                                                    surgeryState.detail,
                                                )
                                            }
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>

                            {surgeryState.selected === 'Sim' && (
                                <div className={styles.detailFieldRow}>
                                    <textarea
                                        className={styles.textarea}
                                        rows={3}
                                        placeholder='Descreva cirurgias anteriores, datas e observações...'
                                        value={surgeryState.detail}
                                        onChange={e =>
                                            setYesNoField(
                                                'had_surgery',
                                                'Sim',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        <div className={styles.fieldRow}>
                            <label className={styles.fieldLabel}>
                                Gestação
                            </label>
                            <div className={styles.optionList}>
                                <label className={styles.optionItem}>
                                    <input
                                        className={styles.selectorControl}
                                        type='radio'
                                        name='is_pregnant'
                                        checked={
                                            anamneseBase.is_pregnant === true
                                        }
                                        onChange={() =>
                                            onBaseChange('is_pregnant', true)
                                        }
                                    />
                                    <span>Sim</span>
                                </label>
                                <label className={styles.optionItem}>
                                    <input
                                        className={styles.selectorControl}
                                        type='radio'
                                        name='is_pregnant'
                                        checked={
                                            anamneseBase.is_pregnant === false
                                        }
                                        onChange={() =>
                                            onBaseChange('is_pregnant', false)
                                        }
                                    />
                                    <span>Não</span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.fieldRow}>
                            <label className={styles.fieldLabel}>
                                Sensibilidade à dor
                            </label>
                            <div className={styles.optionList}>
                                {painOptions.map(option => (
                                    <label
                                        key={option}
                                        className={styles.optionItem}
                                    >
                                        <input
                                            className={styles.selectorControl}
                                            type='radio'
                                            name='pain_sensitivity'
                                            checked={
                                                anamneseBase.pain_sensitivity ===
                                                option
                                            }
                                            onChange={() =>
                                                onBaseChange(
                                                    'pain_sensitivity',
                                                    option,
                                                )
                                            }
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.fieldRow}>
                            <label className={styles.fieldLabel}>
                                Atividade esportiva
                            </label>
                            <div className={styles.optionList}>
                                {sportOptions.map(option => (
                                    <label
                                        key={option}
                                        className={styles.optionItem}
                                    >
                                        <input
                                            className={styles.selectorControl}
                                            type='radio'
                                            name='sport_activity'
                                            checked={
                                                anamneseBase.sport_activity ===
                                                option
                                            }
                                            onChange={() =>
                                                onBaseChange(
                                                    'sport_activity',
                                                    option,
                                                )
                                            }
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className={styles.fieldRow}>
                            <label className={styles.fieldLabel}>
                                Histórico clínico
                            </label>
                            <div className={styles.optionList}>
                                {historyOptions.map(option => (
                                    <label
                                        key={option}
                                        className={styles.optionItem}
                                    >
                                        <input
                                            className={styles.selectorControl}
                                            type='checkbox'
                                            name='clinical_history'
                                            checked={historyState.selected.has(
                                                option,
                                            )}
                                            onChange={e =>
                                                toggleHistoryOption(
                                                    option,
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}

                                <label className={styles.optionItem}>
                                    <input
                                        className={styles.selectorControl}
                                        type='checkbox'
                                        name='clinical_history_other'
                                        checked={historyState.selected.has(
                                            'Outros',
                                        )}
                                        onChange={e =>
                                            toggleHistoryOption(
                                                'Outros',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    <span>Outros</span>
                                </label>
                            </div>

                            {historyState.selected.has('Outros') && (
                                <div className={styles.otherInputRow}>
                                    <input
                                        type='text'
                                        className={styles.inlineTextInput}
                                        placeholder='Descreva outros históricos...'
                                        value={historyState.other}
                                        onChange={e =>
                                            updateHistoryOther(e.target.value)
                                        }
                                    />
                                    <button
                                        type='button'
                                        className={styles.clearOtherBtn}
                                        aria-label='Limpar histórico outros'
                                        onClick={clearHistoryOther}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
