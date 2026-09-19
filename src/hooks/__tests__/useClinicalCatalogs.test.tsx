import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../../utils/apiFetch';
import { useClinicalCatalogs } from '../useClinicalCatalogs';

vi.mock('../../utils/apiFetch', () => ({
    apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('useClinicalCatalogs treatment categories', () => {
    beforeEach(() => {
        apiFetchMock.mockReset();
    });

    it('indexes a new service with its row category and returns its catalog id', async () => {
        apiFetchMock
            .mockResolvedValueOnce({ id: 44 })
            .mockResolvedValueOnce([] as unknown as Record<string, unknown>);
        const { result } = renderHook(() => useClinicalCatalogs(false, false));

        const rows = [
            {
                toothNumber: null,
                toothSurface: '',
                scope: 'arch' as const,
                arcadeArch: 'AMBAS' as const,
                treatment: 'Limpeza completa',
                serviceId: null,
                value: '300,00',
                notes: 'Inclui polimento.',
            },
        ];

        let resolvedRows = null;
        await act(async () => {
            resolvedRows = await result.current.saveNewServicesToCatalog(
                rows,
                [0],
            );
        });

        expect(apiFetchMock).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining('/inventory/services/'),
            {
                method: 'POST',
                body: {
                    name: 'Limpeza completa',
                    base_price: 300,
                    description: 'Inclui polimento.',
                    default_notes: 'Inclui polimento.',
                    treatment_scopes: ['arch'],
                },
            },
        );
        expect(resolvedRows).toMatchObject([{ serviceId: 44 }]);
    });

    it('adds a category to an existing service and reuses its catalog id', async () => {
        const existingService = {
            id: 20,
            name: 'Restauração',
            base_price: 250,
            treatment_scopes: ['tooth'],
        };
        apiFetchMock
            .mockResolvedValueOnce([existingService] as unknown as Record<
                string,
                unknown
            >)
            .mockResolvedValueOnce({ id: 20 })
            .mockResolvedValueOnce([
                {
                    ...existingService,
                    treatment_scopes: ['tooth', 'arch'],
                },
            ] as unknown as Record<string, unknown>);
        const { result } = renderHook(() => useClinicalCatalogs(true, false));
        await waitFor(() =>
            expect(result.current.serviceCatalog).toHaveLength(1),
        );

        let resolvedRows = null;
        await act(async () => {
            resolvedRows = await result.current.saveNewServicesToCatalog(
                [
                    {
                        toothNumber: null,
                        toothSurface: '',
                        scope: 'arch',
                        arcadeArch: 'superior',
                        treatment: 'Restauração',
                        serviceId: null,
                        value: '250,00',
                        notes: '',
                    },
                ],
                [0],
            );
        });

        expect(apiFetchMock).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining('/inventory/services/20/'),
            {
                method: 'PATCH',
                body: { treatment_scopes: ['tooth', 'arch'] },
            },
        );
        expect(resolvedRows).toMatchObject([{ serviceId: 20 }]);
    });
});
