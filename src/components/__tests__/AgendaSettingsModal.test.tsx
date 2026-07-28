import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AgendaSettingsModal } from '../AgendaSettingsModal/AgendaSettingsModal';
import { resetAgendaSettings } from '../../utils/agendaSettings';

const emitMock = vi.hoisted(() => vi.fn());
vi.mock('../../events/bus', () => ({ emit: emitMock }));

vi.mock('../Modal', () => ({
    default: ({
        open,
        children,
    }: {
        open: boolean;
        children: React.ReactNode;
    }) => (open ? <div data-testid='modal-root'>{children}</div> : null),
}));

describe('AgendaSettingsModal', () => {
    const LS_KEYS = {
        defaultDuration: 'agenda.defaultDuration',
        defaultVisitType: 'defaultVisitType',
    };

    function clearLS() {
        Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k));
    }

    beforeEach(() => {
        clearLS();
        resetAgendaSettings();
        emitMock.mockClear();
        vi.restoreAllMocks();
        vi.stubGlobal('fetch', vi.fn());
    });

    function setTimeByDigits(label: RegExp, digits: string) {
        const input = screen.getByLabelText(label);
        fireEvent.change(input, { target: { value: digits } });
        fireEvent.blur(input);
    }

    it('renders fields with defaults when no localStorage', () => {
        render(<AgendaSettingsModal open={true} onClose={() => {}} />);
        expect(screen.getByLabelText(/In[ií]cio expediente/i)).toHaveValue(
            '06:00',
        );
        expect(screen.getByLabelText(/Fim expediente/i)).toHaveValue('21:00');
        expect(screen.getByLabelText(/Dura[cç][aã]o padr[aã]o/i)).toHaveValue(
            '60',
        );
        expect(screen.getByLabelText(/Tipo padr[aã]o/i)).toHaveValue(
            'consulta',
        );
    });

    it('loads persisted agenda settings from backend', async () => {
        localStorage.setItem('accessToken', 'token');
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                work_start_hour: 7,
                work_start_minute: 30,
                work_end_hour: 19,
                work_end_minute: 15,
                slot_minutes: 15,
                reminder_enabled: true,
                reminder_minutes_before: 120,
            }),
        } as Response);

        render(<AgendaSettingsModal open={true} onClose={() => {}} />);

        await waitFor(() => {
            expect(screen.getByLabelText(/In[ií]cio expediente/i)).toHaveValue(
                '07:30',
            );
        });
        expect(screen.getByLabelText(/Fim expediente/i)).toHaveValue('19:15');
    });

    it('formats time when user types 4 digits', () => {
        render(<AgendaSettingsModal open={true} onClose={() => {}} />);

        const start = screen.getByLabelText(/In[ií]cio expediente/i);
        fireEvent.change(start, { target: { value: '0630' } });
        fireEvent.blur(start);

        expect(start).toHaveValue('06:30');
    });

    it('normalizes short time fragments on blur', () => {
        render(<AgendaSettingsModal open={true} onClose={() => {}} />);

        const start = screen.getByLabelText(/In[ií]cio expediente/i);
        fireEvent.change(start, { target: { value: '63' } });
        fireEvent.blur(start);

        expect(start).toHaveValue('23:00');
    });

    it('saves persisted fields to backend', async () => {
        localStorage.setItem('accessToken', 'token');
        vi.mocked(fetch)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    work_start_hour: 6,
                    work_start_minute: 0,
                    work_end_hour: 21,
                    work_end_minute: 0,
                    slot_minutes: 10,
                    reminder_enabled: false,
                    reminder_minutes_before: 90,
                }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    work_start_hour: 7,
                    work_start_minute: 30,
                    work_end_hour: 20,
                    work_end_minute: 0,
                    slot_minutes: 10,
                    reminder_enabled: false,
                    reminder_minutes_before: 90,
                }),
            } as Response);

        render(<AgendaSettingsModal open={true} onClose={() => {}} />);
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(screen.getByLabelText(/In[ií]cio expediente/i)).toHaveValue(
                '06:00',
            );
        });

        setTimeByDigits(/In[ií]cio expediente/i, '0730');
        setTimeByDigits(/Fim expediente/i, '2000');
        fireEvent.change(screen.getByLabelText(/Dura[cç][aã]o padr[aã]o/i), {
            target: { value: '90' },
        });
        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(2);
        });
        expect(vi.mocked(fetch).mock.calls[1]?.[1]).toMatchObject({
            method: 'PATCH',
        });
        expect(String(vi.mocked(fetch).mock.calls[1]?.[1]?.body)).toContain(
            '"work_start_hour":7',
        );
        expect(String(vi.mocked(fetch).mock.calls[1]?.[1]?.body)).toContain(
            '"work_start_minute":30',
        );
        expect(String(vi.mocked(fetch).mock.calls[1]?.[1]?.body)).toContain(
            '"default_duration_minutes":90',
        );
        await waitFor(() => {
            expect(emitMock).toHaveBeenCalledWith(
                'systemMessage',
                expect.objectContaining({ text: 'Configuracoes salvas.' }),
            );
        });
    });

    it('shows error when end <= start and does not persist', () => {
        localStorage.setItem('accessToken', 'token');
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                work_start_hour: 6,
                work_start_minute: 0,
                work_end_hour: 21,
                work_end_minute: 0,
                slot_minutes: 10,
                reminder_enabled: false,
                reminder_minutes_before: 90,
            }),
        } as Response);
        render(<AgendaSettingsModal open={true} onClose={() => {}} />);
        setTimeByDigits(/Fim expediente/i, '0559');
        fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
        expect(screen.getByRole('status')).toHaveTextContent(
            /Fim deve ser maior/i,
        );
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('does not render restore defaults button', () => {
        render(<AgendaSettingsModal open={true} onClose={() => {}} />);
        expect(
            screen.queryByRole('button', {
                name: /restaurar padr[oõ]es/i,
            }),
        ).not.toBeInTheDocument();
    });

    it('closing without save discards changes and emits info message', () => {
        const onClose = vi.fn();
        render(<AgendaSettingsModal open={true} onClose={onClose} />);

        setTimeByDigits(/In[ií]cio expediente/i, '0700');
        fireEvent.click(screen.getByText('Fechar'));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(emitMock).toHaveBeenCalledWith(
            'systemMessage',
            expect.objectContaining({
                text: 'Alteracoes nao salvas foram descartadas.',
                type: 'info',
            }),
        );
    });

    it('enter key triggers save', async () => {
        localStorage.setItem('accessToken', 'token');
        vi.mocked(fetch)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    work_start_hour: 6,
                    work_start_minute: 0,
                    work_end_hour: 21,
                    work_end_minute: 0,
                    slot_minutes: 10,
                    reminder_enabled: false,
                    reminder_minutes_before: 90,
                }),
            } as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    work_start_hour: 8,
                    work_start_minute: 0,
                    work_end_hour: 21,
                    work_end_minute: 0,
                    slot_minutes: 10,
                    reminder_enabled: false,
                    reminder_minutes_before: 90,
                }),
            } as Response);

        render(<AgendaSettingsModal open={true} onClose={() => {}} />);
        const start = screen.getByLabelText(/In[ií]cio expediente/i);
        fireEvent.change(start, { target: { value: '0800' } });
        fireEvent.keyDown(start, { key: 'Enter', code: 'Enter' });

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(2);
        });
    });
});
