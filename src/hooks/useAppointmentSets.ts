import { useState, useEffect } from 'react';
import { API_BASE } from '../config/api';
import { apiFetch } from '../utils/apiFetch';
import { getAccessToken } from '../utils/auth/session';

export interface ScheduledAppointmentLike {
    id: number;
    status: 'scheduled';
    start_at?: string;
    end_at?: string;
    client?: number | { id?: number } | null;
    title?: string;
}

export function unwrapAppointmentsList(
    payload: unknown,
): ScheduledAppointmentLike[] {
    if (Array.isArray(payload)) {
        return payload as ScheduledAppointmentLike[];
    }
    if (
        payload &&
        typeof payload === 'object' &&
        Array.isArray((payload as { results?: unknown[] }).results)
    ) {
        return (payload as { results: ScheduledAppointmentLike[] }).results;
    }
    return [];
}

export function resolveAppointmentClientId(
    appt: ScheduledAppointmentLike,
): number | null {
    if (typeof appt.client === 'number') return appt.client;
    if (appt.client && typeof appt.client === 'object') {
        const id = appt.client.id;
        return typeof id === 'number' ? id : null;
    }
    return null;
}

export interface AppointmentSets {
    tomorrowIds: Set<number>;
    tomorrowAppts: Map<number, ScheduledAppointmentLike>;
}

const EMPTY: AppointmentSets = {
    tomorrowIds: new Set(),
    tomorrowAppts: new Map(),
};

/**
 * Busca os IDs de clientes com agendamentos de amanhã.
 * Re-executa quando `clientsLength` muda (novo cliente cadastrado, cliente removido)
 * ou ao receber os eventos globais `updateClients` / `appointments:changed`.
 */
export function useAppointmentSets(clientsLength: number): AppointmentSets {
    const [sets, setSets] = useState<AppointmentSets>(() => ({
        tomorrowIds: new Set(),
        tomorrowAppts: new Map(),
    }));

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const token = getAccessToken();
            if (!token || clientsLength === 0) {
                if (!cancelled) setSets(EMPTY);
                return;
            }

            const scheduledUrl = `${API_BASE}/agenda/appointments/?status=scheduled&ordering=-end_at&limit=300&ts=${Date.now()}`;

            try {
                const scheduledDataRaw = await apiFetch(scheduledUrl, {
                    cache: 'no-store',
                    timeoutMs: 12000,
                });
                const scheduledData = unwrapAppointmentsList(scheduledDataRaw);

                const tomorrowIds = new Set<number>();
                const tomorrowAppts = new Map<
                    number,
                    ScheduledAppointmentLike
                >();

                // Limites do dia de amanhã em hora local
                const tmw = new Date();
                tmw.setDate(tmw.getDate() + 1);
                const tmwStart = new Date(
                    tmw.getFullYear(),
                    tmw.getMonth(),
                    tmw.getDate(),
                    0,
                    0,
                    0,
                    0,
                ).getTime();
                const tmwEnd = new Date(
                    tmw.getFullYear(),
                    tmw.getMonth(),
                    tmw.getDate(),
                    23,
                    59,
                    59,
                    999,
                ).getTime();

                // Ordena por start_at para garantir que o primeiro de amanhã seja o mais cedo
                const sortedScheduled = [...scheduledData].sort((a, b) => {
                    const ta = a.start_at ? new Date(a.start_at).getTime() : 0;
                    const tb = b.start_at ? new Date(b.start_at).getTime() : 0;
                    return ta - tb;
                });

                sortedScheduled.forEach(appt => {
                    const clientId = resolveAppointmentClientId(appt);
                    if (clientId == null) return;
                    const startMs = appt.start_at
                        ? new Date(appt.start_at).getTime()
                        : NaN;
                    if (
                        Number.isFinite(startMs) &&
                        startMs >= tmwStart &&
                        startMs <= tmwEnd
                    ) {
                        tomorrowIds.add(clientId);
                        if (!tomorrowAppts.has(clientId)) {
                            tomorrowAppts.set(clientId, appt);
                        }
                    }
                });

                if (!cancelled) setSets({ tomorrowIds, tomorrowAppts });
            } catch {
                if (!cancelled) setSets(EMPTY);
            }
        }

        void load();

        const refresh = () => void load();
        window.addEventListener('updateClients', refresh);
        window.addEventListener('appointments:changed', refresh);

        return () => {
            cancelled = true;
            window.removeEventListener('updateClients', refresh);
            window.removeEventListener('appointments:changed', refresh);
        };
    }, [clientsLength]);

    return sets;
}
