// Owns the core Service/Product catalog lookups used by the treatment/product modals.
import React from 'react';
import { emit } from '../events/bus';
import { API_BASE } from '../config/api';
import { apiFetch } from '../utils/apiFetch';
import { parseAmount } from '../utils/currency';
import { asList } from '../pages/odontoArcadeHelpers';
import type {
    CatalogProductItem,
    CatalogServiceItem,
    ProductRow,
    ServiceRow,
} from '../pages/odontoArcadeHelpers';

export function useOdontoCatalogs(
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
            }>(response);
            setServiceCatalog(
                services.map(s => ({
                    id: s.id,
                    name: s.name,
                    base_price: s.base_price,
                    description: s.description,
                    default_notes: s.default_notes,
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

    async function saveServicesToCatalog(
        rows: ServiceRow[],
        indexes: number[],
    ): Promise<boolean> {
        const selectedRows = new Map<string, ServiceRow>();
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

                    if (existingItem) {
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
        const selectedRows = new Map<string, ProductRow>();
        for (const index of indexes) {
            const row = rows[index];
            const name = row?.name.trim();
            if (row && name) selectedRows.set(name.toLowerCase(), row);
        }

        setSavingCatalog(true);
        try {
            await Promise.all(
                [...selectedRows.values()].map(row => {
                    const name = row.name.trim();
                    const existingItem = productCatalog.find(
                        item =>
                            item.name.trim().toLowerCase() ===
                            name.toLowerCase(),
                    );
                    const priceValue = row.value.trim()
                        ? parseAmount(row.value)
                        : 0;

                    if (existingItem?.id) {
                        return apiFetch(
                            `${API_BASE}/inventory/products/${existingItem.id}/`,
                            {
                                method: 'PATCH',
                                body: {
                                    price: priceValue ?? 0,
                                    description: row.notes.trim(),
                                },
                            },
                        );
                    }

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
            if (selectedRows.size > 0) await loadProductCatalog();
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
        deleteFromCatalog,
        productCatalog,
        saveNewProductsToCatalog,
    };
}
