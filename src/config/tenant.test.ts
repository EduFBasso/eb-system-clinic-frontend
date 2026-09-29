import { describe, expect, it } from 'vitest';
import { resolveClinicTenantSlugFromHostname } from './tenant';

describe('resolveClinicTenantSlugFromHostname', () => {
    it('maps the approved public Clinic hosts to internal tenant slugs', () => {
        expect(
            resolveClinicTenantSlugFromHostname(
                'odontologia.clinic.ebsis.com.br',
            ),
        ).toBe('consultorio-odontologia');
        expect(
            resolveClinicTenantSlugFromHostname(
                'podologia.clinic.ebsis.com.br',
            ),
        ).toBe('consultorio-podologia');
    });

    it('does not resolve unknown ebsis Clinic hosts as tenants', () => {
        expect(
            resolveClinicTenantSlugFromHostname('outra.clinic.ebsis.com.br'),
        ).toBeNull();
        expect(resolveClinicTenantSlugFromHostname('clinic.ebsis.com.br')).toBe(
            null,
        );
    });

    it('keeps the existing development hostname convention', () => {
        expect(
            resolveClinicTenantSlugFromHostname(
                'consultorio-podologia.clinic.eb.localhost',
            ),
        ).toBe('consultorio-podologia');
    });
});