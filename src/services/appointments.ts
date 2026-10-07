import { apiFetch, ApiError } from '../utils/apiFetch';

export async function postDone(apptId: number): Promise<boolean> {
    try {
        await apiFetch(`/api/v1/clinic/agenda/appointments/${apptId}/done/`, {
            method: 'POST',
        });
        return true;
    } catch {
        return false;
    }
}

export async function cancelAppointment(
    apptId: number,
): Promise<{ ok: boolean; status: number; text?: string }> {
    try {
        await apiFetch(`/api/v1/clinic/agenda/appointments/${apptId}/cancel/`, {
            method: 'POST',
            cache: 'no-store',
        });
        return { ok: true, status: 200 };
    } catch (e) {
        const err = e as ApiError | Error;
        return {
            ok: false,
            status: (err as ApiError).status ?? 0,
            text: err.message,
        };
    }
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
        status: 'scheduled' | 'done' | 'canceled';
        title?: string;
        notes?: string;
    }>
> {
    try {
        const data = (await apiFetch(
            `/api/v1/clinic/agenda/appointments/?start=${encodeURIComponent(startRefISO)}&limit=${limitOverfetch}&ordering=start_at&client=${clientId}`,
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
            status: 'scheduled' | 'done' | 'canceled';
            title?: string;
            notes?: string;
        }>;
    } catch {
        return [];
    }
}
