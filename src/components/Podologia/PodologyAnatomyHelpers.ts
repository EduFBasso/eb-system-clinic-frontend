// Podology-specific anatomy helpers, scope types and member constants.

import type {
    CatalogServiceItem,
    PodologyContext,
    PodologyScope,
} from '../../utils/TreatmentHelpers';
import { normalizeSearchText } from '../../utils/TreatmentHelpers';

export type { PodologyContext, PodologyScope };

export type RegionShape =
    | { kind: 'circle'; cx: number; cy: number; r: number }
    | { kind: 'rect'; x: number; y: number; width: number; height: number };

export interface FootRegion {
    id: number;
    scope: PodologyScope;
    label: string;
    shape: RegionShape;
}

export const REGIONS: FootRegion[] = [
    // --- PÉ DIREITO (Dedos 1-5, Plantar 6-8) ---
    {
        id: 1,
        scope: 'pe_direito',
        label: 'Dedo 1',
        shape: { kind: 'circle', cx: 352, cy: 82, r: 10 },
    },
    {
        id: 2,
        scope: 'pe_direito',
        label: 'Dedo 2',
        shape: { kind: 'circle', cx: 368, cy: 74, r: 7.2 },
    },
    {
        id: 3,
        scope: 'pe_direito',
        label: 'Dedo 3',
        shape: { kind: 'circle', cx: 383, cy: 71, r: 6.6 },
    },
    {
        id: 4,
        scope: 'pe_direito',
        label: 'Dedo 4',
        shape: { kind: 'circle', cx: 397, cy: 75, r: 5.8 },
    },
    {
        id: 5,
        scope: 'pe_direito',
        label: 'Dedo 5',
        shape: { kind: 'circle', cx: 410, cy: 84, r: 5.0 },
    },
    {
        id: 6,
        scope: 'pe_direito',
        label: 'Antepé',
        shape: { kind: 'rect', x: 350, y: 122, width: 50, height: 45 },
    },
    {
        id: 7,
        scope: 'pe_direito',
        label: 'Mediopé',
        shape: { kind: 'rect', x: 355, y: 175, width: 40, height: 34 },
    },
    {
        id: 8,
        scope: 'pe_direito',
        label: 'Retropé',
        shape: { kind: 'rect', x: 360, y: 215, width: 30, height: 26 },
    },

    // --- PÉ ESQUERDO (Dedos 9-13, Plantar 14-16) ---
    {
        id: 9,
        scope: 'pe_esquerdo',
        label: 'Dedo 1',
        shape: { kind: 'circle', cx: 148, cy: 82, r: 10 },
    },
    {
        id: 10,
        scope: 'pe_esquerdo',
        label: 'Dedo 2',
        shape: { kind: 'circle', cx: 132, cy: 74, r: 7.2 },
    },
    {
        id: 11,
        scope: 'pe_esquerdo',
        label: 'Dedo 3',
        shape: { kind: 'circle', cx: 117, cy: 71, r: 6.6 },
    },
    {
        id: 12,
        scope: 'pe_esquerdo',
        label: 'Dedo 4',
        shape: { kind: 'circle', cx: 103, cy: 75, r: 5.8 },
    },
    {
        id: 13,
        scope: 'pe_esquerdo',
        label: 'Dedo 5',
        shape: { kind: 'circle', cx: 90, cy: 84, r: 5.0 },
    },
    {
        id: 14,
        scope: 'pe_esquerdo',
        label: 'Antepé',
        shape: { kind: 'rect', x: 100, y: 122, width: 50, height: 45 },
    },
    {
        id: 15,
        scope: 'pe_esquerdo',
        label: 'Mediopé',
        shape: { kind: 'rect', x: 105, y: 175, width: 40, height: 34 },
    },
    {
        id: 16,
        scope: 'pe_esquerdo',
        label: 'Retropé',
        shape: { kind: 'rect', x: 110, y: 215, width: 30, height: 26 },
    },

    // --- MÃO DIREITA (Unhas 17-21) ---
    {
        id: 17,
        scope: 'mao_direita',
        label: 'Unha 1',
        shape: { kind: 'rect', x: 341, y: 421, width: 8, height: 11 },
    },
    {
        id: 18,
        scope: 'mao_direita',
        label: 'Unha 2',
        shape: { kind: 'rect', x: 358, y: 348, width: 7, height: 10 },
    },
    {
        id: 19,
        scope: 'mao_direita',
        label: 'Unha 3',
        shape: { kind: 'rect', x: 376, y: 328, width: 7, height: 10 },
    },
    {
        id: 20,
        scope: 'mao_direita',
        label: 'Unha 4',
        shape: { kind: 'rect', x: 394, y: 348, width: 7, height: 10 },
    },
    {
        id: 21,
        scope: 'mao_direita',
        label: 'Unha 5',
        shape: { kind: 'rect', x: 410, y: 398, width: 6, height: 9 },
    },

    // --- MÃO ESQUERDA (Unhas 22-26) ---
    {
        id: 22,
        scope: 'mao_esquerda',
        label: 'Unha 1',
        shape: { kind: 'rect', x: 151, y: 421, width: 8, height: 11 },
    },
    {
        id: 23,
        scope: 'mao_esquerda',
        label: 'Unha 2',
        shape: { kind: 'rect', x: 135, y: 348, width: 7, height: 10 },
    },
    {
        id: 24,
        scope: 'mao_esquerda',
        label: 'Unha 3',
        shape: { kind: 'rect', x: 117, y: 328, width: 7, height: 10 },
    },
    {
        id: 25,
        scope: 'mao_esquerda',
        label: 'Unha 4',
        shape: { kind: 'rect', x: 99, y: 348, width: 7, height: 10 },
    },
    {
        id: 26,
        scope: 'mao_esquerda',
        label: 'Unha 5',
        shape: { kind: 'rect', x: 84, y: 398, width: 6, height: 9 },
    },
];

export const PLANTAR_LABELS: Record<number, string> = {
    6: 'Antepé',
    7: 'Mediopé',
    8: 'Retropé',
    14: 'Antepé',
    15: 'Mediopé',
    16: 'Retropé',
};

export interface PodologyRegionMeta {
    id: number;
    scope: PodologyScope;
    label: string;
}

export const PODOLOGY_REGIONS: PodologyRegionMeta[] = REGIONS.map(
    ({ id, scope, label }) => ({
        id,
        scope,
        label: PLANTAR_LABELS[id] ?? label,
    }),
);

export function getPodologyRegionLabel(
    scope: PodologyScope,
    locationNumber: number | null,
): string {
    if (scope === 'geral' || locationNumber == null) {
        return 'Geral / Outros';
    }
    const meta = PODOLOGY_REGIONS.find(r => r.id === locationNumber);
    const scopeOption = PODOLOGY_SCOPE_OPTIONS.find(opt => opt.value === scope);
    const scopeLabel = scopeOption?.label ?? '';
    const regionName = meta?.label ?? `Região ${locationNumber}`;
    return scopeLabel ? `${scopeLabel} - ${regionName}` : regionName;
}

export const PODOLOGY_SCOPE_OPTIONS: Array<{
    value: PodologyScope;
    label: string;
}> = [
    { value: 'pe_esquerdo', label: 'Pé Esquerdo' },
    { value: 'pe_direito', label: 'Pé Direito' },
    { value: 'mao_esquerda', label: 'Mão Esquerda' },
    { value: 'mao_direita', label: 'Mão Direita' },
    { value: 'geral', label: 'Geral / Outros' },
];

/** One row of the "novo procedimento" flow: a member region plus treatment data. */
export type PodologyServiceRow = {
    scope: PodologyScope;
    /** Matches the clicked region id in PodologyMemberGrid (1-26), or null for scope 'geral'. */
    locationNumber: number | null;
    regionLabel: string;
    treatment: string;
    serviceId: number | null;
    value: string;
    notes: string;
};

export function podologyContextFromServiceRow(
    row: PodologyServiceRow,
): PodologyContext {
    return {
        scope: row.scope,
        location_number: row.locationNumber,
    };
}

/** Catalog search for the "Procedimento" autocomplete — Podologia não usa
 * treatment_scopes (categoria exclusiva de Odonto), então filtra só por nome. */
export function filterPodologyServiceCatalog(
    catalog: CatalogServiceItem[],
    searchRaw: string,
): CatalogServiceItem[] {
    const items = [...catalog].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
    );

    const search = normalizeSearchText(searchRaw);
    if (!search) return items.slice(0, 24);

    return items
        .filter(item => normalizeSearchText(item.name).includes(search))
        .sort((a, b) => {
            const aName = normalizeSearchText(a.name);
            const bName = normalizeSearchText(b.name);
            const aStarts = aName.startsWith(search) ? 0 : 1;
            const bStarts = bName.startsWith(search) ? 0 : 1;
            if (aStarts !== bStarts) return aStarts - bStarts;
            return a.name.localeCompare(b.name, 'pt-BR', {
                sensitivity: 'base',
            });
        })
        .slice(0, 24);
}
