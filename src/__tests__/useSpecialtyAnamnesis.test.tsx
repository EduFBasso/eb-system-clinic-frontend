import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSpecialtyAnamnesis } from '../components/ClientForm/useSpecialtyAnamnesis';

const client = {
    first_name: 'Cliente',
    last_name: 'Teste',
    email: '',
    phone: '11999999999',
    profession: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: '',
    anamnese_podologia: { footwear_used: 'Tênis' },
    anamnese_odontologia: { gum_bleeding: true },
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('useSpecialtyAnamnesis', () => {
    it('materializes and contributes only podologia data', () => {
        const { result } = renderHook(() =>
            useSpecialtyAnamnesis({
                capabilities: { clinic: true, podologia: true },
                cliente: client,
                enabled: true,
            }),
        );

        expect(result.current.model.kind).toBe('podologia');
        expect(result.current.snapshot).toEqual(
            expect.objectContaining({
                kind: 'podologia',
                values: expect.objectContaining({ footwear_used: 'Tênis' }),
            }),
        );
        expect(result.current.getNestedPayload()).toEqual({
            anamnese_podologia: expect.any(Object),
        });
    });

    it('materializes odonto data without adding it to the client payload', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true });
        vi.stubGlobal('fetch', fetchMock);
        const { result } = renderHook(() =>
            useSpecialtyAnamnesis({
                capabilities: { clinic: true, odonto: true },
                cliente: client,
                enabled: true,
            }),
        );

        expect(result.current.model.kind).toBe('odonto');
        expect(result.current.getNestedPayload()).toEqual({});

        await act(async () => {
            await result.current.saveAfterClient(42, 'token');
        });
        const request = fetchMock.mock.calls[0][1] as RequestInit;
        const body = JSON.parse(String(request.body));
        expect(body).toEqual(
            expect.objectContaining({ client_id: 42, gum_bleeding: true }),
        );
        expect(body).not.toHaveProperty('anamnese_podologia');
    });

    it('materializes no specialty for public mode or ambiguous capabilities', () => {
        const publicResult = renderHook(() =>
            useSpecialtyAnamnesis({
                capabilities: { clinic: true, odonto: true },
                cliente: client,
                enabled: false,
            }),
        );
        const ambiguousResult = renderHook(() =>
            useSpecialtyAnamnesis({
                capabilities: {
                    clinic: true,
                    odonto: true,
                    podologia: true,
                },
                cliente: client,
                enabled: true,
            }),
        );

        expect(publicResult.result.current.snapshot).toEqual({ kind: 'none' });
        expect(ambiguousResult.result.current.snapshot).toEqual({
            kind: 'none',
        });
    });
});
