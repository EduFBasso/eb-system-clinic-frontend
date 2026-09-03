// Owns the Odonto-specific service creation flow and composes useClinicalItemFlows.
import React from 'react';
import { emit } from '../../events/bus';
import { ApiError, apiFetch } from '../../utils/apiFetch';
import { parseAmount, validateAmount } from '../../utils/currency';
import { todayISODate } from '../../utils/TreatmentHelpers';
import type { PlanListItem, TreatmentItem } from '../../utils/TreatmentHelpers';
import type { ServiceFlowType, ServiceRow } from './OdontoAnatomyHelpers';
import { dentalContextFromServiceRow } from './OdontoAnatomyHelpers';
import { useClinicalItemFlows } from '../../hooks/useClinicalItemFlows';

export { dentalContextFromServiceRow };

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
    const clinicalFlows = useClinicalItemFlows(plan, items, refreshPlan);

    const [serviceFlowOpen, setServiceFlowOpen] = React.useState(false);
    const [savingServiceFlow, setSavingServiceFlow] = React.useState(false);
    const [serviceFlowType, setServiceFlowType] =
        React.useState<ServiceFlowType>('tooth');
    const [serviceRows, setServiceRows] = React.useState<ServiceRow[]>([]);

    const activeToothNumbers = React.useMemo(() => {
        const nums = new Set<number>();
        for (const item of items) {
            if (!item.is_active) continue;
            const tn = item.dental_context?.tooth_number;
            if (tn != null) nums.add(tn);
        }
        return nums;
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

    async function saveServiceFlow(rowsToSave = serviceRows) {
        if (!plan) return;
        if (rowsToSave.length === 0) {
            emit('systemMessage', {
                text: 'Adicione ao menos um item.',
                type: 'warning',
            });
            return;
        }
        for (const row of rowsToSave) {
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
            for (const row of rowsToSave) {
                const amount = row.value.trim() ? parseAmount(row.value) : null;
                const dentalContext = dentalContextFromServiceRow(row);

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

    return {
        ...clinicalFlows,
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
    };
}
