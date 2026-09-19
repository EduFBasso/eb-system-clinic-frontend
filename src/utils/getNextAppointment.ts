// Isolado de React/hooks para evitar transformação SSR indesejada em testes.
// Definimos um tipo mínimo local para não depender de '../hooks/useAppointments'.
export interface AppointmentLike {
    id: number;
    start_at: string;
    end_at: string;
    status: 'scheduled' | 'done' | 'canceled';
    title?: string;
    visit_type?: string;
    notes?: string | null;
    [key: string]: unknown; // campos extras ignorados pela lógica
}

export interface NextAppointmentOptions {
    /** Consider only appointments with status === 'scheduled'. Default: true */
    onlyScheduled?: boolean;
}

/** Returns the next scheduled appointment after `now` based on chronological order. */
export function getNextAppointment(
    appointments: AppointmentLike[] | undefined | null,
    now: Date = new Date(),
    opts: NextAppointmentOptions = {},
): AppointmentLike | null {
    if (!appointments || appointments.length === 0) return null;
    const { onlyScheduled = true } = opts;
    const nowTime = now.getTime();

    const filtered = appointments.filter(a => {
        if (onlyScheduled && a.status !== 'scheduled') return false;
        const start = new Date(a.start_at).getTime();
        return start > nowTime;
    });
    if (filtered.length === 0) return null;

    // Sort by start time ascending
    filtered.sort(
        (a, b) =>
            new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    );

    return filtered[0] ?? null;
}

/** Utility to format a human helper label for display (e.g. "em 32 min", "agora", "há 5 min"). */
export function relativeLabel(
    appointment: AppointmentLike | null,
    now: Date = new Date(),
): string | null {
    if (!appointment) return null;
    const start = new Date(appointment.start_at).getTime();
    const nowT = now.getTime();
    const diffStartMin = Math.round((start - nowT) / 60000);
    if (diffStartMin > 0) return `em ${diffStartMin} min`;
    return null;
}
