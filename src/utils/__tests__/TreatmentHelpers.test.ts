import { describe, expect, it } from 'vitest';
import { normalizeInstallmentsCount } from '../TreatmentHelpers';

describe('normalizeInstallmentsCount', () => {
    it('keeps the business minimum of two installments', () => {
        expect(normalizeInstallmentsCount('')).toBe(2);
        expect(normalizeInstallmentsCount('0')).toBe(2);
        expect(normalizeInstallmentsCount('1')).toBe(2);
        expect(normalizeInstallmentsCount('2')).toBe(2);
        expect(normalizeInstallmentsCount('5')).toBe(5);
    });
});
