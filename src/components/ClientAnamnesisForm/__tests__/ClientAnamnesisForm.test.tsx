import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import ClientAnamnesisForm from '../ClientAnamnesisForm';
import type { AnamneseBaseData } from '../../../types/ClientData';

const initialBase: AnamneseBaseData = {
    takes_medication: '',
    had_surgery: '',
    is_pregnant: null,
    pain_sensitivity: '',
    clinical_history: '',
    sport_activity: '',
};

function Harness({
    initialValues = initialBase,
}: {
    initialValues?: AnamneseBaseData;
}) {
    const [values, setValues] = useState<AnamneseBaseData>(initialValues);

    return (
        <ThemeProvider>
            <ClientAnamnesisForm
                anamneseBase={values}
                onBaseChange={(key, value) =>
                    setValues(prev => ({ ...prev, [key]: value }))
                }
            />
            <output data-testid='values'>{JSON.stringify(values)}</output>
        </ThemeProvider>
    );
}

describe('ClientAnamnesisForm', () => {
    it('exibe e limpa o detalhe quando medicação fica em Sim/Não', () => {
        render(<Harness />);

        fireEvent.click(screen.getByRole('radio', { name: 'Sim' }));

        const otherInput = screen.getByPlaceholderText(
            'Descreva a medicação...',
        );
        expect(otherInput).toBeEnabled();

        fireEvent.change(otherInput, {
            target: { value: 'Tomar omeprazol' },
        });

        expect(screen.getByTestId('values')).toHaveTextContent(
            '"takes_medication":"Sim: Tomar omeprazol"',
        );

        fireEvent.click(screen.getByRole('radio', { name: 'Não' }));
        expect(
            screen.queryByPlaceholderText('Descreva a medicação...'),
        ).toBeNull();
        expect(screen.getByTestId('values')).toHaveTextContent(
            '"takes_medication":"Não"',
        );
    });

    it('mantém seleção de gestação como rádio Sim/Não', () => {
        render(<Harness />);

        fireEvent.click(screen.getByRole('radio', { name: 'Sim' }));

        expect(screen.getByTestId('values')).toHaveTextContent(
            '"is_pregnant":true',
        );
    });

    it('abre o texto de cirurgia apenas quando Sim está marcado', () => {
        render(<Harness />);

        fireEvent.click(screen.getAllByRole('radio', { name: 'Sim' })[1]);

        const surgery = screen.getByPlaceholderText(
            'Descreva cirurgias anteriores, datas e observações...',
        );
        fireEvent.change(surgery, { target: { value: 'Artroscopia em 2019' } });

        expect(screen.getByTestId('values')).toHaveTextContent(
            '"had_surgery":"Artroscopia em 2019"',
        );

        fireEvent.click(screen.getAllByRole('radio', { name: 'Não' })[1]);
        expect(
            screen.queryByPlaceholderText(
                'Descreva cirurgias anteriores, datas e observações...',
            ),
        ).toBeNull();
        expect(screen.getByTestId('values')).toHaveTextContent(
            '"had_surgery":"Não"',
        );
    });

    it('permite marcar históricos clínicos com Outros e limpar o texto', () => {
        render(<Harness />);

        fireEvent.click(screen.getByRole('checkbox', { name: 'Diabetes' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Outros' }));

        const otherInput = screen.getByPlaceholderText(
            'Descreva outros históricos...',
        );
        fireEvent.change(otherInput, {
            target: { value: 'Anemia falciforme' },
        });

        expect(screen.getByTestId('values')).toHaveTextContent(
            '"clinical_history":"Diabetes, Outros: Anemia falciforme"',
        );

        fireEvent.click(
            screen.getByRole('button', { name: 'Limpar histórico outros' }),
        );
        expect(screen.getByTestId('values')).toHaveTextContent(
            '"clinical_history":"Diabetes"',
        );
    });

    it('preserva espaço durante digitação no campo Outros', () => {
        render(<Harness />);

        fireEvent.click(screen.getByRole('checkbox', { name: 'Outros' }));

        const otherInput = screen.getByPlaceholderText(
            'Descreva outros históricos...',
        ) as HTMLInputElement;

        fireEvent.change(otherInput, { target: { value: 'Braço ' } });

        expect(otherInput.value).toBe('Braço ');
        expect(screen.getByTestId('values')).toHaveTextContent(
            '"clinical_history":"Outros: Braço "',
        );
    });
});
