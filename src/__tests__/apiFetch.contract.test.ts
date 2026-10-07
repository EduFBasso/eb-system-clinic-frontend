import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, extractApiErrorMessage } from '../utils/apiFetch';
import { on } from '../events/bus';

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

        await apiFetch('/sessions/summary');
        const first = lastRequest(fetchMock);
        await apiFetch('/sessions/summary');
        const second = lastRequest(fetchMock);

        expect(first.url.endsWith('/sessions/summary')).toBe(true);
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

    it('serializes object bodies as JSON', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

        await apiFetch('/sessions/revoke', {
            method: 'POST',
            body: { mode: 'all_except_current' },
        });

        const { init, headers } = lastRequest(fetchMock);
        expect(headers['Content-Type']).toBe('application/json');
        expect(init.body).toBe('{"mode":"all_except_current"}');
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

    it('wraps network failures as ApiError with status 0', async () => {
        fetchMock.mockRejectedValue(new Error('offline'));

        await expect(apiFetch('/sessions/summary')).rejects.toMatchObject({
            status: 0,
            message: 'offline',
        });
    });

    describe('device session invalidation', () => {
        const logoutReasons: (string | undefined)[] = [];
        let dispose: () => void;

        beforeEach(() => {
            logoutReasons.length = 0;
            dispose = on('auth:logout', payload =>
                logoutReasons.push(payload?.reason),
            );
        });

        afterEach(() => dispose());

        it.each([
            'Sessão de dispositivo revogada/inativa.',
            'Sessão de dispositivo revogada ou inexistente.',
            'Sessão de dispositivo não encontrada.',
        ])('logs out when the backend says "%s"', async detail => {
            localStorage.setItem('accessToken', 'access-123');
            fetchMock.mockResolvedValue(jsonResponse({ detail }, 401));

            await expect(apiFetch('/sessions/summary')).rejects.toBeInstanceOf(
                ApiError,
            );

            expect(localStorage.getItem('accessToken')).toBeNull();
            expect(logoutReasons).toEqual(['device_session_invalid']);
        });

        it('does not log out when suppressAutoLogout is set', async () => {
            localStorage.setItem('accessToken', 'access-123');
            fetchMock.mockResolvedValue(
                jsonResponse(
                    { detail: 'Sessão de dispositivo revogada/inativa.' },
                    401,
                ),
            );

            await expect(
                apiFetch('/sessions/summary', { suppressAutoLogout: true }),
            ).rejects.toBeInstanceOf(ApiError);

            expect(localStorage.getItem('accessToken')).toBe('access-123');
            expect(logoutReasons).toEqual([]);
        });

        it('keeps the session for unrelated 401 and 403 responses', async () => {
            localStorage.setItem('accessToken', 'access-123');
            fetchMock.mockResolvedValueOnce(
                jsonResponse({ detail: 'Token inválido.' }, 401),
            );
            fetchMock.mockResolvedValueOnce(
                jsonResponse({ detail: 'Sem permissão.' }, 403),
            );

            await apiFetch('/api/v1/clinic/agenda/appointments/').catch(() => undefined);
            await apiFetch('/api/v1/clinic/agenda/appointments/').catch(() => undefined);

            expect(localStorage.getItem('accessToken')).toBe('access-123');
            expect(logoutReasons).toEqual([]);
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
