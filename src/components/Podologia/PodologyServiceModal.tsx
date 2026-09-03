import React from 'react';
import { PodologyMemberGrid } from './PodologyMemberGrid';
import type { CatalogServiceItem } from '../../utils/TreatmentHelpers';
import { normalizeMoneyInput } from '../../utils/TreatmentHelpers';
import type {
    PodologyScope,
    PodologyServiceRow,
} from './PodologyAnatomyHelpers';
import { filterPodologyServiceCatalog } from './PodologyAnatomyHelpers';
import { toInputAmount } from '../../utils/currency';
import styles from '../../pages/TreatmentWorkspacePage.module.css';

type Props = {
    open: boolean;
    saving: boolean;
    serviceRows: PodologyServiceRow[];
    serviceCatalog: CatalogServiceItem[];
    onClose: () => void;
    onSave: (catalogIndexes: number[]) => void;
    onToggleRegion: (id: number, scope: PodologyScope) => void;
    onUpdateRow: (index: number, patch: Partial<PodologyServiceRow>) => void;
    onAddGeneralRow: () => void;
    onRemoveRow: (index: number) => void;
    /** Called when the user clicks the delete icon on a catalog suggestion. */
    onDeleteFromCatalog: (serviceId: number) => void;
};

/**
 * Modal de procedimentos de podologia (dedos/mãos/pés).
 * Persiste via podology_context no endpoint canônico /clinic/treatment/items/.
 */
export default function PodologyServiceModal({
    open,
    saving,
    serviceRows,
    serviceCatalog,
    onClose,
    onSave,
    onToggleRegion,
    onUpdateRow,
    onAddGeneralRow,
    onRemoveRow,
    onDeleteFromCatalog,
}: Props) {
    const [openDropdownIndex, setOpenDropdownIndex] = React.useState<
        number | null
    >(null);
    const [includeInCatalog, setIncludeInCatalog] = React.useState<
        Record<number, boolean>
    >({});

    React.useEffect(() => {
        if (!open) setIncludeInCatalog({});
    }, [open]);

    if (!open) return null;

    const selectedIds = serviceRows
        .filter(row => row.locationNumber != null)
        .map(row => row.locationNumber as number);

    function handleSave() {
        const catalogIndexes = serviceRows
            .map((row, index) => ({ row, index }))
            .filter(
                ({ row, index }) =>
                    Boolean(row.treatment.trim()) &&
                    !serviceCatalog.some(
                        item =>
                            item.name.trim().toLowerCase() ===
                            row.treatment.trim().toLowerCase(),
                    ) &&
                    includeInCatalog[index] !== false,
            )
            .map(({ index }) => index);
        onSave(catalogIndexes);
    }

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
                <h3 className={styles.sectionTitle}>Novo Procedimento</h3>

                <div className={styles.modalToothSelector}>
                    <PodologyMemberGrid
                        selectedIds={selectedIds}
                        onToggleRegion={onToggleRegion}
                    />
                </div>

                {serviceRows.length === 0 && (
                    <p className={styles.textMuted}>
                        Toque nas regiões do mapa para adicionar itens, ou
                        inclua um item geral.
                    </p>
                )}

                <div className={styles.modalRows}>
                    {serviceRows.map((row, index) => {
                        const suggestions = filterPodologyServiceCatalog(
                            serviceCatalog,
                            row.treatment,
                        );
                        const catalogItem = serviceCatalog.find(
                            item =>
                                item.name.trim().toLowerCase() ===
                                row.treatment.trim().toLowerCase(),
                        );
                        const showCatalogCheckbox =
                            Boolean(row.treatment.trim()) && !catalogItem;

                        return (
                            <div key={index} className={styles.modalRow}>
                                <div className={styles.modalRowHeader}>
                                    <strong>{row.regionLabel}</strong>
                                    <button
                                        type='button'
                                        className={styles.btn}
                                        onClick={() => onRemoveRow(index)}
                                        disabled={saving}
                                    >
                                        Remover
                                    </button>
                                </div>

                                <div className={styles.formGrid}>
                                    <label className={styles.label}>
                                        Procedimento
                                        <div
                                            className={styles.autocompleteWrap}
                                        >
                                            <input
                                                className={styles.input}
                                                value={row.treatment}
                                                onFocus={() =>
                                                    setOpenDropdownIndex(index)
                                                }
                                                onBlur={() =>
                                                    window.setTimeout(() => {
                                                        setOpenDropdownIndex(
                                                            current =>
                                                                current ===
                                                                index
                                                                    ? null
                                                                    : current,
                                                        );
                                                    }, 160)
                                                }
                                                onChange={event => {
                                                    onUpdateRow(index, {
                                                        treatment:
                                                            event.target.value,
                                                        serviceId: null,
                                                    });
                                                    setOpenDropdownIndex(index);
                                                }}
                                                disabled={saving}
                                                autoComplete='off'
                                                placeholder='Ex.: Corte de unha encravada'
                                            />
                                            {openDropdownIndex === index &&
                                                suggestions.length > 0 && (
                                                    <div
                                                        className={
                                                            styles.autocompleteList
                                                        }
                                                    >
                                                        {suggestions.map(
                                                            item => (
                                                                <div
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className={
                                                                        styles.autocompleteRow
                                                                    }
                                                                >
                                                                    <button
                                                                        type='button'
                                                                        className={
                                                                            styles.autocompleteItem
                                                                        }
                                                                        onMouseDown={event =>
                                                                            event.preventDefault()
                                                                        }
                                                                        onClick={() => {
                                                                            onUpdateRow(
                                                                                index,
                                                                                {
                                                                                    treatment:
                                                                                        item.name,
                                                                                    serviceId:
                                                                                        item.id,
                                                                                    ...(item.base_price !=
                                                                                        null &&
                                                                                        !row.value.trim() && {
                                                                                            value: toInputAmount(
                                                                                                item.base_price,
                                                                                            ),
                                                                                        }),
                                                                                    ...(!row.notes.trim() &&
                                                                                        (item.description ??
                                                                                            item.default_notes) && {
                                                                                            notes:
                                                                                                item.description ??
                                                                                                item.default_notes,
                                                                                        }),
                                                                                },
                                                                            );
                                                                            setOpenDropdownIndex(
                                                                                null,
                                                                            );
                                                                        }}
                                                                    >
                                                                        {
                                                                            item.name
                                                                        }
                                                                        {item.base_price !=
                                                                            null &&
                                                                            Number(
                                                                                item.base_price,
                                                                            ) >
                                                                                0 && (
                                                                                <span
                                                                                    className={
                                                                                        styles.autocompleteHint
                                                                                    }
                                                                                >
                                                                                    {' '}
                                                                                    R${' '}
                                                                                    {toInputAmount(
                                                                                        item.base_price,
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                    </button>
                                                                    <button
                                                                        type='button'
                                                                        className={
                                                                            styles.autocompleteDeleteBtn
                                                                        }
                                                                        onMouseDown={event =>
                                                                            event.preventDefault()
                                                                        }
                                                                        onClick={() =>
                                                                            onDeleteFromCatalog(
                                                                                item.id,
                                                                            )
                                                                        }
                                                                        aria-label={`Remover ${item.name} do catálogo`}
                                                                        title='Remover do catálogo'
                                                                    >
                                                                        <svg
                                                                            viewBox='0 0 24 24'
                                                                            aria-hidden='true'
                                                                        >
                                                                            <path
                                                                                d='M8.5 3.8A1.8 1.8 0 0 0 6.7 5.6V7H4.4a1 1 0 1 0 0 2h.7l.8 10.3a2.6 2.6 0 0 0 2.6 2.4h7a2.6 2.6 0 0 0 2.6-2.4L18.9 9h.7a1 1 0 1 0 0-2h-2.3V5.6a1.8 1.8 0 0 0-1.8-1.8h-7zm.2 3.2V5.8h6.6V7H8.7zm1.2 4.1a1 1 0 0 1 1 1v5.3a1 1 0 1 1-2 0v-5.3a1 1 0 0 1 1-1zm4.2 0a1 1 0 0 1 1 1v5.3a1 1 0 1 1-2 0v-5.3a1 1 0 0 1 1-1z'
                                                                                fill='currentColor'
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </label>

                                    <label className={styles.label}>
                                        Valor (R$)
                                        <input
                                            className={styles.input}
                                            inputMode='decimal'
                                            value={row.value}
                                            placeholder='0,00'
                                            onChange={event =>
                                                onUpdateRow(index, {
                                                    value: event.target.value,
                                                })
                                            }
                                            onBlur={event =>
                                                onUpdateRow(index, {
                                                    value: normalizeMoneyInput(
                                                        event.target.value,
                                                    ),
                                                })
                                            }
                                            disabled={saving}
                                        />
                                    </label>

                                    <label className={styles.labelWide}>
                                        Observações
                                        <textarea
                                            className={styles.textarea}
                                            rows={2}
                                            value={row.notes}
                                            onChange={event =>
                                                onUpdateRow(index, {
                                                    notes: event.target.value,
                                                })
                                            }
                                            disabled={saving}
                                        />
                                    </label>

                                    {showCatalogCheckbox && (
                                        <label
                                            className={`${styles.labelWide} ${styles.catalogCheckboxLabel}`}
                                        >
                                            <span
                                                className={
                                                    styles.catalogCheckboxBox
                                                }
                                            >
                                                <input
                                                    type='checkbox'
                                                    className={
                                                        styles.catalogCheckboxInput
                                                    }
                                                    checked={
                                                        includeInCatalog[
                                                            index
                                                        ] !== false
                                                    }
                                                    onChange={event =>
                                                        setIncludeInCatalog(
                                                            previous => ({
                                                                ...previous,
                                                                [index]:
                                                                    event.target
                                                                        .checked,
                                                            }),
                                                        )
                                                    }
                                                    disabled={saving}
                                                />
                                                <span
                                                    className={
                                                        styles.catalogCheckboxMark
                                                    }
                                                    aria-hidden='true'
                                                >
                                                    {includeInCatalog[index] !==
                                                        false && '✓'}
                                                </span>
                                            </span>
                                            <span
                                                className={
                                                    styles.catalogCheckboxText
                                                }
                                            >
                                                Adicionar ao catálogo geral
                                            </span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.modalActions}>
                    <button
                        type='button'
                        className={styles.btn}
                        onClick={onAddGeneralRow}
                        disabled={saving}
                    >
                        + Item Geral
                    </button>
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
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
