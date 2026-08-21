// Owns the item-level flows: service/product creation modals, edit modal, and item list grouping.
import React from 'react';
import { emit } from '../events/bus';
import { ApiError, apiFetch } from '../utils/apiFetch';
import { parseAmount, toInputAmount, validateAmount } from '../utils/currency';
import {
    eventDateISO,
    formatDate,
    todayISODate,
} from '../pages/odontoArcadeHelpers';
import type {
    ItemGroup,
    PlanListItem,
    ProductRow,
    ServiceFlowType,
    ServiceRow,
    TreatmentItem,
} from '../pages/odontoArcadeHelpers';

function dateKeyFromItem(item: TreatmentItem): string {
    const d = eventDateISO(item);
    if (d) return d;
    if (item.created_at && item.created_at.length >= 10)
        return item.created_at.slice(0, 10);
    return todayISODate();
}

function buildEmptyServiceRow(flowType: ServiceFlowType): ServiceRow {
    return {
        toothNumber: null,
        toothSurface: '',
        scope: flowType,
        arcadeArch: flowType === 'arch' ? 'superior' : null,
        treatment: '',
        serviceId: null,
        value: '',
        notes: '',
    };
}

export function useOdontoItemFlows(
    plan: PlanListItem | null,
    items: TreatmentItem[],
    refreshPlan: () => Promise<void>,
) {
    const [serviceFlowOpen, setServiceFlowOpen] = React.useState(false);
    const [productFlowOpen, setProductFlowOpen] = React.useState(false);
    const [savingServiceFlow, setSavingServiceFlow] = React.useState(false);
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

    const [serviceFlowType, setServiceFlowType] =
        React.useState<ServiceFlowType>('tooth');
    const [serviceRows, setServiceRows] = React.useState<ServiceRow[]>([]);
    const [productRows, setProductRows] = React.useState<ProductRow[]>([]);

    const activeToothNumbers = React.useMemo(() => {
        const nums = new Set<number>();
        for (const item of items) {
            if (!item.is_active) continue;
            const tn = item.dental_context?.tooth_number;
            if (tn != null) nums.add(tn);
        }
        return nums;
    }, [items]);

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

    function openServiceFlowModal() {
        setServiceFlowType('tooth');
        setServiceRows([]);
        setServiceFlowOpen(true);
    }

    function closeServiceFlowModal() {
        if (!savingServiceFlow) setServiceFlowOpen(false);
    }

    function changeServiceFlowType(nextType: ServiceFlowType) {
        if (nextType === serviceFlowType) return;
        setServiceFlowType(nextType);
        setServiceRows(prev => {
            if (nextType === 'tooth') return [];
            if (serviceFlowType === 'tooth')
                return [buildEmptyServiceRow(nextType)];
            if (prev.length === 0) return [buildEmptyServiceRow(nextType)];
            return prev.map(r => ({
                ...r,
                scope: nextType,
                toothNumber: null,
                arcadeArch:
                    nextType === 'arch' ? (r.arcadeArch ?? 'superior') : null,
            }));
        });
    }

    function toggleToothServiceRow(toothNumber: number) {
        setServiceRows(prev => {
            const exists = prev.some(r => r.toothNumber === toothNumber);
            if (exists) return prev.filter(r => r.toothNumber !== toothNumber);
            return [
                ...prev,
                {
                    toothNumber,
                    toothSurface: '',
                    scope: 'tooth',
                    arcadeArch: null,
                    treatment: '',
                    serviceId: null,
                    value: '',
                    notes: '',
                },
            ];
        });
    }

    function updateServiceRow(index: number, patch: Partial<ServiceRow>) {
        setServiceRows(prev =>
            prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
        );
    }

    function addServiceRow() {
        setServiceRows(prev => [
            ...prev,
            buildEmptyServiceRow(serviceFlowType),
        ]);
    }

    async function saveServiceFlow() {
        if (!plan) return;
        if (serviceRows.length === 0) {
            emit('systemMessage', {
                text: 'Adicione ao menos um item.',
                type: 'warning',
            });
            return;
        }
        for (const row of serviceRows) {
            if (!row.treatment.trim()) {
                emit('systemMessage', {
                    text: 'Preencha o tratamento em todos os itens.',
                    type: 'warning',
                });
                return;
            }
            if (serviceFlowType === 'tooth' && row.toothNumber == null) {
                emit('systemMessage', {
                    text: 'Selecione o dente em todos os itens.',
                    type: 'warning',
                });
                return;
            }
            if (serviceFlowType === 'arch' && !row.arcadeArch) {
                emit('systemMessage', {
                    text: 'Selecione a arcada em todos os itens.',
                    type: 'warning',
                });
                return;
            }
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
        setSavingServiceFlow(true);
        try {
            for (const row of serviceRows) {
                const amount = row.value.trim() ? parseAmount(row.value) : null;
                const dentalContext =
                    row.scope === 'other' ||
                    (row.scope === 'arch' && row.arcadeArch === 'AMBAS')
                        ? {
                              scope: 'full' as const,
                              tooth_number: null,
                              tooth_surface: '',
                              arcade_arch: null,
                          }
                        : row.scope === 'arch'
                          ? {
                                scope: 'arch' as const,
                                tooth_number: null,
                                tooth_surface: '',
                                arcade_arch: row.arcadeArch,
                            }
                          : {
                                scope: 'tooth' as const,
                                tooth_number: row.toothNumber,
                                tooth_surface: row.toothSurface,
                                arcade_arch: null,
                            };

                await apiFetch('/clinic/treatment/items/', {
                    method: 'POST',
                    body: {
                        plan: plan.id,
                        kind: 'service',
                        // Prefer catalog service id; fall back to custom_name for ad-hoc entries.
                        ...(row.serviceId
                            ? { service: row.serviceId }
                            : { custom_name: row.treatment.trim() }),
                        status: 'pending',
                        started_at: todayISODate(),
                        patient_price: amount,
                        notes: row.notes.trim(),
                        is_active: true,
                        dental_context: dentalContext,
                    },
                });
            }
            setServiceFlowOpen(false);
            await refreshPlan();
            emit('systemMessage', {
                text: 'Tratamentos salvos com sucesso.',
                type: 'success',
            });
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : 'Nao foi possivel salvar os tratamentos.';
            emit('systemMessage', {
                text: message || 'Nao foi possivel salvar os tratamentos.',
                type: 'error',
            });
        } finally {
            setSavingServiceFlow(false);
        }
    }

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
        setEditingItemName(item.custom_name ?? '');
        setEditingItemValue(toInputAmount(item.patient_price ?? ''));
        setEditingItemNotes(item.notes ?? '');
    }

    function closeEditItemModal() {
        if (!savingEditItem) setEditingItem(null);
    }

    async function saveEditedItem() {
        if (!editingItem) return;
        const name = editingItemName.trim();
        if (!name) {
            emit('systemMessage', {
                text: 'Informe o nome do tratamento.',
                type: 'warning',
            });
            return;
        }
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
                    custom_name: name,
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

    async function markItemCompleted(itemId: number) {
        try {
            await apiFetch(`/clinic/treatment/items/${itemId}/`, {
                method: 'PATCH',
                body: {
                    status: 'completed',
                    completed_at: todayISODate(),
                },
            });
            await refreshPlan();
            emit('systemMessage', {
                text: 'Tratamento marcado como pago.',
                type: 'success',
            });
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : 'Nao foi possivel marcar o tratamento como pago.';
            emit('systemMessage', {
                text:
                    message ||
                    'Nao foi possivel marcar o tratamento como pago.',
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
        activeToothNumbers,

        serviceFlowOpen,
        savingServiceFlow,
        serviceFlowType,
        serviceRows,
        openServiceFlowModal,
        closeServiceFlowModal,
        changeServiceFlowType,
        toggleToothServiceRow,
        updateServiceRow,
        addServiceRow,
        saveServiceFlow,

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
        setEditingItemName,
        editingItemValue,
        setEditingItemValue,
        editingItemNotes,
        setEditingItemNotes,
        savingEditItem,
        openEditItem,
        closeEditItemModal,
        saveEditedItem,

        deleteItem,
        markItemCompleted,
    };
}
