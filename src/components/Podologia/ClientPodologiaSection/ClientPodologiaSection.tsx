import type { AnamnesePodologiaData } from '../../../types/ClientData';
import styles from './ClientPodologiaSection.module.css';

interface Props {
    values: AnamnesePodologiaData;
    onChange: <K extends keyof AnamnesePodologiaData>(
        field: K,
        value: AnamnesePodologiaData[K],
    ) => void;
}

const sections: Array<{
    title: string;
    fields: Array<{
        key: keyof AnamnesePodologiaData;
        label: string;
        multiline?: boolean;
    }>;
}> = [
    {
        title: 'Hábitos e avaliação geral',
        fields: [
            { key: 'footwear_used', label: 'Calçado utilizado' },
            { key: 'sock_used', label: 'Meia utilizada' },
            {
                key: 'sensitivity_test',
                label: 'Teste de sensibilidade',
                multiline: true,
            },
            {
                key: 'other_procedures',
                label: 'Outros procedimentos',
                multiline: true,
            },
        ],
    },
    {
        title: 'Pé esquerdo',
        fields: [
            {
                key: 'plantar_view_left',
                label: 'Vista plantar',
                multiline: true,
            },
            {
                key: 'dermatological_pathologies_left',
                label: 'Patologias dermatológicas',
                multiline: true,
            },
            {
                key: 'nail_changes_left',
                label: 'Alterações ungueais',
                multiline: true,
            },
            {
                key: 'deformities_left',
                label: 'Deformidades',
                multiline: true,
            },
        ],
    },
    {
        title: 'Pé direito',
        fields: [
            {
                key: 'plantar_view_right',
                label: 'Vista plantar',
                multiline: true,
            },
            {
                key: 'dermatological_pathologies_right',
                label: 'Patologias dermatológicas',
                multiline: true,
            },
            {
                key: 'nail_changes_right',
                label: 'Alterações ungueais',
                multiline: true,
            },
            {
                key: 'deformities_right',
                label: 'Deformidades',
                multiline: true,
            },
        ],
    },
];

export function ClientPodologiaSection({ values, onChange }: Props) {
    return (
        <div className={styles.podologiaGrid}>
            {sections.map(section => (
                <section
                    key={section.title}
                    className={styles.podologiaSectorCard}
                >
                    <h3 className={styles.podologiaSectorTitle}>
                        {section.title}
                    </h3>
                    {section.fields.map(field => (
                        <div key={field.key} className={styles.podologiaField}>
                            <label
                                className={styles.podologiaLabel}
                                htmlFor={`podologia-${field.key}`}
                            >
                                {field.label}
                            </label>
                            {field.multiline ? (
                                <textarea
                                    id={`podologia-${field.key}`}
                                    className={styles.podologiaTextarea}
                                    rows={3}
                                    value={values[field.key]}
                                    onChange={event =>
                                        onChange(field.key, event.target.value)
                                    }
                                />
                            ) : (
                                <input
                                    id={`podologia-${field.key}`}
                                    type='text'
                                    className={styles.inlineTextInput}
                                    value={values[field.key]}
                                    onChange={event =>
                                        onChange(field.key, event.target.value)
                                    }
                                />
                            )}
                        </div>
                    ))}
                </section>
            ))}
        </div>
    );
}
