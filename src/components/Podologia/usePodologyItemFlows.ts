// Owns the Podology-specific service creation flow and composes useClinicalItemFlows.
import React from 'react';
import { emit } from '../../events/bus';
import { ApiError, apiFetch } from '../../utils/apiFetch';
import { parseAmount, validateAmount } from '../../utils/currency';
import { todayISODate } from '../../utils/TreatmentHelpers';
import type { PlanListItem, TreatmentItem } from '../../utils/TreatmentHelpers';
import type {
    PodologyScope,
    PodologyServiceRow,
} from './PodologyAnatomyHelpers';
import {
    podologyContextFromServiceRow,
    getPodologyRegionLabel,
} from './PodologyAnatomyHelpers';
import { useClinicalItemFlows } from '../../hooks/useClinicalItemFlows';

function buildGeneralRow(): PodologyServiceRow {
    return {
        scope: 'geral',
        locationNumber: null,
        regionLabel: 'Geral / Outros',
        treatment: '',
        serviceId: null,
        value: '',
        notes: '',
    };
}

export function usePodologyItemFlows(
    plan: PlanListItem | null,
    items: TreatmentItem[],
    refreshPlan: () => Promise<void>,
) {
    const clinicalFlows = useClinicalItemFlows(plan, items, refreshPlan);

    const [serviceFlowOpen, setServiceFlowOpen] = React.useState(false);
    const [savingServiceFlow, setSavingServiceFlow] = React.useState(false);
    const [serviceRows, setServiceRows] = React.useState<PodologyServiceRow[]>(
        [],
    );

    const activeRegionIds = React.useMemo(() => {
        const nums = new Set<number>();
        for (const item of items) {
            if (!item.is_active) continue;
            const loc = item.podology_context?.location_number;
            if (loc != null) nums.add(loc);
        }
        return nums;
    }, [items]);

    function openServiceFlowModal() {
        setServiceRows([]);
        setServiceFlowOpen(true);
    }

    function closeServiceFlowModal() {
        if (!savingServiceFlow) setServiceFlowOpen(false);
    }

    function toggleRegionRow(id: number, scope: PodologyScope) {
        setServiceRows(previous => {
            const exists = previous.some(row => row.locationNumber === id);
            if (exists)
                return previous.filter(row => row.locationNumber !== id);
            return [
                ...previous,
                {
                    scope,
                    locationNumber: id,
                    regionLabel: getPodologyRegionLabel(scope, id),
                    treatment: '',
                    serviceId: null,
                    value: '',
                    notes: '',
                },
            ];
        });
    }

    function addGeneralRow() {
        setServiceRows(previous => [...previous, buildGeneralRow()]);
    }

    function updateServiceRow(
        index: number,
        patch: Partial<PodologyServiceRow>,
    ) {
        setServiceRows(previous =>
            previous.map((row, i) =>
                i === index ? { ...row, ...patch } : row,
            ),
        );
    }

    function removeServiceRow(index: number) {
        setServiceRows(previous => previous.filter((_, i) => i !== index));
    }

    async function saveServiceFlow(rowsToSave = serviceRows) {
        if (!plan) return;
        if (rowsToSave.length === 0) {
            emit('systemMessage', {
                text: 'Selecione ao menos uma região no mapa ou adicione um item geral.',
                type: 'warning',
            });
            return;
        }
        for (const row of rowsToSave) {
            if (!row.treatment.trim()) {
                emit('systemMessage', {
                    text: 'Preencha o procedimento em todos os itens.',
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
            for (const row of rowsToSave) {
                const amount = row.value.trim() ? parseAmount(row.value) : null;
                const podologyContext = podologyContextFromServiceRow(row);

                await apiFetch('/clinic/treatment/items/', {
                    method: 'POST',
                    body: {
                        plan: plan.id,
                        kind: 'service',
                        ...(row.serviceId
                            ? { service: row.serviceId }
                            : { custom_name: row.treatment.trim() }),
                        status: 'pending',
                        started_at: todayISODate(),
                        patient_price: amount,
                        notes: row.notes.trim(),
                        is_active: true,
                        podology_context: podologyContext,
                    },
                });
            }
            setServiceFlowOpen(false);
            await refreshPlan();
            emit('systemMessage', {
                text: 'Procedimentos salvos com sucesso.',
                type: 'success',
            });
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : 'Nao foi possivel salvar os procedimentos.';
            emit('systemMessage', {
                text: message || 'Nao foi possivel salvar os procedimentos.',
                type: 'error',
            });
        } finally {
            setSavingServiceFlow(false);
        }
    }

    return {
        ...clinicalFlows,
        activeRegionIds,

        serviceFlowOpen,
        savingServiceFlow,
        serviceRows,
        openServiceFlowModal,
        closeServiceFlowModal,
        toggleRegionRow,
        addGeneralRow,
        updateServiceRow,
        removeServiceRow,
        saveServiceFlow,
    };
}
