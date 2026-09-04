import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import PodologyServiceModal from '../PodologyServiceModal';
import type { CatalogServiceItem } from '../../../utils/TreatmentHelpers';
import { filterPodologyServiceCatalog } from '../PodologyAnatomyHelpers';

describe('PodologyServiceModal catalog selection', () => {
    it('shows only filtered services based on search text', () => {
        const catalog: CatalogServiceItem[] = [
            {
                id: 1,
                name: 'Corte de Unhas',
                base_price: 60,
            },
            {
                id: 2,
                name: 'Desbaste',
                base_price: 150,
            },
        ];

        expect(
            filterPodologyServiceCatalog(catalog, 'Desbaste').map(item => item.name),
        ).toEqual(['Desbaste']);
        expect(
            filterPodologyServiceCatalog(catalog, 'Inexistente'),
        ).toEqual([]);
    });

    it('submits only checked rows that do not already exist in the catalog', () => {
        const onSave = vi.fn();

        render(
            <PodologyServiceModal
                open
                saving={false}
                serviceRows={[
                    {
                        scope: 'geral',
                        locationNumber: null,
                        regionLabel: 'Geral / Outros',
                        treatment: 'Tratamento de Fissuras',
                        serviceId: 21,
                        value: '180,00',
                        notes: 'Dados personalizados no plano.',
                    },
                    {
                        scope: 'pe_esquerdo',
                        locationNumber: 9,
                        regionLabel: 'Pé Esquerdo - Dedo 1',
                        treatment: 'Invasivo Novo',
                        serviceId: null,
                        value: '95,00',
                        notes: 'Extra.',
                    },
                ]}
                serviceCatalog={[
                    {
                        id: 21,
                        name: 'Tratamento de Fissuras',
                        base_price: 150,
                        default_notes: 'Serviço cadastrado.',
                    },
                ]}
                onClose={vi.fn()}
                onSave={onSave}
                onToggleRegion={vi.fn()}
                onUpdateRow={vi.fn()}
                onAddGeneralRow={vi.fn()}
                onRemoveRow={vi.fn()}
                onDeleteFromCatalog={vi.fn()}
            />,
        );

        expect(screen.getAllByRole('checkbox')).toHaveLength(1);
        expect(screen.getByRole('checkbox')).toBeChecked();

        fireEvent.click(
            screen.getByRole('button', { name: 'Salvar' }),
        );

        expect(onSave).toHaveBeenCalledWith([1]);
    });
});
