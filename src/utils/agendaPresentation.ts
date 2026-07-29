import { formatTime } from './timeFormat';

interface AppointmentDateRangeArgs {
    startIso?: string | null;
    endIso?: string | null;
    requireEnd?: boolean;
}

export function formatAppointmentDateRange({
    startIso,
    endIso,
    requireEnd = false,
}: AppointmentDateRangeArgs): string {
    if (!startIso) return '—';
    if (requireEnd && !endIso) return '—';

    const start = new Date(startIso);
    if (isNaN(start.getTime())) return '—';

    if (endIso) {
        const end = new Date(endIso);
        if (isNaN(end.getTime())) return '—';
    }

    const weekday = start
        .toLocaleDateString('pt-BR', { weekday: 'short' })
        .replace('.', '')
        .replace(/\b(\w)/, c => c.toUpperCase());
    const day = String(start.getDate()).padStart(2, '0');
    const month = String(start.getMonth() + 1).padStart(2, '0');

    const startTime = formatTime(startIso);
    const endTime = endIso ? formatTime(endIso) : null;

    return `${weekday} ${day}/${month}, ${startTime}${endTime ? ` - ${endTime}` : ''}`;
}
