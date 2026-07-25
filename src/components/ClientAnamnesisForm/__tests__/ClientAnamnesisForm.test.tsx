import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import ClientAnamnesisForm from '../ClientAnamnesisForm';
import type { AnamnesisField } from '../../../types/AnamnesisTypes';

const fields: AnamnesisField[] = [
    {
        id: 1,
        code: 'medical_history',
        sector: 'Anamnese',
        sector_order: 1,
        label: 'Comorbidades',
        field_type: 'radio',
        options: ['Não', 'Sim', 'Outro'],
        placeholder: 'Informe...',
        depends_on: null,
        show_when_value: '',
        order: 1,
        is_active: true,
    },
    {
        id: 2,
        code: 'medical_history_detail',
        sector: 'Anamnese',
        sector_order: 1,
        label: 'Detalhe',
        field_type: 'text',
        options: null,
        placeholder: 'Explique o motivo',
        depends_on: 1,
        show_when_value: 'Sim',
        order: 2,
        is_active: true,
    },
    {
        id: 3,
        code: 'clinical_notes',
        sector: 'Observações',
        sector_order: 2,
        label: 'Observações',
        field_type: 'textarea',
        options: null,
        placeholder: 'Descreva',
        depends_on: null,
        show_when_value: '',
        order: 1,
        is_active: true,
    },
];

function Harness({
    initialValues = {},
}: {
    initialValues?: Record<number, string>;
}) {
    const [values, setValues] = useState<Record<number, string>>(initialValues);

    return (
        <ThemeProvider>
            <ClientAnamnesisForm
                fields={fields}
                values={values}
                onChange={(fieldId, value) =>
                    setValues(prev => ({ ...prev, [fieldId]: value }))
                }
            />
            <output data-testid='values'>{JSON.stringify(values)}</output>
        </ThemeProvider>
    );
}

describe('ClientAnamnesisForm', () => {
    it('mostra o campo dependente quando a resposta do pai atende a regra', () => {
        render(<Harness />);

        expect(
            screen.queryByPlaceholderText('Explique o motivo'),
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('radio', { name: 'Sim' }));

        const detailInput = screen.getByPlaceholderText('Explique o motivo');
        expect(detailInput).toBeEnabled();

        fireEvent.change(detailInput, {
            target: { value: 'Losartana' },
        });

        expect(screen.getByTestId('values')).toHaveTextContent(
            '"2":"Losartana"',
        );
    });

    it('serializa Outro com detalhe usando o contrato padronizado', () => {
        render(<Harness initialValues={{ 1: 'Outro' }} />);

        const otherInput = screen.getByPlaceholderText('Informe...');
        expect(otherInput).toBeEnabled();

        fireEvent.change(otherInput, {
            target: { value: 'Cadeira ortopédica' },
        });

        expect(screen.getByTestId('values')).toHaveTextContent(
            '"1":"Outro: Cadeira ortopédica"',
        );
    });
});
