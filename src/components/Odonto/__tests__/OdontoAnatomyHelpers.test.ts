import { describe, expect, it } from 'vitest';
import type { ServiceRow } from '../OdontoAnatomyHelpers';
import { dentalContextFromServiceRow } from '../OdontoAnatomyHelpers';

function serviceRow(patch: Partial<ServiceRow>): ServiceRow {
    return {
        toothNumber: null,
        toothSurface: '',
        scope: 'other',
        arcadeArch: null,
        treatment: 'Botox',
        serviceId: 10,
        value: '500,00',
        notes: '',
        ...patch,
    };
}

describe('dentalContextFromServiceRow', () => {
    it('keeps Outros separate from both arches', () => {
        expect(dentalContextFromServiceRow(serviceRow({}))).toBeNull();

        expect(
            dentalContextFromServiceRow(
                serviceRow({ scope: 'arch', arcadeArch: 'AMBAS' }),
            ),
        ).toEqual({
            scope: 'full',
            tooth_number: null,
            tooth_surface: '',
            arcade_arch: null,
        });
    });

    it('preserves tooth and single-arch contexts per row', () => {
        expect(
            dentalContextFromServiceRow(
                serviceRow({
                    scope: 'tooth',
                    toothNumber: 21,
                    toothSurface: 'V',
                }),
            ),
        ).toEqual({
            scope: 'tooth',
            tooth_number: 21,
            tooth_surface: 'V',
            arcade_arch: null,
        });

        expect(
            dentalContextFromServiceRow(
                serviceRow({ scope: 'arch', arcadeArch: 'superior' }),
            ),
        ).toEqual({
            scope: 'arch',
            tooth_number: null,
            tooth_surface: '',
            arcade_arch: 'superior',
        });
    });
});
