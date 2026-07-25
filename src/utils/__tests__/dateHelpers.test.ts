import { describe, expect, it } from 'vitest';
import {
    addDays,
    addMonths,
    isSameDay,
    monthIndex,
    overlaps,
    startOfDay,
    startOfMonth,
    startOfWeekMonday,
} from '../dateHelpers';

describe('dateHelpers', () => {
    it('normaliza datas e calcula offsets de agenda', () => {
        const base = new Date('2026-07-25T15:42:30');

        expect(startOfDay(base).getHours()).toBe(0);
        expect(startOfDay(base).getMinutes()).toBe(0);
        expect(startOfMonth(base).getDate()).toBe(1);
        expect(startOfMonth(base).getHours()).toBe(0);
        expect(addDays(base, 2).getDate()).toBe(27);
        expect(addMonths(base, 1).getMonth()).toBe(7);
        expect(monthIndex(base)).toBe(2026 * 12 + 6);
        expect(isSameDay(base, new Date('2026-07-25T01:00:00'))).toBe(true);
        expect(
            startOfWeekMonday(new Date('2026-07-25T12:00:00')).getDay(),
        ).toBe(1);
    });

    it('detecta intervalos sobrepostos', () => {
        const aStart = new Date('2026-07-25T10:00:00');
        const aEnd = new Date('2026-07-25T11:00:00');
        const bStart = new Date('2026-07-25T10:30:00');
        const bEnd = new Date('2026-07-25T11:30:00');

        expect(overlaps(aStart, aEnd, bStart, bEnd)).toBe(true);
        expect(
            overlaps(
                aStart,
                aEnd,
                new Date('2026-07-25T11:00:00'),
                new Date('2026-07-25T12:00:00'),
            ),
        ).toBe(false);
    });
});
