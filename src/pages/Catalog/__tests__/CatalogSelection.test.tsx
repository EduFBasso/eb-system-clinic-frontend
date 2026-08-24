import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../../../utils/apiFetch';
import ProductListPage from '../ProductListPage';
import ServiceListPage from '../ServiceListPage';

vi.mock('../../../utils/apiFetch', () => ({
    apiFetch: vi.fn(),
    ApiError: class ApiError extends Error {},
}));

const apiFetchMock = vi.mocked(apiFetch);

function renderPage(page: React.ReactNode) {
    return render(<MemoryRouter>{page}</MemoryRouter>);
}

describe('catalog selection mode', () => {
    beforeEach(() => {
        apiFetchMock.mockReset();
        document.body.style.overflow = '';
    });

    it('keeps product selections while Search filters the scrollable list', async () => {
        apiFetchMock.mockResolvedValueOnce([
            {
                id: 1,
                name: 'Botox',
                type: 'PRODUCT',
                description: 'Aplicação',
                price: 1200,
            },
            {
                id: 2,
                name: 'Resina tipo 1',
                type: 'PRODUCT',
                description: 'Resina branca',
                price: 60,
            },
        ] as unknown as Record<string, unknown>);
        apiFetchMock.mockResolvedValue(null);

        renderPage(<ProductListPage />);

        await screen.findByRole('button', { name: 'Apagar' });
        fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
        fireEvent.click(screen.getByLabelText('Selecionar Botox'));

        const search = screen.getByRole('searchbox', {
            name: 'Buscar produto por nome',
        });
        fireEvent.change(search, { target: { value: 'Resina' } });
        fireEvent.click(screen.getByLabelText('Selecionar Resina tipo 1'));

        expect(document.body.style.overflow).not.toBe('hidden');
        expect(
            screen.getByRole('button', {
                name: 'Excluir selecionados (2)',
            }),
        ).toBeEnabled();

        fireEvent.change(search, { target: { value: '' } });
        expect(screen.getByLabelText('Selecionar Botox')).toBeChecked();
        expect(screen.getByLabelText('Selecionar Resina tipo 1')).toBeChecked();

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Excluir selecionados (2)',
            }),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

        await waitFor(() => {
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/inventory/products/1/'),
                { method: 'DELETE' },
            );
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/inventory/products/2/'),
                { method: 'DELETE' },
            );
        });
    });

    it('deletes a selected service through the services endpoint', async () => {
        apiFetchMock.mockResolvedValueOnce([
            {
                id: 7,
                name: 'Limpeza',
                description: 'Profilaxia',
                base_price: 200,
            },
        ] as unknown as Record<string, unknown>);
        apiFetchMock.mockResolvedValue(null);

        renderPage(<ServiceListPage />);

        await screen.findByRole('button', { name: 'Apagar' });
        fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));
        fireEvent.click(screen.getByLabelText('Selecionar Limpeza'));
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Excluir selecionados (1)',
            }),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

        await waitFor(() =>
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/inventory/services/7/'),
                { method: 'DELETE' },
            ),
        );
    });
});
