// Centralized fetch wrapper to automatically attach auth/device audit headers.
// Usage: import { apiFetch } from '../utils/apiFetch';
// const data = await apiFetch('/api/v1/clinic/agenda/appointments/');

import { API_BASE } from '../config/api';
import { getOrCreateDeviceId } from './device';
import { startPerformanceSpan } from './telemetry';

// Custom error shape so callers can differentiate
export class ApiError extends Error {
    status: number;
    code?: string;
    constructor(message: string, status: number, code?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

// DRF devolve erros de validação sob chaves variadas conforme a origem
// (non_field_errors para ValidationError genérico, detail para
// PermissionDenied/AuthenticationFailed, ou o próprio nome do campo). Sem
// isso, rejeições distintas do login Clinic (slug ausente, especialidades
// conflitantes, conta desativada) todas caíam numa mensagem genérica.
export function extractApiErrorMessage(
    data: unknown,
    fallback = 'Erro ao processar a solicitação.',
): string {
    if (!data || typeof data !== 'object') {
        return fallback;
    }
    const payload = data as Record<string, unknown>;
    const candidates = [
        payload.detail,
        payload.non_field_errors,
        payload.tenant_slug,
        payload.message,
    ];
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate;
        }
        if (
            Array.isArray(candidate) &&
            typeof candidate[0] === 'string' &&
            candidate[0].trim()
        ) {
            return candidate[0];
        }
    }
    return fallback;
}

type JsonSerializable = Record<string, unknown> | unknown[];

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
    // If relative path provided, it's joined with API_BASE.
    body?: RequestInit['body'] | JsonSerializable;
    timeoutMs?: number;
}

function createRequestSignal(signal?: AbortSignal, timeoutMs?: number) {
    if (!timeoutMs || timeoutMs <= 0) {
        return {
            signal,
            cleanup: () => {},
            didTimeout: () => false,
        };
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    const abortFromSource = () => controller.abort();

    if (signal) {
        if (signal.aborted) {
            abortFromSource();
        } else {
            signal.addEventListener('abort', abortFromSource, { once: true });
        }
    }

    return {
        signal: controller.signal,
        cleanup: () => {
            clearTimeout(timeoutId);
            signal?.removeEventListener('abort', abortFromSource);
        },
        didTimeout: () => timedOut,
    };
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
    const { headers, timeoutMs, signal, ...rest } = options;
    const deviceId = getOrCreateDeviceId('device_id');
    const token =
        typeof window !== 'undefined'
            ? localStorage.getItem('accessToken')
            : null;

    const finalHeaders: Record<string, string> = {
        Accept: 'application/json',
        'X-Device-Id': deviceId,
        ...Object.fromEntries(
            Object.entries(headers || {}).map(([k, v]) => [k, String(v)]),
        ),
    };
    if (token && !finalHeaders['Authorization']) {
        finalHeaders['Authorization'] = `Bearer ${token}`;
    }
    // Ensure JSON content-type for bodies that are plain objects
    if (
        rest.body &&
        typeof rest.body === 'object' &&
        !(rest.body instanceof FormData) &&
        !(rest.body instanceof Blob)
    ) {
        if (!finalHeaders['Content-Type'])
            finalHeaders['Content-Type'] = 'application/json';
        if (finalHeaders['Content-Type'].includes('application/json')) {
            rest.body = JSON.stringify(rest.body) as unknown as BodyInit;
        }
    }

    const url = path.startsWith('http') ? path : `${API_BASE || ''}${path}`;
    const finishPerformance = startPerformanceSpan(`api:${path.split('?')[0]}`);
    const requestSignal = createRequestSignal(signal ?? undefined, timeoutMs);
    let response: Response;
    // Ensure body type matches fetch signature (string, FormData, Blob, etc.)
    let fetchBody: BodyInit | null | undefined = rest.body as
        | BodyInit
        | null
        | undefined;
    if (
        rest.body &&
        typeof rest.body === 'object' &&
        !(rest.body instanceof FormData) &&
        !(rest.body instanceof Blob) &&
        !(rest.body instanceof URLSearchParams)
    ) {
        // Already stringified above if JSON; ensure string type
        if (typeof rest.body !== 'string') {
            fetchBody = JSON.stringify(rest.body) as unknown as BodyInit;
        }
    }
    try {
        response = await fetch(url, {
            ...rest,
            body: fetchBody,
            headers: finalHeaders,
            signal: requestSignal.signal,
        });
    } catch (e) {
        requestSignal.cleanup();
        finishPerformance({
            ok: false,
            error: requestSignal.didTimeout()
                ? 'timeout'
                : e instanceof Error
                  ? e.message
                  : 'network_error',
        });
        if (requestSignal.didTimeout()) {
            throw new ApiError(
                'Tempo limite da requisicao excedido.',
                0,
                'timeout',
            );
        }
        const message = e instanceof Error ? e.message : 'Network error';
        throw new ApiError(message, 0);
    }
    requestSignal.cleanup();

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    let bodyText = '';
    let json: Record<string, unknown> | null = null;
    try {
        if (isJson) {
            json = await response.json();
            bodyText = JSON.stringify(json);
        } else {
            bodyText = await response.text();
        }
    } catch {
        // ignore parse errors
    }

    if (!response.ok) {
        finishPerformance({ ok: false, status: response.status });
        const detail = (json && (json['detail'] as string)) || undefined;
        const msgField = (json && (json['message'] as string)) || undefined;
        const code = (json && (json['code'] as string)) || undefined;
        const message = detail || msgField || bodyText || 'Request failed';
        throw new ApiError(message, response.status, code);
    }

    finishPerformance({ ok: true, status: response.status });
    return isJson ? json : bodyText;
}

// Helper for endpoints that may return empty 204
export async function apiFetchVoid(
    path: string,
    options: ApiFetchOptions = {},
) {
    const res = await apiFetch(path, options);
    return res;
}
