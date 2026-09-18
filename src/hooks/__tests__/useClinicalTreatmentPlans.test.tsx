import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../../utils/apiFetch';
import type { PlanListItem, TreatmentItem } from '../../utils/TreatmentHelpers';
import { useClinicalTreatmentPlans } from '../useClinicalTreatmentPlans';

vi.mock('../../utils/apiFetch', () => ({
    apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

const basePlan: PlanListItem = {
    id: 7,
    name: 'Plano de teste',
    status: 'pending' as const,
    payment_condition: 'avista' as const,
    installments_count: 2,
    first_due_date: null,
    notes: '',
    is_printed: false,
};

const pricedItem: TreatmentItem = {
    id: 10,
    plan: 7,
    kind: 'product' as const,
    service: null,
    product: 3,
    custom_name: 'Produto teste',
    status: 'pending' as const,
    patient_price: 50,
    quantity: 1,
    started_at: null,
    completed_at: null,
    notes: '',
    is_active: true,
    external_item_id: null,
    parent_item: null,
};

function mockPlanLoad(
    plan: PlanListItem = basePlan,
    items: TreatmentItem[] = [pricedItem],
) {
    apiFetchMock
        .mockResolvedValueOnce([plan] as unknown as Record<string, unknown>)
        .mockResolvedValueOnce({ first_name: 'Paciente', last_name: 'Teste' })
        .mockResolvedValueOnce(items as unknown as Record<string, unknown>);
}

describe('useClinicalTreatmentPlans payment and printing flow', () => {
    beforeEach(() => {
        apiFetchMock.mockReset();
        localStorage.clear();
    });

    it('autosaves payment changes without a success message', async () => {
        mockPlanLoad();
        apiFetchMock.mockResolvedValueOnce({
            ...basePlan,
            payment_condition: 'aprazo',
            installments_count: 3,
            first_due_date: '2026-10-01',
        });
        const messages: CustomEvent[] = [];
        const listener = (event: Event) => messages.push(event as CustomEvent);
        window.addEventListener('systemMessage', listener);

        const { result } = renderHook(() =>
            useClinicalTreatmentPlans(12, true, 7),
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            result.current.setPaymentCondition('aprazo');
            result.current.setInstallmentsCount(3);
            result.current.setFirstDueDate('2026-10-01');
            await new Promise(resolve => window.setTimeout(resolve, 450));
        });

        await waitFor(() =>
            expect(apiFetchMock).toHaveBeenCalledWith(
                '/clinic/treatment/plans/7/',
                {
                    method: 'PATCH',
                    body: {
                        payment_condition: 'aprazo',
                        installments_count: 3,
                        first_due_date: '2026-10-01',
                        notes: '',
                    },
                },
            ),
        );
        expect(messages).toHaveLength(0);
        window.removeEventListener('systemMessage', listener);
    });

    it('blocks printing and emits a warning when the plan total is zero', async () => {
        mockPlanLoad(basePlan, []);
        const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
        const { result } = renderHook(() =>
            useClinicalTreatmentPlans(12, true, 7),
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.markPrinted();
        });

        expect(result.current.printValidationMessage).toContain(
            'Adicione pelo menos um tratamento ou produto',
        );
        expect(printSpy).not.toHaveBeenCalled();
        expect(apiFetchMock).toHaveBeenCalledTimes(3);
        printSpy.mockRestore();
    });

    it('blocks printing a prazo when the first due date is missing', async () => {
        mockPlanLoad({
            ...basePlan,
            payment_condition: 'aprazo',
            installments_count: 2,
            first_due_date: null,
        });
        const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
        const { result } = renderHook(() =>
            useClinicalTreatmentPlans(12, true, 7),
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.markPrinted();
        });

        expect(result.current.printValidationMessage).toContain(
            'data de vencimento da primeira parcela',
        );
        expect(printSpy).not.toHaveBeenCalled();
        printSpy.mockRestore();
    });

    it('prints and locks a positive avista plan', async () => {
        mockPlanLoad();
        apiFetchMock.mockResolvedValueOnce({ ...basePlan, is_printed: true });
        const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
        const { result } = renderHook(() =>
            useClinicalTreatmentPlans(12, true, 7),
        );
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.markPrinted();
        });

        expect(apiFetchMock).toHaveBeenLastCalledWith(
            '/clinic/treatment/plans/7/mark-printed/',
            { method: 'POST' },
        );
        expect(printSpy).toHaveBeenCalledTimes(1);
        printSpy.mockRestore();
    });
});
