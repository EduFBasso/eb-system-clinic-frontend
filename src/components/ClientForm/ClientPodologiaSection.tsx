import type { AnamnesePodologiaData } from '../../types/ClientData';
import styles from './ClientForm.module.css';

interface Props {
    anamnesePodologia: AnamnesePodologiaData;
    onPodologiaChange: <K extends keyof AnamnesePodologiaData>(
        key: K,
        value: AnamnesePodologiaData[K],
    ) => void;
}

const footwearOptions = [
    'Sapato baixo',
    'Tênis',
    'Chinelo',
    'Sandália',
    'Salto alto',
    'Outros',
];
const sockOptions = ['Algodão', 'Sintética', 'Compressão', 'Sem meia'];
const sensitivityOptions = ['Normal', 'Alterado', 'Não avaliado', 'Outros'];
const nailOptions = [
    'onicofose',
    'onicocriptose',
    'onicomicose',
    'paroníquia',
    'onicocrifose',
];

function parseOtherSelection(raw: string, options: string[]) {
    if (!raw) return { selected: '', other: '' };
    if (raw.startsWith('Outros: ')) {
        return { selected: 'Outros', other: raw.slice('Outros: '.length) };
    }
    if (options.includes(raw)) {
        return { selected: raw, other: '' };
    }
    return { selected: 'Outros', other: raw };
}

function parseCheckboxWithOther(raw: string, options: string[]) {
    const selected = new Set<string>();
    let other = '';
    const optionMap = new Map(
        options.map(option => [option.toLowerCase(), option]),
    );

    (raw || '')
        .split(',')
        .map(token => token.trim())
        .filter(Boolean)
        .forEach(token => {
            if (/^Outros:\s*/i.test(token)) {
                selected.add('Outros');
                other = token.replace(/^Outros:\s*/i, '');
                return;
            }
            const canonical = optionMap.get(token.toLowerCase());
            if (canonical) selected.add(canonical);
        });

    return { selected, other };
}

function serializeCheckboxWithOther(
    selected: Set<string>,
    other: string,
    options: string[],
) {
    const values = options.filter(option => selected.has(option));
    if (selected.has('Outros')) {
        values.push(`Outros: ${other}`);
    }
    return values.join(', ');
}

export default function ClientPodologiaSection({
    anamnesePodologia,
    onPodologiaChange,
}: Props) {
    const footwearSelection = parseOtherSelection(
        anamnesePodologia.footwear_used,
        footwearOptions,
    );
    const sockSelection = parseOtherSelection(
        anamnesePodologia.sock_used,
        sockOptions,
    );
    const sensitivitySelection = parseOtherSelection(
        anamnesePodologia.sensitivity_test,
        sensitivityOptions,
    );
    const nailLeftState = parseCheckboxWithOther(
        anamnesePodologia.nail_changes_left,
        nailOptions,
    );
    const nailRightState = parseCheckboxWithOther(
        anamnesePodologia.nail_changes_right,
        nailOptions,
    );

    const setSelectionWithOther = (
        field: 'footwear_used' | 'sock_used' | 'sensitivity_test',
        option: string,
    ) => {
        if (option === 'Outros') {
            onPodologiaChange(
                field,
                'Outros: ' as AnamnesePodologiaData[typeof field],
            );
            return;
        }
        onPodologiaChange(field, option as AnamnesePodologiaData[typeof field]);
    };

    const toggleNailOption = (
        field: 'nail_changes_left' | 'nail_changes_right',
        state: { selected: Set<string>; other: string },
        option: string,
        checked: boolean,
    ) => {
        const nextSelected = new Set(state.selected);
        if (checked) {
            nextSelected.add(option);
        } else {
            nextSelected.delete(option);
        }
        onPodologiaChange(
            field,
            serializeCheckboxWithOther(
                nextSelected,
                state.other,
                nailOptions,
            ) as AnamnesePodologiaData[typeof field],
        );
    };

    const updateNailOther = (
        field: 'nail_changes_left' | 'nail_changes_right',
        state: { selected: Set<string>; other: string },
        other: string,
    ) => {
        const nextSelected = new Set(state.selected);
        nextSelected.add('Outros');
        onPodologiaChange(
            field,
            serializeCheckboxWithOther(
                nextSelected,
                other,
                nailOptions,
            ) as AnamnesePodologiaData[typeof field],
        );
    };

    const clearNailOther = (
        field: 'nail_changes_left' | 'nail_changes_right',
        state: { selected: Set<string>; other: string },
    ) => {
        const nextSelected = new Set(state.selected);
        nextSelected.delete('Outros');
        onPodologiaChange(
            field,
            serializeCheckboxWithOther(
                nextSelected,
                '',
                nailOptions,
            ) as AnamnesePodologiaData[typeof field],
        );
    };

    return (
        <div className={styles.podologiaGrid}>
            <div
                className={`${styles.podologiaField} ${styles.pFieldFootwear}`}
            >
                <label className={styles.podologiaLabel}>Calçado usado</label>
                <div className={styles.optionList}>
                    {footwearOptions.map(option => (
                        <label key={option} className={styles.optionItem}>
                            <input
                                className={styles.selectorControl}
                                type='radio'
                                name='footwear_used'
                                checked={footwearSelection.selected === option}
                                onChange={() =>
                                    setSelectionWithOther(
                                        'footwear_used',
                                        option,
                                    )
                                }
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
                {footwearSelection.selected === 'Outros' && (
                    <div className={styles.otherInputRow}>
                        <input
                            type='text'
                            className={styles.inlineTextInput}
                            placeholder='Descreva o calçado...'
                            value={footwearSelection.other}
                            onChange={e =>
                                onPodologiaChange(
                                    'footwear_used',
                                    `Outros: ${e.target.value}`,
                                )
                            }
                        />
                        <button
                            type='button'
                            className={styles.clearOtherBtn}
                            aria-label='Limpar calçado outros'
                            onClick={() =>
                                onPodologiaChange('footwear_used', '')
                            }
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            <div className={`${styles.podologiaField} ${styles.pFieldSock}`}>
                <label className={styles.podologiaLabel}>Meia usada</label>
                <div className={styles.optionList}>
                    {sockOptions.map(option => (
                        <label key={option} className={styles.optionItem}>
                            <input
                                className={styles.selectorControl}
                                type='radio'
                                name='sock_used'
                                checked={sockSelection.selected === option}
                                onChange={() =>
                                    setSelectionWithOther('sock_used', option)
                                }
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div
                className={`${styles.podologiaField} ${styles.pFieldSensitivity}`}
            >
                <label className={styles.podologiaLabel}>
                    Condições de sensibilidade
                </label>
                <div className={styles.optionList}>
                    {sensitivityOptions.map(option => (
                        <label key={option} className={styles.optionItem}>
                            <input
                                className={styles.selectorControl}
                                type='radio'
                                name='sensitivity_test'
                                checked={
                                    sensitivitySelection.selected === option
                                }
                                onChange={() =>
                                    setSelectionWithOther(
                                        'sensitivity_test',
                                        option,
                                    )
                                }
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
                {sensitivitySelection.selected === 'Outros' && (
                    <div className={styles.otherInputRow}>
                        <input
                            type='text'
                            className={styles.inlineTextInput}
                            placeholder='Descreva a condição...'
                            value={sensitivitySelection.other}
                            onChange={e =>
                                onPodologiaChange(
                                    'sensitivity_test',
                                    `Outros: ${e.target.value}`,
                                )
                            }
                        />
                        <button
                            type='button'
                            className={styles.clearOtherBtn}
                            aria-label='Limpar condição outros'
                            onClick={() =>
                                onPodologiaChange('sensitivity_test', '')
                            }
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            <div
                className={`${styles.podologiaField} ${styles.pFieldNailLeft}`}
            >
                <label className={styles.podologiaLabel}>
                    Alterações ungueais esquerda
                </label>
                <div className={styles.optionList}>
                    {nailOptions.map(option => (
                        <label
                            key={`left-${option}`}
                            className={styles.optionItem}
                        >
                            <input
                                className={styles.selectorControl}
                                type='checkbox'
                                name='nail_changes_left'
                                checked={nailLeftState.selected.has(option)}
                                onChange={e =>
                                    toggleNailOption(
                                        'nail_changes_left',
                                        nailLeftState,
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
                            name='nail_changes_left_other'
                            checked={nailLeftState.selected.has('Outros')}
                            onChange={e =>
                                toggleNailOption(
                                    'nail_changes_left',
                                    nailLeftState,
                                    'Outros',
                                    e.target.checked,
                                )
                            }
                        />
                        <span>Outros</span>
                    </label>
                </div>
                {nailLeftState.selected.has('Outros') && (
                    <div className={styles.otherInputRow}>
                        <input
                            type='text'
                            className={styles.inlineTextInput}
                            placeholder='Descreva outras alterações...'
                            value={nailLeftState.other}
                            onChange={e =>
                                updateNailOther(
                                    'nail_changes_left',
                                    nailLeftState,
                                    e.target.value,
                                )
                            }
                        />
                        <button
                            type='button'
                            className={styles.clearOtherBtn}
                            aria-label='Limpar alterações esquerda outros'
                            onClick={() =>
                                clearNailOther(
                                    'nail_changes_left',
                                    nailLeftState,
                                )
                            }
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            <div
                className={`${styles.podologiaField} ${styles.pFieldNailRight}`}
            >
                <label className={styles.podologiaLabel}>
                    Alterações ungueais direita
                </label>
                <div className={styles.optionList}>
                    {nailOptions.map(option => (
                        <label
                            key={`right-${option}`}
                            className={styles.optionItem}
                        >
                            <input
                                className={styles.selectorControl}
                                type='checkbox'
                                name='nail_changes_right'
                                checked={nailRightState.selected.has(option)}
                                onChange={e =>
                                    toggleNailOption(
                                        'nail_changes_right',
                                        nailRightState,
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
                            name='nail_changes_right_other'
                            checked={nailRightState.selected.has('Outros')}
                            onChange={e =>
                                toggleNailOption(
                                    'nail_changes_right',
                                    nailRightState,
                                    'Outros',
                                    e.target.checked,
                                )
                            }
                        />
                        <span>Outros</span>
                    </label>
                </div>
                {nailRightState.selected.has('Outros') && (
                    <div className={styles.otherInputRow}>
                        <input
                            type='text'
                            className={styles.inlineTextInput}
                            placeholder='Descreva outras alterações...'
                            value={nailRightState.other}
                            onChange={e =>
                                updateNailOther(
                                    'nail_changes_right',
                                    nailRightState,
                                    e.target.value,
                                )
                            }
                        />
                        <button
                            type='button'
                            className={styles.clearOtherBtn}
                            aria-label='Limpar alterações direita outros'
                            onClick={() =>
                                clearNailOther(
                                    'nail_changes_right',
                                    nailRightState,
                                )
                            }
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>

            <div
                className={`${styles.podologiaField} ${styles.pFieldProcedures}`}
            >
                <label className={styles.podologiaLabel}>
                    Outros procedimentos
                </label>
                <textarea
                    className={styles.podologiaTextarea}
                    rows={4}
                    value={anamnesePodologia.other_procedures}
                    placeholder='Registre procedimentos adicionais e evolução clínica...'
                    onChange={e =>
                        onPodologiaChange('other_procedures', e.target.value)
                    }
                />
            </div>
        </div>
    );
}
