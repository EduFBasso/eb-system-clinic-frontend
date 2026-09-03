import React from 'react';
import type {
    CatalogProductItem,
    ProductRow,
} from '../../utils/TreatmentHelpers';
import {
    normalizeMoneyInput,
    normalizeSearchText,
} from '../../utils/TreatmentHelpers';
import { toInputAmount } from '../../utils/currency';
import styles from '../Shared/TreatmentWorkspacePage/TreatmentWorkspacePage.module.css';

interface PodologyProductModalProps {
    open: boolean;
    saving: boolean;
    productRows: ProductRow[];
    productCatalog: CatalogProductItem[];
    onClose: () => void;
    onSave: (catalogIndexes: number[]) => void;
    onRowsChange: (rows: ProductRow[]) => void;
}

function filteredCatalog(
    catalog: CatalogProductItem[],
    searchRaw: string,
): CatalogProductItem[] {
    const sorted = [...catalog].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
    );
    const search = normalizeSearchText(searchRaw);
    if (!search) return sorted.slice(0, 24);

    return sorted
        .filter(item => normalizeSearchText(item.name).includes(search))
        .sort((a, b) => {
            const aN = normalizeSearchText(a.name);
            const bN = normalizeSearchText(b.name);
            const aStarts = aN.startsWith(search) ? 0 : 1;
            const bStarts = bN.startsWith(search) ? 0 : 1;
            if (aStarts !== bStarts) return aStarts - bStarts;
            return a.name.localeCompare(b.name, 'pt-BR', {
                sensitivity: 'base',
            });
        })
        .slice(0, 24);
}

function findCatalogItem(
    catalog: CatalogProductItem[],
    nameRaw: string,
): CatalogProductItem | undefined {
    const normalized = nameRaw.trim().toLowerCase();
    if (!normalized) return undefined;
    return catalog.find(item => item.name.trim().toLowerCase() === normalized);
}

/**
 * Modal de insumos/produtos de estoque usados no plano de podologia.
 */
export default function PodologyProductModal({
    open,
    saving,
    productRows,
    productCatalog,
    onClose,
    onSave,
    onRowsChange,
}: PodologyProductModalProps) {
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

    function updateRow(index: number, patch: Partial<ProductRow>) {
        onRowsChange(
            productRows.map((row, i) =>
                i === index ? { ...row, ...patch } : row,
            ),
        );
    }

    function handleSave() {
        const catalogIndexes = productRows
            .map((row, index) => ({ row, index }))
            .filter(
                ({ row, index }) =>
                    Boolean(row.name.trim()) &&
                    !findCatalogItem(productCatalog, row.name) &&
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
                <h3 className={styles.sectionTitle}>Novo fluxo de produtos</h3>

                <div className={styles.modalRows}>
                    {productRows.map((row, index) => {
                        const suggestions = filteredCatalog(
                            productCatalog,
                            row.name,
                        );
                        const catalogItem = findCatalogItem(
                            productCatalog,
                            row.name,
                        );
                        const showCatalogCheckbox =
                            Boolean(row.name.trim()) && !catalogItem;

                        return (
                            <div key={index} className={styles.modalRow}>
                                <div className={styles.modalRowHeader}>
                                    <strong>Produto {index + 1}</strong>
                                </div>

                                <div className={styles.formGrid}>
                                    <label className={styles.label}>
                                        Nome
                                        <div
                                            className={styles.autocompleteWrap}
                                        >
                                            <input
                                                className={styles.input}
                                                value={row.name}
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
                                                    updateRow(index, {
                                                        name: event.target
                                                            .value,
                                                    });
                                                    setOpenDropdownIndex(index);
                                                }}
                                                disabled={saving}
                                                autoComplete='off'
                                                placeholder='Ex.: Lixa descartável'
                                            />
                                            {openDropdownIndex === index && (
                                                <div
                                                    className={
                                                        styles.autocompleteList
                                                    }
                                                >
                                                    {suggestions.length ===
                                                    0 ? (
                                                        <div
                                                            className={
                                                                styles.autocompleteEmpty
                                                            }
                                                        >
                                                            Nenhum produto
                                                            encontrado.
                                                        </div>
                                                    ) : (
                                                        suggestions.map(
                                                            item => (
                                                                <button
                                                                    key={
                                                                        item.name
                                                                    }
                                                                    type='button'
                                                                    className={
                                                                        styles.autocompleteItem
                                                                    }
                                                                    onMouseDown={event =>
                                                                        event.preventDefault()
                                                                    }
                                                                    onPointerDown={event => {
                                                                        event.preventDefault();
                                                                        updateRow(
                                                                            index,
                                                                            {
                                                                                name: item.name,
                                                                                ...(item.price !=
                                                                                    null && {
                                                                                    value: toInputAmount(
                                                                                        item.price,
                                                                                    ),
                                                                                }),
                                                                                notes:
                                                                                    item.description ??
                                                                                    '',
                                                                            },
                                                                        );
                                                                        setOpenDropdownIndex(
                                                                            null,
                                                                        );
                                                                    }}
                                                                    onClick={() => {
                                                                        updateRow(
                                                                            index,
                                                                            {
                                                                                name: item.name,
                                                                                ...(item.price !=
                                                                                    null && {
                                                                                    value: toInputAmount(
                                                                                        item.price,
                                                                                    ),
                                                                                }),
                                                                                notes:
                                                                                    item.description ??
                                                                                    '',
                                                                            },
                                                                        );
                                                                        setOpenDropdownIndex(
                                                                            null,
                                                                        );
                                                                    }}
                                                                >
                                                                    {item.name}
                                                                    {item.price !=
                                                                        null && (
                                                                        <span
                                                                            className={
                                                                                styles.autocompleteHint
                                                                            }
                                                                        >
                                                                            {' '}
                                                                            R${' '}
                                                                            {toInputAmount(
                                                                                item.price,
                                                                            )}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            ),
                                                        )
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
                                                updateRow(index, {
                                                    value: event.target.value,
                                                })
                                            }
                                            onBlur={event =>
                                                updateRow(index, {
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
                                                updateRow(index, {
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
                        onClick={() =>
                            onRowsChange([
                                ...productRows,
                                { name: '', value: '', notes: '' },
                            ])
                        }
                        disabled={saving}
                    >
                        + Produto
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
