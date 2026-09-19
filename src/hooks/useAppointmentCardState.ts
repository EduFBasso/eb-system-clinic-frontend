import React from 'react';
import { deriveStatus } from '../utils/appointments/status';

export interface AppointmentCardState {
    status: 'scheduled' | 'done' | 'canceled';
    canEdit: boolean;
    canCancel: boolean;
    start: Date;
    end: Date;
}

export function useAppointmentCardState(
    appt: {
        start_at: string;
        end_at: string;
        status: 'scheduled' | 'done' | 'canceled';
    },
    now: Date,
): AppointmentCardState {
    const start = React.useMemo(() => new Date(appt.start_at), [appt.start_at]);
    const end = React.useMemo(() => new Date(appt.end_at), [appt.end_at]);
    // Visual status derived from timing + server status
    const status = React.useMemo(() => deriveStatus(appt, now), [appt, now]);
    // Edição permanece restrita a agendados futuros (antes do início)
    const canEdit = status === 'scheduled' && start > now;
    // Cancelamento é permitido antes do término para compromissos ativos por tempo.
    const canCancel = status === 'scheduled' && end > now;
    return { status, canEdit, canCancel, start, end };
}
