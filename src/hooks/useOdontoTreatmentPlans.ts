// Owns plan identity, plan list, plan-level notes and payment/installments state.
import React from 'react';
import { emit } from '../events/bus';
import { ApiError, apiFetch } from '../utils/apiFetch';
import {
    asList,
    computePlanTotal,
    todayISODate,
} from '../pages/odontoArcadeHelpers';
import type {
    PaymentCondition,
    PlanListItem,
    TreatmentItem,
} from '../pages/odontoArcadeHelpers';

export function useOdontoTreatmentPlans(
    numericClientId: number,
    canAccess: boolean,
) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [clientName, setClientName] = React.useState<string | null>(null);

    const [allPlans, setAllPlans] = React.useState<PlanListItem[]>([]);
    const [plan, setPlan] = React.useState<PlanListItem | null>(null);
    const [items, setItems] = React.useState<TreatmentItem[]>([]);
    const [planModalOpen, setPlanModalOpen] = React.useState(false);
    const [savingCreatePlan, setSavingCreatePlan] = React.useState(false);
    const [markingPrinted, setMarkingPrinted] = React.useState(false);
    const [showArchivedPlans, setShowArchivedPlans] = React.useState(false);

    // Payment condition — local UI state, not persisted per plan yet.
    const [paymentCondition, setPaymentCondition] =
        React.useState<PaymentCondition>('avista');
    const [installmentsCount, setInstallmentsCount] = React.useState(2);
    const [firstDueDate, setFirstDueDate] = React.useState(todayISODate());

    const planTotal = React.useMemo(() => computePlanTotal(items), [items]);
    const installmentValue = React.useMemo(() => {
        if (installmentsCount <= 0) return 0;
        return planTotal / installmentsCount;
    }, [planTotal, installmentsCount]);
    const [lockAfterPrint, setLockAfterPrint] = React.useState(true);
    const isPlanLocked = Boolean(plan?.is_printed);

    React.useEffect(() => {
        try {
            const stored = localStorage.getItem('loggedProfessional');
            if (!stored) return;
            const professional = JSON.parse(stored) as {
                lock_odonto_plan_after_print?: boolean;
            };
            setLockAfterPrint(
                professional.lock_odonto_plan_after_print !== false,
            );
        } catch {
            setLockAfterPrint(true);
        }
    }, []);

    function resetPaymentCondition() {
        setPaymentCondition('avista');
        setInstallmentsCount(2);
        setFirstDueDate(todayISODate());
    }

    const loadPlan = React.useCallback(async () => {
        if (!canAccess || !numericClientId) return;
        setLoading(true);
        setError(null);
        try {
            const [plansRes, archivedPlansRes, clientRes] = await Promise.all([
                apiFetch(`/clinic/treatment/plans/?client=${numericClientId}`),
                showArchivedPlans
                    ? apiFetch(
                          `/clinic/treatment/plans/?client=${numericClientId}&status=archived`,
                      )
                    : Promise.resolve([]),
                apiFetch(`/register/clients/${numericClientId}/`).catch(
                    () => null,
                ),
            ]);
            if (clientRes && typeof clientRes === 'object') {
                const c = clientRes as {
                    first_name?: string;
                    last_name?: string;
                };
                const fullName =
                    `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
                if (fullName) setClientName(fullName);
            }
            const activePlans = asList<PlanListItem>(plansRes);
            const archivedPlans = asList<PlanListItem>(archivedPlansRes);
            const plans = [
                ...activePlans,
                ...archivedPlans.filter(
                    archived =>
                        !activePlans.some(active => active.id === archived.id),
                ),
            ];
            setAllPlans(plans);
            // If a plan was already active, refresh its data; otherwise show plan list.
            if (plan) {
                const refreshed = plans.find(p => p.id === plan.id);
                if (refreshed) {
                    setPlan(refreshed);
                    const itemsRes = await apiFetch(
                        `/clinic/treatment/items/?plan=${refreshed.id}`,
                    );
                    setItems(asList<TreatmentItem>(itemsRes));
                } else {
                    setPlan(null);
                    setItems([]);
                }
            } else {
                setPlan(null);
                setItems([]);
            }
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : 'Nao foi possivel carregar os dados.';
            setError(message || 'Nao foi possivel carregar os dados.');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canAccess, numericClientId, showArchivedPlans]);

    React.useEffect(() => {
        void loadPlan();
    }, [loadPlan]);

    async function createPlan(data: {
        name: string;
        notes: string;
        started_at: string;
    }) {
        if (!numericClientId || savingCreatePlan) return;
        setSavingCreatePlan(true);
        try {
            const created = (await apiFetch('/clinic/treatment/plans/', {
                method: 'POST',
                body: {
                    client: numericClientId,
                    status: 'pending',
                    name: data.name,
                    notes: data.notes,
                    started_at: data.started_at,
                },
            })) as PlanListItem;
            setPlanModalOpen(false);
            // Immediately enter the new plan workspace.
            const selectedPlan = { ...created };
            setAllPlans(prev => [selectedPlan, ...prev]);
            setPlan(selectedPlan);
            setItems([]);
            resetPaymentCondition();
            emit('systemMessage', {
                text: 'Plano de tratamento criado.',
                type: 'success',
            });
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : 'Nao foi possivel criar o plano.';
            emit('systemMessage', {
                text: message || 'Nao foi possivel criar o plano.',
                type: 'error',
            });
        } finally {
            setSavingCreatePlan(false);
        }
    }

    async function selectPlan(planId: number) {
        const found = allPlans.find(p => p.id === planId);
        if (!found) return;
        setPlan(found);
        setItems([]);
        resetPaymentCondition();
        try {
            const res = await apiFetch(
                `/clinic/treatment/items/?plan=${planId}`,
            );
            setItems(asList<TreatmentItem>(res));
        } catch {
            emit('systemMessage', {
                text: 'Nao foi possivel carregar os itens do plano.',
                type: 'error',
            });
        }
    }

    function backToPlanList() {
        setPlan(null);
        setItems([]);
        void loadPlan();
    }

    async function deletePlan(planId: number) {
        const planToDelete = allPlans.find(item => item.id === planId);
        const hasTreatmentHistory =
            (planToDelete?.pending_items ?? 0) > 0 ||
            (planToDelete?.completed_items ?? 0) > 0;
        if (
            !window.confirm(
                hasTreatmentHistory
                    ? 'Remover este plano? Como ele possui tratamentos, será arquivado para preservar o histórico.'
                    : 'Remover este plano definitivamente? Esta ação não poderá ser desfeita.',
            )
        )
            return;
        try {
            await apiFetch(`/clinic/treatment/plans/${planId}/`, {
                method: 'DELETE',
            });
            setAllPlans(prev => prev.filter(p => p.id !== planId));
            if (plan?.id === planId) {
                setPlan(null);
                setItems([]);
            }
            emit('systemMessage', {
                text: hasTreatmentHistory
                    ? 'Plano arquivado para preservar o histórico.'
                    : 'Plano removido definitivamente.',
                type: 'success',
            });
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : 'Nao foi possivel remover o plano.';
            emit('systemMessage', {
                text: message || 'Nao foi possivel remover o plano.',
                type: 'error',
            });
        }
    }

    async function savePlanNotes(value: string) {
        if (!plan) return;
        try {
            await apiFetch(`/clinic/treatment/plans/${plan.id}/`, {
                method: 'PATCH',
                body: { notes: value },
            });
        } catch {
            // silently fail — data stays in input
        }
    }

    async function markPrinted() {
        if (!plan || markingPrinted) {
            window.print();
            return;
        }
        if (plan.is_printed || !lockAfterPrint) {
            window.print();
            return;
        }
        setMarkingPrinted(true);
        try {
            const updated = (await apiFetch(
                `/clinic/treatment/plans/${plan.id}/mark-printed/`,
                { method: 'POST' },
            )) as PlanListItem;
            setPlan(updated);
            setAllPlans(prev =>
                prev.map(p => (p.id === updated.id ? updated : p)),
            );
        } catch (err) {
            const message =
                err instanceof ApiError
                    ? err.message
                    : 'Nao foi possivel travar o plano para impressao.';
            emit('systemMessage', {
                text:
                    message ||
                    'Nao foi possivel travar o plano para impressao.',
                type: 'error',
            });
        } finally {
            setMarkingPrinted(false);
            window.print();
        }
    }

    async function updateLockAfterPrint(enabled: boolean) {
        setLockAfterPrint(enabled);
        try {
            const updated = (await apiFetch('/register/professionals/me/', {
                method: 'PATCH',
                body: { lock_odonto_plan_after_print: enabled },
            })) as { lock_odonto_plan_after_print?: boolean };
            localStorage.setItem(
                'loggedProfessional',
                JSON.stringify({
                    ...JSON.parse(
                        localStorage.getItem('loggedProfessional') || '{}',
                    ),
                    ...updated,
                }),
            );
            emit('systemMessage', {
                text: enabled
                    ? 'Bloqueio após impressão ativado.'
                    : 'Bloqueio após impressão desativado para novas impressões.',
                type: 'success',
            });
        } catch (err) {
            setLockAfterPrint(!enabled);
            emit('systemMessage', {
                text:
                    err instanceof ApiError
                        ? err.message
                        : 'Não foi possível salvar a preferência de impressão.',
                type: 'error',
            });
        }
    }

    return {
        loading,
        error,
        clientName,
        allPlans,
        showArchivedPlans,
        setShowArchivedPlans,
        plan,
        items,
        planModalOpen,
        setPlanModalOpen,
        savingCreatePlan,
        markingPrinted,
        paymentCondition,
        setPaymentCondition,
        installmentsCount,
        setInstallmentsCount,
        firstDueDate,
        setFirstDueDate,
        planTotal,
        installmentValue,
        isPlanLocked,
        lockAfterPrint,
        updateLockAfterPrint,
        loadPlan,
        createPlan,
        selectPlan,
        deletePlan,
        savePlanNotes,
        markPrinted,
        backToPlanList,
    };
}
