import React from 'react';
import type { Appointment } from './useAppointments';

interface Params {
    futureAppointmentsCount: number; // only futures (exclui o próximo atual)
    isScheduled: boolean;
    dynLimit: number;
    setEditing(appt: Appointment | null): void;
    openQuick(): void;
    baseTitle?: string; // permite variar label padrão (ex: 'Novo agendamento' vs 'Agendar')
}

export interface CreateActionResult {
    title: string;
    disabled: boolean;
    onClick(e: React.MouseEvent | React.KeyboardEvent): void;
    limitReached: boolean;
}

export function useClientCreateAction({
    futureAppointmentsCount,
    isScheduled,
    dynLimit,
    setEditing,
    openQuick,
    baseTitle = 'Novo agendamento',
}: Params): CreateActionResult {
    const totalScheduled = (isScheduled ? 1 : 0) + futureAppointmentsCount;
    const limitReached = totalScheduled >= dynLimit;

    const title = limitReached
        ? `Limite de ${dynLimit} compromissos (atual: ${totalScheduled})`
        : baseTitle;

    const disabled = limitReached;

    const onClick = React.useCallback(
        (e: React.MouseEvent | React.KeyboardEvent) => {
            e.stopPropagation();
            if (limitReached) {
                try {
                    window.dispatchEvent(
                        new CustomEvent('systemMessage', {
                            detail: {
                                text: `Limite de ${dynLimit} compromissos atingido (total: ${totalScheduled})`,
                                type: 'warning',
                            },
                        }),
                    );
                } catch {
                    /* noop */
                }
                return;
            }
            setEditing(null);
            openQuick();
        },
        [limitReached, dynLimit, totalScheduled, setEditing, openQuick],
    );

    return { title, disabled, onClick, limitReached };
}
