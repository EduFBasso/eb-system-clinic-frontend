import React from 'react';
import type {
    TreatmentItem,
    CatalogServiceItem,
} from '../../pages/odontoArcadeHelpers';
import { normalizeMoneyInput } from '../../pages/odontoArcadeHelpers';
import styles from '../../styles/pages/OdontoArcadeSimplifiedPage.module.css';

function parseBRPrice(value: string): number {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

type Props = {
    item: TreatmentItem | null;
    name: string;
    value: string;
    notes: string;
    saving: boolean;
    serviceCatalog: CatalogServiceItem[];
    onValueChange: (value: string) => void;
    onNotesChange: (value: string) => void;
    onClose: () => void;
    onSave: (updateCatalog: boolean) => void;
};

export default function OdontoEditProcedureModal({
    item,
    name,
    value,
    notes,
    saving,
    serviceCatalog,
    onValueChange,
    onNotesChange,
    onClose,
    onSave,
}: Props) {
    const [updateCatalog, setUpdateCatalog] = React.useState(true);

    React.useEffect(() => {
        if (item) setUpdateCatalog(true);
    }, [item]);

    if (!item) return null;

    // Check if this item matches a catalog service
    const catalogItem = serviceCatalog.find(
        s => s.name.toLowerCase() === name.trim().toLowerCase(),
    );

    // Calculate if price differs from catalog
    const priceChangedFromCatalog =
        Boolean(catalogItem) &&
        Boolean(value.trim()) &&
        Math.abs(parseBRPrice(value) - Number(catalogItem?.base_price ?? 0)) >
            0.001;

    // Calculate if notes differ from catalog
    const notesChangedFromCatalog =
        Boolean(catalogItem) &&
        notes.trim() !== (catalogItem?.default_notes ?? '').trim();

    // Show checkbox only if either price or notes changed
    const showCatalogCheckbox =
        priceChangedFromCatalog || notesChangedFromCatalog;

    // Build dynamic checkbox label
    const checkboxLabel =
        priceChangedFromCatalog && notesChangedFromCatalog
            ? `Atualizar preço e observações de "${name.trim()}" no catálogo`
            : priceChangedFromCatalog
              ? `Atualizar preço de "${name.trim()}" no catálogo`
              : notesChangedFromCatalog
                ? `Atualizar observações de "${name.trim()}" no catálogo`
                : '';

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
                <h3 className={styles.sectionTitle}>Editar item</h3>

                <div className={styles.formGrid}>
                    <label className={styles.labelWide}>
                        Tratamento
                        <input
                            className={styles.input}
                            value={name}
                            readOnly
                            disabled={saving}
                        />
                    </label>
                    <label className={styles.label}>
                        Valor (R$)
                        <input
                            className={styles.input}
                            inputMode='decimal'
                            value={value}
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

                    {showCatalogCheckbox && (
                        <label
                            className={`${styles.labelWide} ${styles.catalogCheckboxLabel}`}
                        >
                            <span className={styles.catalogCheckboxBox}>
                                <input
                                    type='checkbox'
                                    className={styles.catalogCheckboxInput}
                                    checked={updateCatalog}
                                    disabled={saving}
                                    onChange={event =>
                                        setUpdateCatalog(event.target.checked)
                                    }
                                />
                                <span
                                    className={styles.catalogCheckboxMark}
                                    aria-hidden='true'
                                >
                                    {updateCatalog && (
                                        <svg viewBox='0 0 12 10' fill='none'>
                                            <polyline
                                                points='1.5,5.5 4.5,8.5 10.5,1.5'
                                                stroke='currentColor'
                                                strokeWidth='2'
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                            />
                                        </svg>
                                    )}
                                </span>
                            </span>
                            <span className={styles.catalogCheckboxText}>
                                {checkboxLabel}
                            </span>
                        </label>
                    )}
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
                        onClick={() =>
                            onSave(showCatalogCheckbox && updateCatalog)
                        }
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
}
