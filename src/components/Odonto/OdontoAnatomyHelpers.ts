// Odontology-specific anatomy helpers, tooth grid constants and surface options.

import type {
    CatalogServiceItem,
    DentalContext,
} from '../../utils/TreatmentHelpers';
import { normalizeSearchText } from '../../utils/TreatmentHelpers';

export type { DentalContext };

// ─── Types ────────────────────────────────────────────────────────────────────

export type ServiceFlowType = 'tooth' | 'arch' | 'other';

export type ServiceRow = {
    toothNumber: number | null;
    toothSurface: string;
    scope: ServiceFlowType;
    arcadeArch: 'superior' | 'inferior' | 'AMBAS' | null;
    treatment: string;
    /** ID of the linked Service from the core catalog, or null for custom entry. */
    serviceId: number | null;
    value: string;
    notes: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const INTERNATIONAL_NUMBERS = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46,
    45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

/** Static ordered teeth grid (FDI notation) — shared by the workspace and service modal. */
export const ORDERED_TEETH: ToothItem[] = INTERNATIONAL_NUMBERS.map(
    (fdi, index) => ({
        international_number: fdi,
        sequence: index + 1,
    }),
);

/** FDI face codes aligned with backend DentalProcedureContext.ToothSurface. */
export const SURFACE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: '', label: 'Opcional' },
    { value: 'O', label: 'Oclusal' },
    { value: 'V', label: 'Vestibular' },
    { value: 'L', label: 'Lingual / Palatino' },
    { value: 'M', label: 'Mesial' },
    { value: 'D', label: 'Distal' },
    { value: 'I', label: 'Incisal' },
    { value: 'M,O', label: 'Mesio-oclusal' },
    { value: 'D,O', label: 'Disto-oclusal' },
    { value: 'V,O', label: 'Vestibulo-oclusal' },
    { value: 'L,O', label: 'Palatino-oclusal' },
    { value: 'M,D,O', label: 'Mesio-disto-oclusal' },
];

/** Maps to arcade_arch field values. 'AMBAS' creates two items in the service flow. */
export const ARCH_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'superior', label: 'Superior' },
    { value: 'inferior', label: 'Inferior' },
    { value: 'AMBAS', label: 'Superior e Inferior' },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

export function filterServiceCatalog(
    catalog: CatalogServiceItem[],
    searchRaw: string,
    flowType: ServiceFlowType,
): CatalogServiceItem[] {
    const items = catalog.filter(item =>
        item.treatment_scopes.includes(flowType),
    );
    items.sort((a, b) =>
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
