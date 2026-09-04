import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import PodologyProductModal from '../PodologyProductModal';

describe('PodologyProductModal catalog selection', () => {
    it('submits only checked rows that do not already exist in the catalog', () => {
        const onSave = vi.fn();

        render(
            <PodologyProductModal
                open
                saving={false}
                productRows={[
                    {
                        name: 'Creme Regenerador',
                        value: '85,00',
                        notes: 'Uso específico para este plano.',
                    },
                    {
                        name: 'Lixa nova',
                        value: '12,00',
                        notes: 'Novo produto descartável.',
                    },
                ]}
                productCatalog={[
                    {
                        id: 11,
                        name: 'Creme Regenerador',
                        price: 80,
                        description: 'Produto já no catálogo.',
                    },
                ]}
                onClose={vi.fn()}
                onSave={onSave}
                onRowsChange={vi.fn()}
            />,
        );

        // Botox/Creme Regenerador already exists, so only 1 row (Lixa nova) should have a catalog checkbox
        expect(screen.getAllByRole('checkbox')).toHaveLength(1);
        expect(screen.getByRole('checkbox')).toBeChecked();

        fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

        expect(onSave).toHaveBeenCalledWith([1]);
    });
});
