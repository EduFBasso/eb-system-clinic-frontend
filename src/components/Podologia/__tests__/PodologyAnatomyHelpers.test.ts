import { describe, expect, it } from 'vitest';
import type { PodologyServiceRow } from '../PodologyAnatomyHelpers';
import {
    podologyContextFromServiceRow,
    getPodologyRegionLabel,
    filterPodologyServiceCatalog,
} from '../PodologyAnatomyHelpers';
import type { CatalogServiceItem } from '../../../utils/TreatmentHelpers';

function serviceRow(patch: Partial<PodologyServiceRow>): PodologyServiceRow {
    return {
        scope: 'pe_esquerdo',
        locationNumber: 9,
        regionLabel: 'Pé Esquerdo - Dedo 1',
        treatment: 'Desbaste de Calosidade',
        serviceId: 5,
        value: '120,00',
        notes: '',
        ...patch,
    };
}

describe('podologyContextFromServiceRow', () => {
    it('creates matching podology context from row', () => {
        expect(
            podologyContextFromServiceRow(
                serviceRow({ scope: 'pe_esquerdo', locationNumber: 9 }),
            ),
        ).toEqual({
            scope: 'pe_esquerdo',
            location_number: 9,
        });

        expect(
            podologyContextFromServiceRow(
                serviceRow({ scope: 'geral', locationNumber: null }),
            ),
        ).toEqual({
            scope: 'geral',
            location_number: null,
        });
    });
});

describe('getPodologyRegionLabel', () => {
    it('returns Geral / Outros for general scope or null location', () => {
        expect(getPodologyRegionLabel('geral', null)).toBe('Geral / Outros');
        expect(getPodologyRegionLabel('pe_esquerdo', null)).toBe('Geral / Outros');
    });

    it('returns mapped and concatenated labels for valid locations', () => {
        // Dedo 1 has id: 9 in pé esquerdo
        expect(getPodologyRegionLabel('pe_esquerdo', 9)).toBe('Pé Esquerdo - Dedo 1');
        // Antepé has id: 6 in pé direito
        expect(getPodologyRegionLabel('pe_direito', 6)).toBe('Pé Direito - Antepé');
        // Unha 1 has id: 17 in mão direita
        expect(getPodologyRegionLabel('mao_direita', 17)).toBe('Mão Direita - Unha 1');
    });

    it('handles fallback for custom out of range region IDs', () => {
        expect(getPodologyRegionLabel('pe_esquerdo', 99)).toBe('Pé Esquerdo - Região 99');
    });
});

describe('filterPodologyServiceCatalog', () => {
    it('ranks and filters services inside catalog without scope constraint', () => {
        const catalog: CatalogServiceItem[] = [
            { id: 1, name: 'Corte de Unhas', base_price: 60 },
            { id: 2, name: 'Tratamento de Calo', base_price: 100 },
            { id: 3, name: 'Lixamento', base_price: 45 },
        ];

        expect(
            filterPodologyServiceCatalog(catalog, 'unha').map(item => item.name),
        ).toEqual(['Corte de Unhas']);

        expect(
            filterPodologyServiceCatalog(catalog, '').map(item => item.name),
        ).toEqual(['Corte de Unhas', 'Lixamento', 'Tratamento de Calo']);
    });
});
