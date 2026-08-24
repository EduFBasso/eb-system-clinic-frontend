import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import OdontoProductModal from '../OdontoProductModal';

describe('OdontoProductModal catalog selection', () => {
    it('submits only checked rows that do not already exist in the catalog', () => {
        const onSave = vi.fn();

        render(
            <OdontoProductModal
                open
                saving={false}
                productRows={[
                    {
                        name: 'Botox',
                        value: '1.350,00',
                        notes: 'Dados alterados apenas para este plano.',
                    },
                    {
                        name: 'Analgésico novo',
                        value: '60,00',
                        notes: 'Novo produto.',
                    },
                ]}
                productCatalog={[
                    {
                        id: 10,
                        name: 'Botox',
                        price: 1200,
                        description: 'Produto já cadastrado.',
                    },
                ]}
                onClose={vi.fn()}
                onSave={onSave}
                onRowsChange={vi.fn()}
            />,
        );

        expect(screen.getAllByRole('checkbox')).toHaveLength(1);
        expect(screen.getByRole('checkbox')).toBeChecked();

        fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(onSave).toHaveBeenCalledWith([1]);
    });
});
