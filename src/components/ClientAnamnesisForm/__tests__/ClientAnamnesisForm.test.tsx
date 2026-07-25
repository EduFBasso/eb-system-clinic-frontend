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
        selection_mode: 'multiple',
        options: [
            'Diabetes',
            'Hipertensão',
            'Cardiopatia',
            'Alergias',
            'Outros',
        ],
        placeholder: 'Descreva...',
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
        code: 'history_single_choice',
        sector: 'Observações',
        sector_order: 2,
        label: 'Toma medicação?',
        field_type: 'radio',
        selection_mode: 'single',
        options: ['Sim', 'Não', 'Outro'],
        placeholder: 'Informe a medicação',
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
    it('permite múltiplas opções com detalhe em Outros', () => {
        render(<Harness />);

        fireEvent.click(screen.getByRole('checkbox', { name: 'Diabetes' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Hipertensão' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Outros' }));

        const otherInput = screen.getByPlaceholderText('Descreva...');
        expect(otherInput).toBeEnabled();

        fireEvent.change(otherInput, {
            target: { value: 'Hérnia de hiato' },
        });

        expect(screen.getByTestId('values')).toHaveTextContent(
            '"1":"Diabetes, Hipertensão, Outros: Hérnia de hiato"',
        );
    });

    it('mantém o fluxo Sim/Não com detalhe para campos de seleção única', () => {
        render(<Harness initialValues={{ 3: 'Outro' }} />);

        expect(screen.getByRole('radio', { name: 'Outro' })).toBeChecked();
    });

    it('serializa Outro com detalhe usando o contrato padronizado', () => {
        render(<Harness initialValues={{ 3: 'Outro' }} />);

        const otherInput = screen.getByPlaceholderText('Informe a medicação');
        expect(otherInput).toBeEnabled();

        fireEvent.change(otherInput, {
            target: { value: 'Cadeira ortopédica' },
        });

        expect(screen.getByTestId('values')).toHaveTextContent(
            '"3":"Outro: Cadeira ortopédica"',
        );
    });
});
