// Owns neutral item-level operations: product flow, editing modal, item grouping, and deletion.
// Used as the core layer by specialized domain hooks (Odonto, Podologia, etc.).

import React from 'react';
import { emit } from '../events/bus';
import { ApiError, apiFetch } from '../utils/apiFetch';
import { parseAmount, toInputAmount, validateAmount } from '../utils/currency';
import {
    eventDateISO,
    formatDate,
    todayISODate,
} from '../utils/TreatmentHelpers';
import type {
    ItemGroup,
    PlanListItem,
    ProductRow,
    TreatmentItem,
} from '../utils/TreatmentHelpers';

export function dateKeyFromItem(item: TreatmentItem): string {
    const d = eventDateISO(item);
    if (d) return d;
    if (item.created_at && item.created_at.length >= 10)
        return item.created_at.slice(0, 10);
    return todayISODate();
}

export function useClinicalItemFlows(
    plan: PlanListItem | null,
    items: TreatmentItem[],
    refreshPlan: () => Promise<void>,
) {
    const [productFlowOpen, setProductFlowOpen] = React.useState(false);
    const [savingProductFlow, setSavingProductFlow] = React.useState(false);
    const [expandedItemIds, setExpandedItemIds] = React.useState<Set<number>>(
        new Set(),
    );
    const [editingItem, setEditingItem] = React.useState<TreatmentItem | null>(
        null,
    );
    const [editingItemName, setEditingItemName] = React.useState('');
    const [editingItemValue, setEditingItemValue] = React.useState('');
    const [editingItemNotes, setEditingItemNotes] = React.useState('');
    const [savingEditItem, setSavingEditItem] = React.useState(false);

    const [productRows, setProductRows] = React.useState<ProductRow[]>([]);

    const groupedItems = React.useMemo(() => {
        const groups = new Map<string, TreatmentItem[]>();
        const roots = items.filter(i => i.parent_item == null);
        for (const item of roots) {
            const key = dateKeyFromItem(item);
            const list = groups.get(key) ?? [];
            list.push(item);
            groups.set(key, list);
        }
        return Array.from(groups.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map<ItemGroup>(([key, list]) => ({
                key,
                label: formatDate(key),
                items: list.sort((a, b) => a.id - b.id),
            }));
    }, [items]);

    function openProductFlowModal() {
        setProductRows([{ name: '', value: '', notes: '' }]);
        setProductFlowOpen(true);
    }

    function closeProductFlowModal() {
        if (!savingProductFlow) setProductFlowOpen(false);
    }

    async function saveProductFlow() {
        if (!plan) return;
        const valid = productRows.filter(r => r.name.trim());
        if (valid.length === 0) {
            emit('systemMessage', {
                text: 'Adicione pelo menos um produto com nome.',
                type: 'warning',
            });
            return;
        }
        for (const row of valid) {
            if (row.value.trim()) {
                const v = validateAmount(row.value);
                if (!v.valid) {
                    emit('systemMessage', {
                        text: v.message || 'Valor invalido.',
                        type: 'warning',
                    });
                    return;
                }
            }
        }
        setSavingProductFlow(true);
        try {
            const dateToUse = todayISODate();
            const parent = (await apiFetch('/clinic/treatment/items/', {
                method: 'POST',
                body: {
                    plan: plan.id,
                    kind: 'service',
                    custom_name: 'Produtos usados',
                    status: 'pending',
                    started_at: dateToUse,
                    is_active: true,
                },
            })) as { id: number };
            for (const row of valid) {
                const amount = row.value.trim() ? parseAmount(row.value) : null;
                await apiFetch('/clinic/treatment/items/', {
                    method: 'POST',
                    body: {
                        plan: plan.id,
                        kind: 'product',
                        custom_name: row.name.trim(),
                        status: 'pending',
                        started_at: dateToUse,
                        patient_price: amount,
                        notes: row.notes.trim(),
                        is_active: true,
                        parent_item: parent.id,
                    },
                });
            }
            setProductFlowOpen(false);
            await refreshPlan();
            emit('systemMessage', {
                text: 'Produtos salvos com sucesso.',
                type: 'success',
            });
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : 'Nao foi possivel salvar os produtos.';
            emit('systemMessage', {
                text: message || 'Nao foi possivel salvar os produtos.',
                type: 'error',
            });
        } finally {
            setSavingProductFlow(false);
        }
    }

    function openEditItem(item: TreatmentItem) {
        setEditingItem(item);
        setEditingItemName(
            item.custom_name.trim() || item.service_name?.trim() || '',
        );
        setEditingItemValue(toInputAmount(item.patient_price ?? ''));
        setEditingItemNotes(item.notes ?? '');
    }

    function closeEditItemModal() {
        if (!savingEditItem) setEditingItem(null);
    }

    async function saveEditedItem() {
        if (!editingItem) return;
        if (editingItemValue.trim()) {
            const v = validateAmount(editingItemValue, 'Valor');
            if (!v.valid) {
                emit('systemMessage', {
                    text: v.message || 'Valor invalido.',
                    type: 'warning',
                });
                return;
            }
        }
        setSavingEditItem(true);
        try {
            await apiFetch(`/clinic/treatment/items/${editingItem.id}/`, {
                method: 'PATCH',
                body: {
                    patient_price: editingItemValue.trim()
                        ? parseAmount(editingItemValue)
                        : null,
                    notes: editingItemNotes.trim(),
                },
            });
            closeEditItemModal();
            await refreshPlan();
            emit('systemMessage', {
                text: 'Item atualizado com sucesso.',
                type: 'success',
            });
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : 'Nao foi possivel atualizar o item.';
            emit('systemMessage', {
                text: message || 'Nao foi possivel atualizar o item.',
                type: 'error',
            });
        } finally {
            setSavingEditItem(false);
        }
    }

    async function deleteItem(itemId: number) {
        if (!window.confirm('Deseja apagar este item?')) return;
        try {
            await apiFetch(`/clinic/treatment/items/${itemId}/`, {
                method: 'DELETE',
            });
            await refreshPlan();
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : 'Nao foi possivel apagar o item.';
            emit('systemMessage', {
                text: message || 'Nao foi possivel apagar o item.',
                type: 'error',
            });
        }
    }

    function toggleItemDetails(itemId: number) {
        setExpandedItemIds(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId);
            else next.add(itemId);
            return next;
        });
    }

    return {
        groupedItems,

        productFlowOpen,
        savingProductFlow,
        productRows,
        setProductRows,
        openProductFlowModal,
        closeProductFlowModal,
        saveProductFlow,

        expandedItemIds,
        toggleItemDetails,

        editingItem,
        editingItemName,
        editingItemValue,
        setEditingItemValue,
        editingItemNotes,
        setEditingItemNotes,
        savingEditItem,
        openEditItem,
        closeEditItemModal,
        saveEditedItem,

        deleteItem,
    };
}
