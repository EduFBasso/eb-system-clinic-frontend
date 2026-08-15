import React from 'react';
import {
    cancelAppointment as cancelAppointmentRequest,
    postDone,
} from '../services/appointments';

export function useResolveAppointment() {
    const [busy, setBusy] = React.useState(false);

    const markAsDone = React.useCallback(
        async (appointmentId: number) => {
            if (busy) return false;
            setBusy(true);
            try {
                return await postDone(appointmentId);
            } finally {
                setBusy(false);
            }
        },
        [busy],
    );

    const cancelAppointment = React.useCallback(
        async (appointmentId: number) => {
            if (busy) return false;
            setBusy(true);
            try {
                const result = await cancelAppointmentRequest(appointmentId);
                return result.ok;
            } finally {
                setBusy(false);
            }
        },
        [busy],
    );

    return { busy, markAsDone, cancelAppointment } as const;
}
