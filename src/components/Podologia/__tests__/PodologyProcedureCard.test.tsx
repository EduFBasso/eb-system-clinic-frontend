import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TreatmentItem } from '../../../utils/TreatmentHelpers';
import PodologyProcedureCard from '../PodologyProcedureCard';

function treatmentItem(
    id: number,
    podologyContext: TreatmentItem['podology_context'],
): TreatmentItem {
    return {
        id,
        plan: 1,
        kind: 'service',
        service: 10,
        service_name: 'Desbaste',
        product: null,
        custom_name: '',
        status: 'pending',
        patient_price: 150,
        started_at: '2026-08-24',
        completed_at: null,
        notes: 'Unhas tratadas.',
        is_active: true,
        external_item_id: null,
        parent_item: null,
        podology_context: podologyContext,
    };
}

describe('PodologyProcedureCard treatment category', () => {
    it('renders duplicate service names under their own categories with concatenated labels', () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();

        render(
            <>
                <PodologyProcedureCard
                    item={treatmentItem(1, {
                        scope: 'pe_esquerdo',
                        location_number: 9,
                    })}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
                <PodologyProcedureCard
                    item={treatmentItem(2, null)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </>,
        );

        expect(screen.getAllByText('Desbaste')).toHaveLength(2);
        expect(screen.getByText('Pé Esquerdo - Dedo 1')).toBeVisible();
    });
});
