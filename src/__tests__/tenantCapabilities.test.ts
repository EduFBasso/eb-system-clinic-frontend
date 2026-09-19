import { describe, expect, it } from 'vitest';
import { resolveClinicSpecialty } from '../utils/tenantCapabilities';

describe('resolveClinicSpecialty', () => {
    it('resolves exactly one enabled specialty', () => {
        expect(resolveClinicSpecialty({ clinic: true, odonto: true })).toBe(
            'odonto',
        );
        expect(
            resolveClinicSpecialty({
                clinic: true,
                modules: { podologia: true },
            }),
        ).toBe('podologia');
    });

    it('fails closed when no specialty or both specialties are enabled', () => {
        expect(resolveClinicSpecialty({ clinic: true })).toBe('none');
        expect(
            resolveClinicSpecialty({
                clinic: true,
                odonto: true,
                podologia: true,
            }),
        ).toBe('none');
    });
});
