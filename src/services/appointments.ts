import { apiFetch, ApiError } from '../utils/apiFetch';
import ensureDeviceSession from './sessions';

export async function postDone(apptId: number): Promise<boolean> {
    try {
        await apiFetch(`/agenda/appointments/${apptId}/done/`, {
            method: 'POST',
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Cancela um compromisso com reforços de sessão e log opcional.
 * - Tenta com o token atual.
 * - Em caso de 401/403, força ensureDeviceSession e repete uma vez.
 */
export async function cancelAppointment(
    apptId: number,
): Promise<{ ok: boolean; status: number; text?: string }> {
    // Best-effort: garanta que a sessão do dispositivo exista antes de bater no endpoint
    try {
        await ensureDeviceSession();
    } catch {
        /* continue anyway */
    }
    async function attempt(): Promise<{
        ok: boolean;
        status: number;
        text?: string;
    }> {
        try {
            await apiFetch(`/agenda/appointments/${apptId}/cancel/`, {
                method: 'POST',
                cache: 'no-store',
            });
            return { ok: true, status: 200 };
        } catch (e) {
            const err = e as ApiError | Error;
            const status = (err as ApiError).status ?? 0;
            return { ok: false, status, text: err.message };
        }
    }
    let res = await attempt();
    if (res.status === 401 || res.status === 403) {
        try {
            await ensureDeviceSession(true);
        } catch {
            /* ignore */
        }
        res = await attempt();
    }
    return res;
}

export async function fetchFutureAppointments(
    clientId: number,
    startRefISO: string,
    excludeAppointmentId?: number | null,
    limitOverfetch = 20,
): Promise<
    Array<{
        id: number;
        start_at: string;
        end_at: string;
        status: 'scheduled' | 'pending' | 'done' | 'canceled';
        title?: string;
        notes?: string;
    }>
> {
    try {
        const data = (await apiFetch(
            `/agenda/appointments/?start=${encodeURIComponent(startRefISO)}&limit=${limitOverfetch}&ordering=start_at&client=${clientId}`,
        )) as unknown as unknown[];
        const arr = Array.isArray(data) ? data : [];
        return arr
            .filter(
                (a: unknown) =>
                    (a as { status: string }).status === 'scheduled',
            )
            .filter((a: unknown) =>
                excludeAppointmentId
                    ? (a as { id: number }).id !== excludeAppointmentId
                    : true,
            ) as unknown as Array<{
            id: number;
            start_at: string;
            end_at: string;
            status: 'scheduled' | 'pending' | 'done' | 'canceled';
            title?: string;
            notes?: string;
        }>;
    } catch {
        return [];
    }
}
