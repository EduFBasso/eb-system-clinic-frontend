// Owns the core Service/Product catalog lookups used by the treatment/product modals.
import React from 'react';
import { emit } from '../events/bus';
import { API_BASE } from '../config/api';
import { apiFetch } from '../utils/apiFetch';
import { parseAmount } from '../utils/currency';
import { asList } from '../utils/TreatmentHelpers';
import type {
    CatalogProductItem,
    CatalogServiceItem,
    ProductRow,
} from '../utils/TreatmentHelpers';

/** Minimal shape needed to sync a service row with the general catalog —
 * structurally compatible with both Odonto's ServiceRow and Podology's
 * PodologyServiceRow, so this hook stays domain-agnostic. */
type CatalogServiceRowLike = {
    treatment: string;
    value: string;
    notes: string;
    scope: string;
    serviceId: number | null;
};

/** Service.treatment_scopes only accepts these choices on the backend (Odonto's
 * tooth/arch/other categorization). Other domains' scopes (e.g. Podologia's
 * pe_esquerdo, mao_direita) are simply not recorded there. */
const CATALOG_TREATMENT_SCOPES = new Set(['tooth', 'arch', 'other']);

function asCatalogTreatmentScope(scope: string): string | null {
    return CATALOG_TREATMENT_SCOPES.has(scope) ? scope : null;
}

export function useClinicalCatalogs(
    serviceFlowOpen: boolean,
    productFlowOpen: boolean,
    editItemOpen = false,
) {
    const [serviceCatalog, setServiceCatalog] = React.useState<
        CatalogServiceItem[]
    >([]);
    const [productCatalog, setProductCatalog] = React.useState<
        CatalogProductItem[]
    >([]);
    const [savingCatalog, setSavingCatalog] = React.useState(false);

    const loadServiceCatalog = React.useCallback(async () => {
        try {
            const response = await apiFetch(`${API_BASE}/inventory/services/`);
            const services = asList<{
                id: number;
                name: string;
                base_price: number | string | null;
                description?: string;
                default_notes?: string;
                treatment_scopes?: string[];
            }>(response);
            setServiceCatalog(
                services.map(s => ({
                    id: s.id,
                    name: s.name,
                    base_price: s.base_price,
                    description: s.description,
                    default_notes: s.default_notes,
                    treatment_scopes: s.treatment_scopes ?? [],
                })),
            );
        } catch {
            /* UX stays functional */
        }
    }, []);

    React.useEffect(() => {
        if (!serviceFlowOpen && !editItemOpen) return;
        void loadServiceCatalog();
    }, [serviceFlowOpen, editItemOpen, loadServiceCatalog]);

    const loadProductCatalog = React.useCallback(async () => {
        try {
            const response = await apiFetch(
                `${API_BASE}/inventory/products/?is_active=true`,
            );
            const products = asList<{
                id: number;
                name: string;
                price: number | string | null;
                description?: string;
            }>(response);
            setProductCatalog(
                products.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    description: p.description,
                })),
            );
        } catch {
            /* UX stays functional */
        }
    }, []);

    React.useEffect(() => {
        if (!productFlowOpen) return;
        void loadProductCatalog();
    }, [productFlowOpen, loadProductCatalog]);

    async function saveServicesToCatalog<T extends CatalogServiceRowLike>(
        rows: T[],
        indexes: number[],
    ): Promise<boolean> {
        const selectedRows = new Map<string, T>();
        for (const index of indexes) {
            const row = rows[index];
            const name = row?.treatment.trim();
            if (row && name) selectedRows.set(name.toLowerCase(), row);
        }

        setSavingCatalog(true);
        try {
            await Promise.all(
                [...selectedRows.values()].map(row => {
                    const name = row.treatment.trim();
                    const existingItem = serviceCatalog.find(
                        item =>
                            item.name.trim().toLowerCase() ===
                            name.toLowerCase(),
                    );
                    const priceValue = row.value.trim()
                        ? parseAmount(row.value)
                        : null;
                    const scope = asCatalogTreatmentScope(row.scope);

                    if (existingItem) {
                        const treatmentScopes = scope
                            ? Array.from(
                                  new Set([
                                      ...existingItem.treatment_scopes,
                                      scope,
                                  ]),
                              )
                            : existingItem.treatment_scopes;
                        return apiFetch(
                            `${API_BASE}/inventory/services/${existingItem.id}/`,
                            {
                                method: 'PATCH',
                                body: {
                                    ...(priceValue !== null && {
                                        base_price: priceValue,
                                    }),
                                    description: row.notes.trim(),
                                    default_notes: row.notes.trim(),
                                    treatment_scopes: treatmentScopes,
                                },
                            },
                        );
                    }

                    return apiFetch(`${API_BASE}/inventory/services/`, {
                        method: 'POST',
                        body: {
                            name,
                            base_price: priceValue ?? 0,
                            description: row.notes.trim(),
                            default_notes: row.notes.trim(),
                            treatment_scopes: scope ? [scope] : [],
                        },
                    });
                }),
            );
            if (selectedRows.size > 0) await loadServiceCatalog();
            return true;
        } catch {
            emit('systemMessage', {
                text: 'Não foi possível salvar os serviços no catálogo geral.',
                type: 'error',
            });
            return false;
        } finally {
            setSavingCatalog(false);
        }
    }

    async function saveNewServicesToCatalog<T extends CatalogServiceRowLike>(
        rows: T[],
        indexes: number[],
    ): Promise<T[] | null> {
        const selectedRows = new Map<string, { index: number; row: T }>();
        for (const index of indexes) {
            const row = rows[index];
            const name = row?.treatment.trim();
            if (!row || !name) continue;
            const normalizedName = name.toLowerCase();
            selectedRows.set(normalizedName, { index, row });
        }

        setSavingCatalog(true);
        try {
            const resolvedRows = rows.map(row => ({ ...row }));
            await Promise.all(
                [...selectedRows.values()].map(async ({ index, row }) => {
                    const priceValue = row.value.trim()
                        ? parseAmount(row.value)
                        : null;
                    const normalizedName = row.treatment.trim().toLowerCase();
                    const existingItem = serviceCatalog.find(
                        item =>
                            item.name.trim().toLowerCase() === normalizedName,
                    );
                    const scope = asCatalogTreatmentScope(row.scope);

                    if (existingItem) {
                        const treatmentScopes = scope
                            ? Array.from(
                                  new Set([
                                      ...existingItem.treatment_scopes,
                                      scope,
                                  ]),
                              )
                            : existingItem.treatment_scopes;
                        await apiFetch(
                            `${API_BASE}/inventory/services/${existingItem.id}/`,
                            {
                                method: 'PATCH',
                                body: { treatment_scopes: treatmentScopes },
                            },
                        );
                        resolvedRows[index].serviceId = existingItem.id;
                        return;
                    }

                    const created = await apiFetch(
                        `${API_BASE}/inventory/services/`,
                        {
                            method: 'POST',
                            body: {
                                name: row.treatment.trim(),
                                base_price: priceValue ?? 0,
                                description: row.notes.trim(),
                                default_notes: row.notes.trim(),
                                treatment_scopes: scope ? [scope] : [],
                            },
                        },
                    );
                    const createdId = Number(
                        (created as { id?: number } | null)?.id,
                    );
                    if (Number.isFinite(createdId)) {
                        resolvedRows[index].serviceId = createdId;
                    }
                }),
            );
            if (selectedRows.size > 0) await loadServiceCatalog();
            return resolvedRows;
        } catch {
            emit('systemMessage', {
                text: 'Não foi possível adicionar os serviços ao catálogo geral.',
                type: 'error',
            });
            return null;
        } finally {
            setSavingCatalog(false);
        }
    }

    async function deleteFromCatalog(serviceId: number) {
        if (!window.confirm('Remover este serviço do catálogo?')) return;
        try {
            await apiFetch(`${API_BASE}/inventory/services/${serviceId}/`, {
                method: 'DELETE',
            });
            await loadServiceCatalog();
            emit('systemMessage', {
                text: 'Serviço removido do catálogo.',
                type: 'success',
            });
        } catch {
            emit('systemMessage', {
                text: 'Não foi possível remover o serviço.',
                type: 'error',
            });
        }
    }

    async function saveNewProductsToCatalog(
        rows: ProductRow[],
        indexes: number[],
    ): Promise<boolean> {
        const newRows = new Map<string, ProductRow>();
        for (const index of indexes) {
            const row = rows[index];
            const name = row?.name.trim();
            if (!row || !name) continue;
            const normalizedName = name.toLowerCase();
            const alreadyExists = productCatalog.some(
                item => item.name.trim().toLowerCase() === normalizedName,
            );
            if (!alreadyExists) newRows.set(normalizedName, row);
        }

        setSavingCatalog(true);
        try {
            await Promise.all(
                [...newRows.values()].map(row => {
                    const name = row.name.trim();
                    const priceValue = row.value.trim()
                        ? parseAmount(row.value)
                        : 0;
                    return apiFetch(`${API_BASE}/inventory/products/`, {
                        method: 'POST',
                        body: {
                            name,
                            type: 'PRODUCT',
                            price: priceValue ?? 0,
                            description: row.notes.trim(),
                        },
                    });
                }),
            );
            if (newRows.size > 0) await loadProductCatalog();
            return true;
        } catch {
            emit('systemMessage', {
                text: 'Nao foi possivel adicionar os produtos ao catalogo geral.',
                type: 'error',
            });
            return false;
        } finally {
            setSavingCatalog(false);
        }
    }

    return {
        serviceCatalog,
        savingCatalog,
        saveServicesToCatalog,
        saveNewServicesToCatalog,
        deleteFromCatalog,
        productCatalog,
        saveNewProductsToCatalog,
    };
}
