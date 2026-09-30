import { describe, expect, it } from 'vitest';
import { resolveClinicTenantSlugFromHostname } from './tenant';

describe('resolveClinicTenantSlugFromHostname', () => {
    it('maps the approved public Clinic hosts to internal tenant slugs', () => {
        expect(
            resolveClinicTenantSlugFromHostname(
                'odontologia.clinica.ebsis.com.br',
            ),
        ).toBe('consultorio-odontologia');
        expect(
            resolveClinicTenantSlugFromHostname(
                'podologia.clinica.ebsis.com.br',
            ),
        ).toBe('consultorio-podologia');
    });

    it('does not resolve unknown ebsis Clinic hosts as tenants', () => {
        expect(
            resolveClinicTenantSlugFromHostname('outra.clinica.ebsis.com.br'),
        ).toBeNull();
        expect(
            resolveClinicTenantSlugFromHostname('clinica.ebsis.com.br'),
        ).toBeNull();
    });

    it('keeps the existing development hostname convention', () => {
        expect(
            resolveClinicTenantSlugFromHostname(
                'consultorio-podologia.clinic.eb.localhost',
            ),
        ).toBe('consultorio-podologia');
    });
});
