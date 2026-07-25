import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import FloatingDatePicker from '../FloatingDatePicker';

describe('FloatingDatePicker', () => {
    it('does not render when closed', () => {
        const { container } = render(
            <FloatingDatePicker
                open={false}
                onClose={() => {}}
                selectedDate={new Date(2026, 6, 25)}
                onChange={() => {}}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('navigates year and month views before selecting a day', () => {
        const onChange = vi.fn();

        render(
            <FloatingDatePicker
                open
                onClose={() => {}}
                selectedDate={new Date(2026, 6, 25)}
                onChange={onChange}
            />,
        );

        fireEvent.click(screen.getByTitle('Selecionar ano'));
        fireEvent.click(screen.getByTitle('Próximo'));
        fireEvent.click(screen.getByRole('button', { name: '2028' }));
        fireEvent.click(screen.getByRole('button', { name: 'Fev' }));
        fireEvent.click(screen.getByTitle('14/02/2028'));

        expect(onChange).toHaveBeenCalledTimes(1);
        const nextDate = onChange.mock.calls[0][0] as Date;
        expect(nextDate.getFullYear()).toBe(2028);
        expect(nextDate.getMonth()).toBe(1);
        expect(nextDate.getDate()).toBe(14);
    });

    it('disables days before minDate and keeps close action available', () => {
        const onChange = vi.fn();
        const onClose = vi.fn();

        render(
            <FloatingDatePicker
                open
                onClose={onClose}
                selectedDate={new Date(2026, 1, 15)}
                minDate={new Date(2026, 1, 10)}
                onChange={onChange}
            />,
        );

        const blockedDay = screen.getByTitle('09/02/2026');
        expect(blockedDay).toBeDisabled();

        fireEvent.click(blockedDay);
        expect(onChange).not.toHaveBeenCalled();

        fireEvent.click(screen.getByTitle('Fechar'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});