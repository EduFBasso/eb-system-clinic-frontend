import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import OdontoServiceModal from '../OdontoServiceModal';
import type { CatalogServiceItem } from '../../../utils/TreatmentHelpers';
import { filterServiceCatalog } from '../OdontoAnatomyHelpers';

describe('OdontoServiceModal catalog selection', () => {
    it('shows only services indexed for the active treatment category', () => {
        const catalog: CatalogServiceItem[] = [
            {
                id: 1,
                name: 'Restauração',
                base_price: 250,
                treatment_scopes: ['tooth'],
            },
            {
                id: 2,
                name: 'Limpeza de arcada',
                base_price: 300,
                treatment_scopes: ['arch'],
            },
            {
                id: 3,
                name: 'Avaliação geral',
                base_price: 100,
                treatment_scopes: ['tooth', 'arch', 'other'],
            },
        ];

        expect(
            filterServiceCatalog(catalog, '', 'arch').map(item => item.name),
        ).toEqual(['Avaliação geral', 'Limpeza de arcada']);
        expect(
            filterServiceCatalog(catalog, '', 'tooth').map(item => item.name),
        ).toEqual(['Avaliação geral', 'Restauração']);
        expect(filterServiceCatalog(catalog, 'restauração', 'arch')).toEqual(
            [],
        );
    });

    it('submits only checked rows that do not already exist in the catalog', () => {
        const onSave = vi.fn();

        render(
            <OdontoServiceModal
                open
                saving={false}
                flowType='other'
                serviceRows={[
                    {
                        toothNumber: null,
                        toothSurface: '',
                        scope: 'other',
                        arcadeArch: null,
                        treatment: 'Limpeza',
                        serviceId: 20,
                        value: '350,00',
                        notes: 'Dados alterados apenas para este plano.',
                    },
                    {
                        toothNumber: null,
                        toothSurface: '',
                        scope: 'other',
                        arcadeArch: null,
                        treatment: 'Polimento novo',
                        serviceId: null,
                        value: '90,00',
                        notes: 'Novo tratamento.',
                    },
                ]}
                orderedTeeth={[]}
                serviceCatalog={[
                    {
                        id: 20,
                        name: 'Limpeza',
                        base_price: 300,
                        default_notes: 'Serviço já cadastrado.',
                        treatment_scopes: ['other'],
                    },
                ]}
                onClose={vi.fn()}
                onSave={onSave}
                onFlowTypeChange={vi.fn()}
                onUpdateRow={vi.fn()}
                onToggleToothRow={vi.fn()}
                onAddItem={vi.fn()}
                onDeleteFromCatalog={vi.fn()}
            />,
        );

        expect(screen.getAllByRole('checkbox')).toHaveLength(1);
        expect(screen.getByRole('checkbox')).toBeChecked();

        fireEvent.click(
            screen.getByRole('button', { name: 'Salvar tratamento' }),
        );

        expect(onSave).toHaveBeenCalledWith([1]);
    });

    it('copies the catalog description into the treatment observations', () => {
        const onUpdateRow = vi.fn();

        render(
            <OdontoServiceModal
                open
                saving={false}
                flowType='tooth'
                serviceRows={[
                    {
                        toothNumber: 34,
                        toothSurface: '',
                        scope: 'tooth',
                        arcadeArch: null,
                        treatment: '',
                        serviceId: null,
                        value: '',
                        notes: '',
                    },
                ]}
                orderedTeeth={[]}
                serviceCatalog={[
                    {
                        id: 30,
                        name: 'Dente Quebrado',
                        base_price: 100,
                        description: 'Reparo com material cirurgico',
                        treatment_scopes: ['tooth'],
                    },
                ]}
                onClose={vi.fn()}
                onSave={vi.fn()}
                onFlowTypeChange={vi.fn()}
                onUpdateRow={onUpdateRow}
                onToggleToothRow={vi.fn()}
                onAddItem={vi.fn()}
                onDeleteFromCatalog={vi.fn()}
            />,
        );

        fireEvent.focus(screen.getByLabelText('Tratamento'));
        fireEvent.click(
            screen.getByRole('button', {
                name: /Dente Quebrado.*R\$/,
            }),
        );

        expect(onUpdateRow).toHaveBeenCalledWith(0, {
            treatment: 'Dente Quebrado',
            serviceId: 30,
            value: '100',
            notes: 'Reparo com material cirurgico',
        });
    });
});
