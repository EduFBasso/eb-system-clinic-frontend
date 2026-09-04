import type { ClientData } from '../../../types/ClientData';

export type ToothBrushingFrequency =
    | ''
    | '1 vez'
    | '2 vezes'
    | '3 ou mais vezes';

export interface DentalAnamnesisValues {
    gum_bleeding: boolean;
    floss_usage: boolean;
    bruxism_clenching: boolean;
    tooth_brushing_frequency: ToothBrushingFrequency;
    chief_dental_complaint: string;
}

export const ODONTO_ANAMNESIS_FIELDS: Array<{
    key: keyof DentalAnamnesisValues;
    label: string;
    isBool?: boolean;
}> = [
    { key: 'gum_bleeding', label: 'Gengiva sangra ao escovar', isBool: true },
    { key: 'floss_usage', label: 'Usa fio dental diariamente', isBool: true },
    {
        key: 'bruxism_clenching',
        label: 'Ranger/Apertar dentes (Bruxismo)',
        isBool: true,
    },
    { key: 'tooth_brushing_frequency', label: 'Frequência de escovação' },
    { key: 'chief_dental_complaint', label: 'Queixa principal bucal' },
];

export function buildDefaultDentalAnamnesis(
    cliente?: Partial<ClientData>,
): DentalAnamnesisValues {
    const odontologia = cliente?.anamnese_odontologia ?? {};
    const frequency = odontologia.tooth_brushing_frequency ?? '';
    const toothBrushingFrequency: ToothBrushingFrequency = [
        '',
        '1 vez',
        '2 vezes',
        '3 ou mais vezes',
    ].includes(frequency)
        ? (frequency as ToothBrushingFrequency)
        : '';

    return {
        gum_bleeding: odontologia.gum_bleeding ?? false,
        floss_usage: odontologia.floss_usage ?? false,
        bruxism_clenching: odontologia.bruxism_clenching ?? false,
        tooth_brushing_frequency: toothBrushingFrequency,
        chief_dental_complaint: odontologia.chief_dental_complaint ?? '',
    };
}
