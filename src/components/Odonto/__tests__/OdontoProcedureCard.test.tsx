import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TreatmentItem } from '../../../utils/TreatmentHelpers';
import OdontoProcedureCard from '../OdontoProcedureCard';

function treatmentItem(
    id: number,
    dentalContext: TreatmentItem['dental_context'],
): TreatmentItem {
    return {
        id,
        plan: 1,
        kind: 'service',
        service: 10,
        service_name: 'Botox',
        product: null,
        custom_name: '',
        status: 'pending',
        patient_price: 500,
        started_at: '2026-08-24',
        completed_at: null,
        notes: 'Sessão extra de aplicação.',
        is_active: true,
        external_item_id: null,
        parent_item: null,
        dental_context: dentalContext,
    };
}

describe('OdontoProcedureCard treatment category', () => {
    it('renders duplicate service names under their own categories', () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();

        render(
            <>
                <OdontoProcedureCard
                    item={treatmentItem(1, {
                        scope: 'full',
                        tooth_number: null,
                        tooth_surface: '',
                        arcade_arch: null,
                    })}
                    childItems={[]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
                <OdontoProcedureCard
                    item={treatmentItem(2, null)}
                    childItems={[]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </>,
        );

        expect(screen.getAllByText('Botox')).toHaveLength(2);
        expect(screen.getByText('Arcada Superior e Inferior')).toBeVisible();
        expect(screen.getByText('Outros')).toBeVisible();
    });
});
