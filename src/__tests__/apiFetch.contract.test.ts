import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, extractApiErrorMessage } from '../utils/apiFetch';

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

function lastRequest(fetchMock: ReturnType<typeof vi.fn>) {
    const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    return { url, init, headers: init.headers as Record<string, string> };
}

describe('apiFetch backend contract', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        localStorage.clear();
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sends Accept, a persistent X-Device-Id and the stored bearer token', async () => {
        localStorage.setItem('accessToken', 'access-123');
        fetchMock.mockResolvedValue(jsonResponse({ count: 1 }));

        await apiFetch('/api/v1/clinic/agenda/appointments/');
        const first = lastRequest(fetchMock);
        await apiFetch('/api/v1/clinic/agenda/appointments/');
        const second = lastRequest(fetchMock);

        expect(first.url.endsWith('/api/v1/clinic/agenda/appointments/')).toBe(true);
        expect(first.headers.Accept).toBe('application/json');
        expect(first.headers.Authorization).toBe('Bearer access-123');
        expect(first.headers['X-Device-Id']).toBeTruthy();
        expect(second.headers['X-Device-Id']).toBe(
            first.headers['X-Device-Id'],
        );
    });

    it('omits Authorization without a token and keeps an explicit one', async () => {
        fetchMock.mockResolvedValue(jsonResponse({}));

        await apiFetch('/token/');
        expect(lastRequest(fetchMock).headers.Authorization).toBeUndefined();

        localStorage.setItem('accessToken', 'stored');
        await apiFetch('/token/', { headers: { Authorization: 'Bearer own' } });
        expect(lastRequest(fetchMock).headers.Authorization).toBe('Bearer own');
    });

    it('throws ApiError with status, code and the backend detail', async () => {
        fetchMock.mockResolvedValue(
            jsonResponse(
                { detail: 'Token inválido.', code: 'token_not_valid' },
                401,
            ),
        );

        const error = await apiFetch('/api/v1/clinic/agenda/appointments/').catch(
            (e: unknown) => e,
        );

        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({
            status: 401,
            code: 'token_not_valid',
            message: 'Token inválido.',
        });
    });

    it('serializes object bodies as JSON', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

        await apiFetch('/api/v1/clinic/agenda/appointments/', {
            method: 'POST',
            body: { client: 1 },
        });

        const { init, headers } = lastRequest(fetchMock);
        expect(headers['Content-Type']).toBe('application/json');
        expect(init.body).toBe('{"client":1}');
    });

    it('wraps network failures as ApiError with status 0', async () => {
        fetchMock.mockRejectedValue(new Error('offline'));

        await expect(
            apiFetch('/api/v1/clinic/agenda/appointments/'),
        ).rejects.toMatchObject({
            status: 0,
            message: 'offline',
        });
    });
});

describe('extractApiErrorMessage', () => {
    it.each([
        [{ detail: 'Credenciais inválidas.' }, 'Credenciais inválidas.'],
        [{ non_field_errors: ['Conta desativada.'] }, 'Conta desativada.'],
        [{ tenant_slug: ['Informe o tenant.'] }, 'Informe o tenant.'],
        [{ message: 'Falha geral.' }, 'Falha geral.'],
    ])('reads %j', (payload, expected) => {
        expect(extractApiErrorMessage(payload)).toBe(expected);
    });

    it('falls back for empty or non-object payloads', () => {
        expect(extractApiErrorMessage(null, 'fallback')).toBe('fallback');
        expect(extractApiErrorMessage({ detail: '  ' }, 'fallback')).toBe(
            'fallback',
        );
    });
});
