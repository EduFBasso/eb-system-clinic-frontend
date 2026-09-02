// Podology-specific anatomy helpers, scope types and member constants.

import type {
    PodologyContext,
    PodologyScope,
} from '../../utils/TreatmentHelpers';

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
