import React from 'react';
import type {
    CatalogProductItem,
    ProductRow,
} from '../../pages/odontoArcadeHelpers';
import {
    normalizeMoneyInput,
    normalizeSearchText,
} from '../../pages/odontoArcadeHelpers';
import { parseAmount, toInputAmount } from '../../utils/currency';
import styles from '../../styles/pages/OdontoArcadeSimplifiedPage.module.css';

type Props = {
    open: boolean;
    saving: boolean;
    productRows: ProductRow[];
    productCatalog: CatalogProductItem[];
    onClose: () => void;
    onSave: (catalogIndexes: number[]) => void;
    onRowsChange: (rows: ProductRow[]) => void;
};

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
            const aIndex = aN.indexOf(search);
            const bIndex = bN.indexOf(search);
            if (aIndex !== bIndex) return aIndex - bIndex;
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

export default function OdontoProductModal({
    open,
    saving,
    productRows,
    productCatalog,
    onClose,
    onSave,
    onRowsChange,
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

    function updateRow(index: number, patch: Partial<ProductRow>) {
        onRowsChange(
            productRows.map((item, i) =>
                i === index ? { ...item, ...patch } : item,
            ),
        );
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
                        const priceChangedFromCatalog =
                            Boolean(catalogItem) &&
                            Boolean(row.value.trim()) &&
                            Math.abs(
                                (parseAmount(row.value) ?? 0) -
                                    Number(catalogItem?.price ?? 0),
                            ) > 0.001;
                        const notesChangedFromCatalog =
                            Boolean(catalogItem) &&
                            row.notes.trim() !==
                                (catalogItem?.description ?? '').trim();
                        const showCatalogCheckbox =
                            Boolean(row.name.trim()) &&
                            (!catalogItem ||
                                priceChangedFromCatalog ||
                                notesChangedFromCatalog);
                        const checkboxLabel = catalogItem
                            ? priceChangedFromCatalog && notesChangedFromCatalog
                                ? 'Atualizar valor e observações no catálogo geral'
                                : priceChangedFromCatalog
                                  ? 'Atualizar valor no catálogo geral'
                                  : 'Atualizar observações no catálogo geral'
                            : 'Adicionar ao catálogo geral';

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
                                                placeholder='Ex.: Botox'
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
                                            rows={3}
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
                                                {checkboxLabel}
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
                        onClick={() =>
                            onSave(
                                productRows
                                    .map((row, index) =>
                                        (() => {
                                            const catalogItem = findCatalogItem(
                                                productCatalog,
                                                row.name,
                                            );
                                            const priceChanged =
                                                Boolean(catalogItem) &&
                                                Boolean(row.value.trim()) &&
                                                Math.abs(
                                                    (parseAmount(row.value) ??
                                                        0) -
                                                        Number(
                                                            catalogItem?.price ??
                                                                0,
                                                        ),
                                                ) > 0.001;
                                            const notesChanged =
                                                Boolean(catalogItem) &&
                                                row.notes.trim() !==
                                                    (
                                                        catalogItem?.description ??
                                                        ''
                                                    ).trim();
                                            const selectable =
                                                Boolean(row.name.trim()) &&
                                                (!catalogItem ||
                                                    priceChanged ||
                                                    notesChanged);

                                            return selectable &&
                                                includeInCatalog[index] !==
                                                    false
                                                ? index
                                                : null;
                                        })(),
                                    )
                                    .filter(
                                        (index): index is number =>
                                            index !== null,
                                    ),
                            )
                        }
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
