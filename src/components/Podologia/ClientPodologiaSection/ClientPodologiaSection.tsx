import type { AnamnesePodologiaData } from '../../../types/ClientData';
import styles from './ClientPodologiaSection.module.css';

interface Props {
    values: AnamnesePodologiaData;
    onChange: <K extends keyof AnamnesePodologiaData>(
        field: K,
        value: AnamnesePodologiaData[K],
    ) => void;
}

const footwearOptions = [
    'Sapato baixo',
    'Tênis',
    'Chinelo',
    'Sandália',
    'Salto alto',
];

const sockOptions = ['Algodão', 'Sintética', 'Compressão', 'Sem meia'];

const sensitivityOptions = ['Normal', 'Alterado', 'Não avaliado'];

const nailOptions = [
    'onicofose',
    'onicocriptose',
    'onicomicose',
    'paroniquia',
    'onicocrifose',
];

function splitSingleChoiceWithOther(
    value: string | undefined | null,
    options: string[],
) {
    const v = value || '';
    const trimmed = v.trim();
    if (!trimmed) return { selected: '', other: '' };
    if (options.includes(trimmed)) {
        return { selected: trimmed, other: '' };
    }
    if (v.startsWith('Outros: ')) {
        return { selected: 'Outros', other: v.slice(8) };
    }
    if (trimmed === 'Outros' || trimmed === 'Outro') {
        return { selected: 'Outros', other: '' };
    }
    return { selected: 'Outros', other: v };
}

function serializeSingleChoiceWithOther(selected: string, other: string) {
    if (selected === 'Outros') {
        return other ? `Outros: ${other}` : 'Outros';
    }
    return selected;
}

function splitMultiChoiceWithOther(
    value: string | undefined | null,
    options: string[],
) {
    const selected = new Set<string>();
    let other = '';
    const raw = value || '';

    const tokens = raw.split(',');
    tokens.forEach(rawToken => {
        const token = rawToken.trim();
        if (!token) return;

        if (rawToken.includes('Outros: ')) {
            selected.add('Outros');
            const prefixIndex = rawToken.indexOf('Outros: ');
            other = rawToken.slice(prefixIndex + 8);
        } else if (token.startsWith('Outros: ')) {
            selected.add('Outros');
            other = token.slice(8);
        } else if (token === 'Outros' || token === 'Outro') {
            selected.add('Outros');
        } else if (options.includes(token)) {
            selected.add(token);
        } else {
            selected.add('Outros');
            other = other ? `${other}, ${rawToken}` : rawToken;
        }
    });
    return { selected, other };
}

function serializeMultiChoiceWithOther(
    options: string[],
    selected: Set<string>,
    other: string,
) {
    const parts: string[] = [];
    options.forEach(opt => {
        if (selected.has(opt)) {
            parts.push(opt);
        }
    });
    if (selected.has('Outros')) {
        parts.push(other ? `Outros: ${other}` : 'Outros');
    }
    return parts.join(', ');
}

export function ClientPodologiaSection({ values, onChange }: Props) {
    // 1. Calçado usado
    const footwearState = splitSingleChoiceWithOther(
        values.footwear_used,
        footwearOptions,
    );
    const setFootwear = (selected: string, other: string) => {
        onChange(
            'footwear_used',
            serializeSingleChoiceWithOther(selected, other),
        );
    };

    // 2. Meia usada
    const sockState = values.sock_used || '';

    // 3. Teste de sensibilidade
    const sensitivityState = splitSingleChoiceWithOther(
        values.sensitivity_test,
        sensitivityOptions,
    );
    const setSensitivity = (selected: string, other: string) => {
        onChange(
            'sensitivity_test',
            serializeSingleChoiceWithOther(selected, other),
        );
    };

    // 4. Alterações ungueais esquerda
    const nailLeftState = splitMultiChoiceWithOther(
        values.nail_changes_left,
        nailOptions,
    );
    const setNailLeft = (selected: Set<string>, other: string) => {
        onChange(
            'nail_changes_left',
            serializeMultiChoiceWithOther(nailOptions, selected, other),
        );
    };
    const toggleNailLeft = (option: string, checked: boolean) => {
        const next = new Set(nailLeftState.selected);
        if (checked) next.add(option);
        else next.delete(option);
        setNailLeft(next, nailLeftState.other);
    };

    // 5. Alterações ungueais direita
    const nailRightState = splitMultiChoiceWithOther(
        values.nail_changes_right,
        nailOptions,
    );
    const setNailRight = (selected: Set<string>, other: string) => {
        onChange(
            'nail_changes_right',
            serializeMultiChoiceWithOther(nailOptions, selected, other),
        );
    };
    const toggleNailRight = (option: string, checked: boolean) => {
        const next = new Set(nailRightState.selected);
        if (checked) next.add(option);
        else next.delete(option);
        setNailRight(next, nailRightState.other);
    };

    return (
        <div className={styles.podologiaGrid}>
            {/* Sector 1: Calçados */}
            <section className={styles.podologiaSectorCard}>
                <h3 className={styles.podologiaSectorTitle}>Calçados</h3>

                <div className={styles.podologiaField}>
                    <label className={styles.podologiaLabel}>
                        Calçado usado
                    </label>
                    <div className={styles.optionList}>
                        {footwearOptions.map(option => {
                            const isSelected =
                                footwearState.selected === option;
                            return (
                                <label
                                    key={option}
                                    className={styles.optionItem}
                                >
                                    <input
                                        type='radio'
                                        name='footwear_used'
                                        className={styles.selectorControl}
                                        checked={isSelected}
                                        onChange={() =>
                                            setFootwear(
                                                option,
                                                footwearState.other,
                                            )
                                        }
                                    />
                                    <span>{option}</span>
                                </label>
                            );
                        })}
                        <label className={styles.optionItem}>
                            <input
                                type='radio'
                                name='footwear_used'
                                className={styles.selectorControl}
                                checked={footwearState.selected === 'Outros'}
                                onChange={() =>
                                    setFootwear('Outros', footwearState.other)
                                }
                            />
                            <span>Outros</span>
                        </label>
                    </div>

                    {footwearState.selected === 'Outros' && (
                        <div className={styles.otherInputRow}>
                            <input
                                type='text'
                                className={styles.inlineTextInput}
                                placeholder='Especifique o calçado usado...'
                                value={footwearState.other}
                                onChange={e =>
                                    setFootwear('Outros', e.target.value)
                                }
                            />
                        </div>
                    )}
                </div>

                <div className={styles.podologiaField}>
                    <label className={styles.podologiaLabel}>
                        Meia utilizada
                    </label>
                    <div className={styles.optionList}>
                        {sockOptions.map(option => {
                            const isSelected = sockState === option;
                            return (
                                <label
                                    key={option}
                                    className={styles.optionItem}
                                >
                                    <input
                                        type='radio'
                                        name='sock_used'
                                        className={styles.selectorControl}
                                        checked={isSelected}
                                        onChange={() =>
                                            onChange('sock_used', option)
                                        }
                                    />
                                    <span>{option}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Sector 2: Condições de Sensibilidade */}
            <section className={styles.podologiaSectorCard}>
                <h3 className={styles.podologiaSectorTitle}>
                    Condições de sensibilidade
                </h3>

                <div className={styles.podologiaField}>
                    <div className={styles.optionList}>
                        {sensitivityOptions.map(option => {
                            const isSelected =
                                sensitivityState.selected === option;
                            return (
                                <label
                                    key={option}
                                    className={styles.optionItem}
                                >
                                    <input
                                        type='radio'
                                        name='sensitivity_test'
                                        className={styles.selectorControl}
                                        checked={isSelected}
                                        onChange={() =>
                                            setSensitivity(
                                                option,
                                                sensitivityState.other,
                                            )
                                        }
                                    />
                                    <span>{option}</span>
                                </label>
                            );
                        })}
                        <label className={styles.optionItem}>
                            <input
                                type='radio'
                                name='sensitivity_test'
                                className={styles.selectorControl}
                                checked={sensitivityState.selected === 'Outros'}
                                onChange={() =>
                                    setSensitivity(
                                        'Outros',
                                        sensitivityState.other,
                                    )
                                }
                            />
                            <span>Outros</span>
                        </label>
                    </div>

                    {sensitivityState.selected === 'Outros' && (
                        <div className={styles.otherInputRow}>
                            <input
                                type='text'
                                className={styles.inlineTextInput}
                                placeholder='Descreva as condições de sensibilidade...'
                                value={sensitivityState.other}
                                onChange={e =>
                                    setSensitivity('Outros', e.target.value)
                                }
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Sector 3: Alterações Ungueais Esquerda */}
            <section className={styles.podologiaSectorCard}>
                <h3 className={styles.podologiaSectorTitle}>
                    Alterações ungueais esquerda
                </h3>
                <div className={styles.podologiaField}>
                    <div className={styles.optionList}>
                        {nailOptions.map(option => {
                            const isChecked =
                                nailLeftState.selected.has(option);
                            return (
                                <label
                                    key={option}
                                    className={styles.optionItem}
                                >
                                    <input
                                        type='checkbox'
                                        className={styles.selectorControl}
                                        checked={isChecked}
                                        onChange={e =>
                                            toggleNailLeft(
                                                option,
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    <span>{option}</span>
                                </label>
                            );
                        })}
                        <label className={styles.optionItem}>
                            <input
                                type='checkbox'
                                className={styles.selectorControl}
                                checked={nailLeftState.selected.has('Outros')}
                                onChange={e =>
                                    toggleNailLeft('Outros', e.target.checked)
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
                                placeholder='Outras alterações pé esquerdo...'
                                value={nailLeftState.other}
                                onChange={e =>
                                    setNailLeft(
                                        nailLeftState.selected,
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Sector 4: Alterações Ungueais Direita */}
            <section className={styles.podologiaSectorCard}>
                <h3 className={styles.podologiaSectorTitle}>
                    Alterações ungueais direita
                </h3>
                <div className={styles.podologiaField}>
                    <div className={styles.optionList}>
                        {nailOptions.map(option => {
                            const isChecked =
                                nailRightState.selected.has(option);
                            return (
                                <label
                                    key={option}
                                    className={styles.optionItem}
                                >
                                    <input
                                        type='checkbox'
                                        className={styles.selectorControl}
                                        checked={isChecked}
                                        onChange={e =>
                                            toggleNailRight(
                                                option,
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    <span>{option}</span>
                                </label>
                            );
                        })}
                        <label className={styles.optionItem}>
                            <input
                                type='checkbox'
                                className={styles.selectorControl}
                                checked={nailRightState.selected.has('Outros')}
                                onChange={e =>
                                    toggleNailRight('Outros', e.target.checked)
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
                                placeholder='Outras alterações pé direito...'
                                value={nailRightState.other}
                                onChange={e =>
                                    setNailRight(
                                        nailRightState.selected,
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Sector 5: Pé Esquerdo (Avaliações Descritivas) */}
            <section className={styles.podologiaSectorCard}>
                <h3 className={styles.podologiaSectorTitle}>
                    Pé esquerdo (Exames físicos)
                </h3>

                <div className={styles.podologiaField}>
                    <label className={styles.podologiaLabel}>
                        Vista plantar
                    </label>
                    <textarea
                        className={styles.podologiaTextarea}
                        rows={3}
                        value={values.plantar_view_left}
                        onChange={e =>
                            onChange('plantar_view_left', e.target.value)
                        }
                        placeholder='Avaliação da vista plantar...'
                    />
                </div>

                <div className={styles.podologiaField}>
                    <label className={styles.podologiaLabel}>
                        Patologias dermatológicas
                    </label>
                    <textarea
                        className={styles.podologiaTextarea}
                        rows={3}
                        value={values.dermatological_pathologies_left}
                        onChange={e =>
                            onChange(
                                'dermatological_pathologies_left',
                                e.target.value,
                            )
                        }
                        placeholder='Observações dermatológicas...'
                    />
                </div>

                <div className={styles.podologiaField}>
                    <label className={styles.podologiaLabel}>
                        Deformidades
                    </label>
                    <textarea
                        className={styles.podologiaTextarea}
                        rows={3}
                        value={values.deformities_left}
                        onChange={e =>
                            onChange('deformities_left', e.target.value)
                        }
                        placeholder='Deformidades ósseas ou articulares...'
                    />
                </div>
            </section>

            {/* Sector 6: Pé Direito (Avaliações Descritivas) */}
            <section className={styles.podologiaSectorCard}>
                <h3 className={styles.podologiaSectorTitle}>
                    Pé direito (Exames físicos)
                </h3>

                <div className={styles.podologiaField}>
                    <label className={styles.podologiaLabel}>
                        Vista plantar
                    </label>
                    <textarea
                        className={styles.podologiaTextarea}
                        rows={3}
                        value={values.plantar_view_right}
                        onChange={e =>
                            onChange('plantar_view_right', e.target.value)
                        }
                        placeholder='Avaliação da vista plantar...'
                    />
                </div>

                <div className={styles.podologiaField}>
                    <label className={styles.podologiaLabel}>
                        Patologias dermatológicas
                    </label>
                    <textarea
                        className={styles.podologiaTextarea}
                        rows={3}
                        value={values.dermatological_pathologies_right}
                        onChange={e =>
                            onChange(
                                'dermatological_pathologies_right',
                                e.target.value,
                            )
                        }
                        placeholder='Observações dermatológicas...'
                    />
                </div>

                <div className={styles.podologiaField}>
                    <label className={styles.podologiaLabel}>
                        Deformidades
                    </label>
                    <textarea
                        className={styles.podologiaTextarea}
                        rows={3}
                        value={values.deformities_right}
                        onChange={e =>
                            onChange('deformities_right', e.target.value)
                        }
                        placeholder='Deformidades ósseas ou articulares...'
                    />
                </div>
            </section>

            {/* Sector 7: Observações e Outros Procedimentos */}
            <section
                className={styles.podologiaSectorCard}
                style={{ gridColumn: '1 / -1' }}
            >
                <h3 className={styles.podologiaSectorTitle}>Observações</h3>
                <div className={styles.podologiaField}>
                    <label className={styles.podologiaLabel}>
                        Outros procedimentos
                    </label>
                    <textarea
                        className={styles.podologiaTextarea}
                        rows={4}
                        value={values.other_procedures}
                        onChange={e =>
                            onChange('other_procedures', e.target.value)
                        }
                        placeholder='Descreva observações gerais ou outros procedimentos realizados...'
                    />
                </div>
            </section>
        </div>
    );
}
