import React from 'react';
import { emit } from '../events/bus';
import type { Appointment } from './useAppointments';
import type { AppointmentReturnContext } from '../types/agendaFlow';

export function useAppointmentDetailsModal<T extends Appointment>() {
    const openDetails = React.useCallback(
        (appt: T, returnContext?: AppointmentReturnContext) => {
            emit('openAppointmentDetails', {
                appointment: appt,
                returnContext,
            });
        },
        [],
    );

    const detailsModal = React.useMemo(() => null, []);

    return {
        openDetails,
        detailsModal,
    };
}
