// Owns the core Service/Product catalog lookups used by the treatment/product modals.
import React from 'react';
import { emit } from '../events/bus';
import { API_BASE } from '../config/api';
import { ApiError, apiFetch } from '../utils/apiFetch';
import { parseAmount } from '../utils/currency';
import { asList } from '../pages/odontoArcadeHelpers';
import type {
    CatalogProductItem,
    CatalogServiceItem,
    ProductRow,
    ServiceFlowType,
    ServiceRow,
} from '../pages/odontoArcadeHelpers';

export function useOdontoCatalogs(
    serviceFlowOpen: boolean,
    productFlowOpen: boolean,
) {
    const [serviceCatalog, setServiceCatalog] = React.useState<
        CatalogServiceItem[]
    >([]);
    const [savingSuggestionIndex, setSavingSuggestionIndex] = React.useState<
        number | null
    >(null);
    const [productCatalog, setProductCatalog] = React.useState<
        CatalogProductItem[]
    >([]);
    const [savingProductSuggestionIndex, setSavingProductSuggestionIndex] =
        React.useState<number | null>(null);

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
                    // Parse "odonto_scope:tooth|arch|all" tag stored in description.
                    odonto_scope: s.description?.startsWith('odonto_scope:')
                        ? (s.description.slice('odonto_scope:'.length) as
                              | 'tooth'
                              | 'arch'
                              | 'all')
                        : undefined,
                })),
            );
        } catch {
            /* UX stays functional */
        }
    }, []);

    React.useEffect(() => {
        if (!serviceFlowOpen) return;
        void loadServiceCatalog();
    }, [serviceFlowOpen, loadServiceCatalog]);

    const loadProductCatalog = React.useCallback(async () => {
        try {
            const response = await apiFetch(
                `${API_BASE}/inventory/products/?is_active=true`,
            );
            const products = asList<{
                id: number;
                name: string;
                price: number | string | null;
            }>(response);
            setProductCatalog(
                products.map(p => ({ id: p.id, name: p.name, price: p.price })),
            );
        } catch {
            /* UX stays functional */
        }
    }, []);

    React.useEffect(() => {
        if (!productFlowOpen) return;
        void loadProductCatalog();
    }, [productFlowOpen, loadProductCatalog]);

    async function saveTreatmentSuggestion(
        row: ServiceRow,
        index: number,
        scope: ServiceFlowType,
    ) {
        const name = row.treatment.trim();
        if (!name) return;

        const existingItem = serviceCatalog.find(
            s => s.name.toLowerCase() === name.toLowerCase(),
        );
        const priceValue = row.value.trim() ? parseAmount(row.value) : null;

        setSavingSuggestionIndex(index);
        try {
            if (existingItem) {
                await apiFetch(
                    `${API_BASE}/inventory/services/${existingItem.id}/`,
                    {
                        method: 'PATCH',
                        body: {
                            ...(priceValue !== null && {
                                base_price: priceValue,
                            }),
                            default_notes: row.notes.trim(),
                        },
                    },
                );
                emit('systemMessage', {
                    text: `Dados de "${name}" atualizados no catálogo.`,
                    type: 'success',
                });
            } else {
                // Create new service with odonto scope tag in description.
                const scopeTag =
                    scope === 'tooth'
                        ? 'tooth'
                        : scope === 'arch'
                          ? 'arch'
                          : 'all';
                await apiFetch(`${API_BASE}/inventory/services/`, {
                    method: 'POST',
                    body: {
                        name,
                        base_price: priceValue ?? 0,
                        description: `odonto_scope:${scopeTag}`,
                        default_notes: row.notes.trim(),
                    },
                });
                emit('systemMessage', {
                    text: `"${name}" adicionado ao catálogo de serviços.`,
                    type: 'success',
                });
            }
            await loadServiceCatalog();
        } catch {
            emit('systemMessage', {
                text: 'Não foi possível salvar no catálogo.',
                type: 'error',
            });
        } finally {
            setSavingSuggestionIndex(null);
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

    async function saveProductNameSuggestion(row: ProductRow, index: number) {
        const name = row.name.trim();
        if (!name) return;
        setSavingProductSuggestionIndex(index);
        try {
            const priceValue = row.value.trim() ? parseAmount(row.value) : 0;
            await apiFetch(`${API_BASE}/inventory/products/`, {
                method: 'POST',
                body: { name, type: 'PRODUCT', price: priceValue ?? 0 },
            });
            await loadProductCatalog();
            emit('systemMessage', {
                text: `"${name}" adicionado ao catalogo de produtos.`,
                type: 'success',
            });
        } catch {
            emit('systemMessage', {
                text: 'Nao foi possivel salvar no catalogo.',
                type: 'error',
            });
        } finally {
            setSavingProductSuggestionIndex(null);
        }
    }

    return {
        serviceCatalog,
        savingSuggestionIndex,
        saveTreatmentSuggestion,
        deleteFromCatalog,
        productCatalog,
        savingProductSuggestionIndex,
        saveProductNameSuggestion,
    };
}
