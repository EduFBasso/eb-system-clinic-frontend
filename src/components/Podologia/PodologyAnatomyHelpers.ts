// Podology-specific anatomy helpers, scope types and member constants.

import type {
    CatalogServiceItem,
    PodologyContext,
    PodologyScope,
} from '../../utils/TreatmentHelpers';
import { normalizeSearchText } from '../../utils/TreatmentHelpers';

export type { PodologyContext, PodologyScope };

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
