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
    initialPlanId: number | null = null,
) {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [clientName, setClientName] = React.useState<string | null>(null);

    const [allPlans, setAllPlans] = React.useState<PlanListItem[]>([]);
    const [plan, setPlan] = React.useState<PlanListItem | null>(null);
    const activePlanIdRef = React.useRef<number | null>(initialPlanId);
    const [items, setItems] = React.useState<TreatmentItem[]>([]);
    const [planModalOpen, setPlanModalOpen] = React.useState(false);
    const [savingCreatePlan, setSavingCreatePlan] = React.useState(false);
    const [markingPrinted, setMarkingPrinted] = React.useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
        planId: number;
    } | null>(null);

    const [paymentCondition, setPaymentCondition] =
        React.useState<PaymentCondition>('avista');
    const [installmentsCount, setInstallmentsCount] = React.useState(2);
    const [firstDueDate, setFirstDueDate] = React.useState(todayISODate());
    const [planNotes, setPlanNotes] = React.useState('');
    const [savingPlanDetails, setSavingPlanDetails] = React.useState(false);
    const detailsDirtyRef = React.useRef(false);
    const hydratedPlanIdRef = React.useRef<number | null>(null);

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

    function hydratePlanDetails(source: PlanListItem) {
        setPaymentCondition(source.payment_condition ?? 'avista');
        setInstallmentsCount(source.installments_count ?? 2);
        setFirstDueDate(source.first_due_date ?? '');
        setPlanNotes(source.notes ?? '');
        hydratedPlanIdRef.current = source.id;
        detailsDirtyRef.current = false;
    }

    const isPlanDetailsDirty = Boolean(
        plan &&
        (paymentCondition !== (plan.payment_condition ?? 'avista') ||
            installmentsCount !== (plan.installments_count ?? 2) ||
            firstDueDate !== (plan.first_due_date ?? '') ||
            planNotes !== (plan.notes ?? '')),
    );

    React.useEffect(() => {
        detailsDirtyRef.current = isPlanDetailsDirty;
    }, [isPlanDetailsDirty]);

    const loadPlan = React.useCallback(async () => {
        if (!canAccess || !numericClientId) return;
        setLoading(true);
        setError(null);
        try {
            const [plansRes, clientRes] = await Promise.all([
                apiFetch(`/clinic/treatment/plans/?client=${numericClientId}`),
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
            setAllPlans(activePlans);
            // Preserve the active workspace while refreshing plan and item data.
            const activePlanId = activePlanIdRef.current;
            if (activePlanId !== null) {
                const refreshed = activePlans.find(p => p.id === activePlanId);
                if (refreshed) {
                    activePlanIdRef.current = refreshed.id;
                    setPlan(refreshed);
                    if (
                        hydratedPlanIdRef.current !== refreshed.id ||
                        !detailsDirtyRef.current
                    ) {
                        hydratePlanDetails(refreshed);
                    }
                    const itemsRes = await apiFetch(
                        `/clinic/treatment/items/?plan=${refreshed.id}`,
                    );
                    setItems(asList<TreatmentItem>(itemsRes));
                } else {
                    activePlanIdRef.current = null;
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
    }, [canAccess, numericClientId]);

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
            activePlanIdRef.current = selectedPlan.id;
            setPlan(selectedPlan);
            setItems([]);
            hydratePlanDetails(selectedPlan);
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
        activePlanIdRef.current = found.id;
        setPlan(found);
        setItems([]);
        hydratePlanDetails(found);
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
        activePlanIdRef.current = null;
        setPlan(null);
        setItems([]);
        void loadPlan();
    }

    async function deletePlan(planId: number) {
        setDeleteConfirmation({ planId });
    }

    function cancelDeletePlan() {
        setDeleteConfirmation(null);
    }

    async function confirmDeletePlan() {
        if (!deleteConfirmation) return;
        const { planId } = deleteConfirmation;
        setDeleteConfirmation(null);
        try {
            await apiFetch(`/clinic/treatment/plans/${planId}/`, {
                method: 'DELETE',
            });
            setAllPlans(prev => prev.filter(p => p.id !== planId));
            if (plan?.id === planId) {
                activePlanIdRef.current = null;
                setPlan(null);
                setItems([]);
            }
            emit('systemMessage', {
                text: 'Plano, tratamentos, produtos e valores removidos definitivamente.',
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

    function cancelPlanDetails() {
        if (plan) hydratePlanDetails(plan);
    }

    async function savePlanDetails() {
        if (!plan || savingPlanDetails || !isPlanDetailsDirty) return;
        setSavingPlanDetails(true);
        try {
            const updated = (await apiFetch(
                `/clinic/treatment/plans/${plan.id}/`,
                {
                    method: 'PATCH',
                    body: {
                        payment_condition: paymentCondition,
                        installments_count: installmentsCount,
                        first_due_date:
                            paymentCondition === 'aprazo' && firstDueDate
                                ? firstDueDate
                                : null,
                        notes: planNotes,
                    },
                },
            )) as PlanListItem;
            const persisted = { ...plan, ...updated };
            setPlan(persisted);
            setAllPlans(prev =>
                prev.map(item => (item.id === persisted.id ? persisted : item)),
            );
            hydratePlanDetails(persisted);
            emit('systemMessage', {
                text: 'Condição de pagamento e observações salvas.',
                type: 'success',
            });
        } catch (err) {
            emit('systemMessage', {
                text:
                    err instanceof ApiError
                        ? err.message
                        : 'Não foi possível salvar os dados do plano.',
                type: 'error',
            });
        } finally {
            setSavingPlanDetails(false);
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
        planNotes,
        setPlanNotes,
        savingPlanDetails,
        isPlanDetailsDirty,
        cancelPlanDetails,
        savePlanDetails,
        planTotal,
        installmentValue,
        isPlanLocked,
        lockAfterPrint,
        updateLockAfterPrint,
        loadPlan,
        createPlan,
        selectPlan,
        deletePlan,
        deleteConfirmation,
        cancelDeletePlan,
        confirmDeletePlan,
        markPrinted,
        backToPlanList,
    };
}
