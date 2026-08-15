export type StatusKind = 'scheduled' | 'done' | 'canceled' | 'past';

/**
 * Derive a visual status for an appointment-like object based on server-aligned time.
 * - canceled → 'canceled'
 * - done → 'done'
 * - pending → 'past' (visual pending)
 * - end < now and status === 'scheduled' → 'past' (pending)
 * - else → 'scheduled'
 */
export function deriveStatus(
    appt: {
        start_at: string;
        end_at: string;
        status: 'scheduled' | 'pending' | 'done' | 'canceled';
    },
    now: Date,
): StatusKind {
    const end = new Date(appt.end_at);
    if (appt.status === 'canceled') return 'canceled';
    if (appt.status === 'done') return 'done';
    if (appt.status === 'pending') return 'past';
    if (end < now && appt.status === 'scheduled') return 'past';
    return 'scheduled';
}

export function statusStripeColor(status: StatusKind): string {
    return status === 'canceled'
        ? 'var(--color-canceled)'
        : status === 'past'
          ? 'var(--color-pending)'
          : status === 'done'
            ? 'var(--color-done)'
            : 'var(--color-success)';
}

export function statusBackgroundColor(status: StatusKind): string {
    return status === 'canceled'
        ? 'var(--color-canceled-bg)'
        : status === 'past'
          ? 'var(--color-pending-bg)'
          : status === 'done'
            ? 'var(--color-done-bg)'
            : 'var(--color-success-bg)';
}
import type { Appointment } from '../../hooks/useAppointments';

export interface EnrichedAppointment extends Appointment {
    _start: Date;
    _end: Date;
    _isPast: boolean;
    _derivedStatus: 'scheduled' | 'done' | 'canceled' | 'past';
}

export function enrichAppointment(
    appt: Appointment,
    now: Date = new Date(),
): EnrichedAppointment {
    const _start = new Date(appt.start_at);
    const _end = new Date(appt.end_at);
    const _isPast = _end < now;
    let _derivedStatus: EnrichedAppointment['_derivedStatus'] =
        appt.status === 'pending' ? 'past' : appt.status;
    if (appt.status === 'scheduled' && _isPast) _derivedStatus = 'past';
    return { ...appt, _start, _end, _isPast, _derivedStatus };
}

export function enrichList(
    list: Appointment[],
    now: Date = new Date(),
): EnrichedAppointment[] {
    return list.map(a => enrichAppointment(a, now));
}

export function groupByDay(
    list: EnrichedAppointment[],
): Record<string, EnrichedAppointment[]> {
    return list.reduce(
        (acc, a) => {
            const d = a._start.toISOString().slice(0, 10);
            (acc[d] = acc[d] || []).push(a);
            return acc;
        },
        {} as Record<string, EnrichedAppointment[]>,
    );
}
