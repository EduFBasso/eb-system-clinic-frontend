import { emit } from '../../events/bus';
import { isTokenExpired } from '../jwt';

export type LogoutReason =
    | 'manual'
    | 'session_expired'
    | 'device_session_invalid';

/** Centralised token accessor — always returns a string (empty when absent). */
export function getAccessToken(): string {
    return localStorage.getItem('accessToken') ?? '';
}

export function hasActiveSession() {
    return !isTokenExpired(getAccessToken());
}

export function clearStoredAuth(options?: { clearNewClientId?: boolean }) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('loggedProfessional');
    if (options?.clearNewClientId !== false) {
        localStorage.removeItem('newClientId');
    }
    clearStaleLocalStorageKeys();
}

// Remove do localStorage caches antigos de nomes de clientes (PII).
// Cobre o formato atual `clinic:<scope>:client.name.<id>` e o legado `client.name.<id>`.
function clearStaleLocalStorageKeys() {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && /^(clinic:[^:]*:)?client\.name\.\d+$/.test(key)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch {
        /* noop */
    }
}

export function dispatchLogout(
    reason: LogoutReason,
    options?: {
        clearClients?: boolean;
        clearNewClientId?: boolean;
    },
) {
    clearStoredAuth({ clearNewClientId: options?.clearNewClientId });
    emit('auth:logout', { reason });
    if (options?.clearClients !== false) {
        window.dispatchEvent(new Event('clearClients'));
    }
}
