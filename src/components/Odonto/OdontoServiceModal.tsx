import React from 'react';
import { OdontoToothGrid } from './OdontoToothGrid/OdontoToothGrid';
import type { CatalogServiceItem } from '../../utils/TreatmentHelpers';
import { normalizeMoneyInput } from '../../utils/TreatmentHelpers';
import type {
    ServiceFlowType,
    ServiceRow,
    ToothItem,
} from './OdontoAnatomyHelpers';
import {
    ARCH_OPTIONS,
    filterServiceCatalog,
    SURFACE_OPTIONS,
} from './OdontoAnatomyHelpers';
import { toInputAmount } from '../../utils/currency';
import styles from '../Shared/TreatmentWorkspacePage/TreatmentWorkspacePage.module.css';

type Props = {
    open: boolean;
    saving: boolean;
    flowType: ServiceFlowType;
    serviceRows: ServiceRow[];
    orderedTeeth: ToothItem[];
    serviceCatalog: CatalogServiceItem[];
    onClose: () => void;
    onSave: (catalogIndexes: number[]) => void;
    onFlowTypeChange: (type: ServiceFlowType) => void;
    onUpdateRow: (index: number, patch: Partial<ServiceRow>) => void;
    /** Toggles the service row for a given FDI tooth number. */
    onToggleToothRow: (toothNumber: number) => void;
    onAddItem: () => void;
    /** Called when the user clicks the delete icon on a catalog suggestion. */
    onDeleteFromCatalog: (serviceId: number) => void;
};

export default function OdontoServiceModal({
    open,
    saving,
    flowType,
    serviceRows,
    orderedTeeth,
    serviceCatalog,
    onClose,
    onSave,
    onFlowTypeChange,
    onUpdateRow,
    onToggleToothRow,
    onAddItem,
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

    const selectedToothNumbers = new Set(
        serviceRows
            .filter(row => row.scope === 'tooth' && row.toothNumber != null)
            .map(row => row.toothNumber as number),
    );
    const toothFlowStarted =
        flowType === 'tooth' && selectedToothNumbers.size > 0;
    const archFlowStarted =
        flowType === 'arch' && serviceRows.some(row => Boolean(row.arcadeArch));
    const otherFlowStarted =
        flowType === 'other' &&
        serviceRows.some(
            row => Boolean(row.treatment.trim()) || Boolean(row.value.trim()),
        );
    const flowLocked = toothFlowStarted || archFlowStarted || otherFlowStarted;

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
                <h3 className={styles.sectionTitle}>Novo Tratamento</h3>

                <div className={styles.typeTabs}>
                    {(['tooth', 'arch', 'other'] as ServiceFlowType[]).map(
                        type =>
                            (!flowLocked || type === flowType) && (
                                <button
                                    key={type}
                                    type='button'
                                    onClick={() => onFlowTypeChange(type)}
                                    className={`${styles.tabBtn} ${flowType === type ? styles.tabActive : ''}`}
                                    disabled={saving}
                                >
                                    {type === 'tooth'
                                        ? 'Por dente'
                                        : type === 'arch'
                                          ? 'Arcada'
                                          : 'Outros'}
                                </button>
                            ),
                    )}
                </div>

                {flowType === 'tooth' && (
                    <div className={styles.modalToothSelector}>
                        <OdontoToothGrid
                            orderedTeeth={orderedTeeth}
                            selectedToothNumber={null}
                            suppressDateHighlights={false}
                            activeDateToothNumbers={selectedToothNumbers}
                            onToothClick={onToggleToothRow}
                        />
                    </div>
                )}

                {flowType === 'tooth' && serviceRows.length === 0 && (
                    <p className={styles.textMuted}>
                        Toque nos dentes do mapa para adicionar itens de
                        tratamento.
                    </p>
                )}

                <div className={styles.modalRows}>
                    {serviceRows.map((row, index) => {
                        const suggestions = filterServiceCatalog(
                            serviceCatalog,
                            row.treatment,
                            flowType,
                        );
                        const catalogItem = serviceCatalog.find(
                            s =>
                                s.treatment_scopes.includes(flowType) &&
                                s.name.trim().toLowerCase() ===
                                    row.treatment.trim().toLowerCase(),
                        );
                        const showCatalogCheckbox =
                            Boolean(row.treatment.trim()) && !catalogItem;

                        return (
                            <div key={index} className={styles.modalRow}>
                                <div className={styles.modalRowHeader}>
                                    <strong>
                                        {row.scope === 'tooth' &&
                                        row.toothNumber != null
                                            ? `Dente ${row.toothNumber}`
                                            : `Item ${index + 1}`}
                                    </strong>
                                    {row.scope === 'tooth' && (
                                        <label
                                            className={styles.phaseInlineLabel}
                                        >
                                            Faces (opcional)
                                            <select
                                                className={`${styles.input} ${styles.phaseSelect}`}
                                                value={row.toothSurface}
                                                onChange={event =>
                                                    onUpdateRow(index, {
                                                        toothSurface:
                                                            event.target.value,
                                                    })
                                                }
                                                disabled={saving}
                                            >
                                                {SURFACE_OPTIONS.map(opt => (
                                                    <option
                                                        key={
                                                            opt.value || 'empty'
                                                        }
                                                        value={opt.value}
                                                    >
                                                        {opt.value
                                                            ? `${opt.value} – ${opt.label}`
                                                            : opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    )}
                                    {row.scope === 'arch' && (
                                        <label
                                            className={styles.phaseInlineLabel}
                                        >
                                            Arcada
                                            <select
                                                className={`${styles.input} ${styles.phaseSelect}`}
                                                value={row.arcadeArch ?? ''}
                                                onChange={event =>
                                                    onUpdateRow(index, {
                                                        arcadeArch: event.target
                                                            .value as
                                                            | 'superior'
                                                            | 'inferior'
                                                            | 'AMBAS'
                                                            | null,
                                                    })
                                                }
                                                disabled={saving}
                                            >
                                                {ARCH_OPTIONS.map(opt => (
                                                    <option
                                                        key={opt.value}
                                                        value={opt.value}
                                                    >
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    )}
                                </div>

                                <div className={styles.formGrid}>
                                    <label className={styles.label}>
                                        Tratamento
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
                                                    // Typing breaks the catalog link; resets serviceId.
                                                    onUpdateRow(index, {
                                                        treatment:
                                                            event.target.value,
                                                        serviceId: null,
                                                    });
                                                    setOpenDropdownIndex(index);
                                                }}
                                                disabled={saving}
                                                autoComplete='off'
                                                placeholder='Ex.: Restauração em resina'
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
                                                                        onPointerDown={event => {
                                                                            event.preventDefault();
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
                                                                        onPointerDown={event => {
                                                                            event.preventDefault();
                                                                            onDeleteFromCatalog(
                                                                                item.id,
                                                                            );
                                                                        }}
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
                                            rows={3}
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
                                                    disabled={saving}
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
                                                />
                                                <span
                                                    className={
                                                        styles.catalogCheckboxMark
                                                    }
                                                    aria-hidden='true'
                                                >
                                                    {includeInCatalog[index] !==
                                                        false && (
                                                        <svg
                                                            viewBox='0 0 12 10'
                                                            fill='none'
                                                        >
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
                                            <span
                                                className={
                                                    styles.catalogCheckboxText
                                                }
                                            >
                                                Adicionar "
                                                {row.treatment.trim()}" ao
                                                catálogo geral
                                            </span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.modalActions}>
                    {flowType !== 'tooth' && (
                        <button
                            type='button'
                            className={styles.btn}
                            onClick={onAddItem}
                            disabled={saving}
                        >
                            + Item
                        </button>
                    )}
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
                            onSave(
                                serviceRows
                                    .map((row, index) => {
                                        const catalogItem = serviceCatalog.find(
                                            item =>
                                                item.name
                                                    .trim()
                                                    .toLowerCase() ===
                                                row.treatment
                                                    .trim()
                                                    .toLowerCase(),
                                        );
                                        const selectable =
                                            !catalogItem &&
                                            Boolean(row.treatment.trim());

                                        return selectable &&
                                            includeInCatalog[index] !== false
                                            ? index
                                            : -1;
                                    })
                                    .filter(index => index >= 0),
                            )
                        }
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : 'Salvar tratamento'}
                    </button>
                </div>
            </div>
        </div>
    );
}
