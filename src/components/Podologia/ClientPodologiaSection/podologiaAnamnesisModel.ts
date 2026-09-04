import type {
    AnamnesePodologiaData,
    ClientData,
} from '../../../types/ClientData';

export const PODOLOGY_ANAMNESIS_FIELDS: Array<{
    key: keyof AnamnesePodologiaData;
    label: string;
}> = [
    { key: 'footwear_used', label: 'Calçado utilizado' },
    { key: 'sock_used', label: 'Meia utilizada' },
    { key: 'plantar_view_left', label: 'Vista plantar esquerda' },
    { key: 'plantar_view_right', label: 'Vista plantar direita' },
    {
        key: 'dermatological_pathologies_left',
        label: 'Patologias dermatológicas esquerda',
    },
    {
        key: 'dermatological_pathologies_right',
        label: 'Patologias dermatológicas direita',
    },
    { key: 'nail_changes_left', label: 'Alterações ungueais esquerda' },
    { key: 'nail_changes_right', label: 'Alterações ungueais direita' },
    { key: 'deformities_left', label: 'Deformidades esquerda' },
    { key: 'deformities_right', label: 'Deformidades direita' },
    { key: 'sensitivity_test', label: 'Teste de sensibilidade' },
    { key: 'other_procedures', label: 'Outros procedimentos' },
];

export function buildDefaultPodologia(
    cliente?: Partial<ClientData>,
): AnamnesePodologiaData {
    const podologia = cliente?.anamnese_podologia ?? {};
    return {
        footwear_used: podologia.footwear_used ?? '',
        sock_used: podologia.sock_used ?? '',
        plantar_view_left: podologia.plantar_view_left ?? '',
        plantar_view_right: podologia.plantar_view_right ?? '',
        dermatological_pathologies_left:
            podologia.dermatological_pathologies_left ?? '',
        dermatological_pathologies_right:
            podologia.dermatological_pathologies_right ?? '',
        nail_changes_left: podologia.nail_changes_left ?? '',
        nail_changes_right: podologia.nail_changes_right ?? '',
        deformities_left: podologia.deformities_left ?? '',
        deformities_right: podologia.deformities_right ?? '',
        sensitivity_test: podologia.sensitivity_test ?? '',
        other_procedures: podologia.other_procedures ?? '',
    };
}
