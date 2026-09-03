import type { TreatmentItem } from '../../utils/TreatmentHelpers';
import { normalizeMoneyInput } from '../../utils/TreatmentHelpers';
import { PODOLOGY_SCOPE_OPTIONS } from './PodologyAnatomyHelpers';
import styles from '../../pages/TreatmentWorkspacePage.module.css';

type Props = {
    item: TreatmentItem | null;
    name: string;
    value: string;
    notes: string;
    saving: boolean;
    onValueChange: (value: string) => void;
    onNotesChange: (value: string) => void;
    onClose: () => void;
    onSave: () => void;
};

export default function PodologyEditProcedureModal({
    item,
    name,
    value,
    notes,
    saving,
    onValueChange,
    onNotesChange,
    onClose,
    onSave,
}: Props) {
    if (!item) return null;

    const ctx = item.podology_context;
    const scopeLabel = ctx
        ? PODOLOGY_SCOPE_OPTIONS.find(option => option.value === ctx.scope)
              ?.label
        : null;
    const anatomicalLabel =
        scopeLabel && ctx?.location_number != null
            ? `${scopeLabel} — Região ${ctx.location_number}`
            : scopeLabel;

    return (
        <div
            className={styles.modalOverlay}
            role='presentation'
            onClick={onClose}
        >
            <div
                className={styles.modalCard}
                role='dialog'
                onClick={event => event.stopPropagation()}
            >
                <h3 className={styles.sectionTitle}>Editar Item</h3>
                {anatomicalLabel && (
                    <p className={styles.textMuted}>{anatomicalLabel}</p>
                )}

                <div className={styles.formGrid}>
                    <label className={styles.labelWide}>
                        Procedimento
                        <input className={styles.input} value={name} disabled />
                    </label>

                    <label className={styles.label}>
                        Valor (R$)
                        <input
                            className={styles.input}
                            inputMode='decimal'
                            value={value}
                            placeholder='0,00'
                            onChange={event =>
                                onValueChange(event.target.value)
                            }
                            onBlur={event =>
                                onValueChange(
                                    normalizeMoneyInput(event.target.value),
                                )
                            }
                            disabled={saving}
                        />
                    </label>

                    <label className={styles.labelWide}>
                        Observações
                        <textarea
                            className={styles.textarea}
                            rows={3}
                            value={notes}
                            onChange={event =>
                                onNotesChange(event.target.value)
                            }
                            disabled={saving}
                        />
                    </label>
                </div>

                <div className={styles.modalActions}>
                    <button
                        type='button'
                        className={styles.btn}
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </button>
                    <button
                        type='button'
                        className={styles.btnPrimary}
                        onClick={onSave}
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
