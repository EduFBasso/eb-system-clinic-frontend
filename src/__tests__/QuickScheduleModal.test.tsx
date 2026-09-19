import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    afterEach,
    type Mock,
} from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import QuickScheduleModal from '../components/QuickScheduleModal/QuickScheduleModal';
import type { ClientBasic } from '../types/ClientBasic';
import type { Appointment } from '../hooks/useAppointments';

vi.mock('../hooks/useAppointments', () => ({
    useAppointmentsRange: vi.fn(),
}));

// Stub ensureDeviceSession so it never consumes fetch mock slots
vi.mock('../services/sessions', () => ({
    default: () => Promise.resolve(),
    ensureDeviceSession: () => Promise.resolve(),
}));

interface FetchResponse {
    ok: boolean;
    headers?: { get: (k: string) => string | null };
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
}

const client: ClientBasic = {
    id: 1,
    first_name: 'C',
    last_name: 'L',
    phone: '000',
    email: 'c@l',
};

const elisaClient: ClientBasic = {
    id: 2,
    first_name: 'Elisa',
    last_name: 'Figueiredo',
    phone: '111',
    email: 'elisa@mail.com',
};

const { useAppointmentsRange } = await import('../hooks/useAppointments');

function makeScheduledAppt(): Appointment {
    const start = new Date();
    start.setHours(10, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return {
        id: 77,
        professional: 2,
        client: { id: 1, name: 'C L' } as unknown as number,
        client_name: 'C L',
        title: 'Consulta',
        visit_type: 'consulta',
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        status: 'scheduled',
        notes: 'ajustar horario',
    };
}

function openModal() {
    return render(
        <QuickScheduleModal open={true} onClose={() => {}} client={client} />,
    );
}

function expectTime(label: 'Início' | 'Fim', hour: string, minute: string) {
    expect(
        screen.getByRole('button', { name: `${label} hora` }),
    ).toHaveTextContent(hour);
    expect(
        screen.getByRole('button', { name: `${label} minuto` }),
    ).toHaveTextContent(minute);
}

function selectTimePart(
    label: 'Início' | 'Fim',
    part: 'hora' | 'minuto',
    value: string,
) {
    fireEvent.click(screen.getByRole('button', { name: `${label} ${part}` }));
    fireEvent.click(screen.getByRole('option', { name: value }));
}

beforeEach(() => {
    vi.restoreAllMocks();
    // Fixa "agora" em hoje às 09:00 para que o appointment 10:00-11:00 seja sempre futuro.
    // Usa toFake:['Date'] para não afetar setTimeout/setInterval (waitFor continua funcional).
    const fixedNow = new Date();
    fixedNow.setHours(9, 0, 0, 0);
    fixedNow.setSeconds(0);
    fixedNow.setMilliseconds(0);
    vi.useFakeTimers({ now: fixedNow.getTime(), toFake: ['Date'] });
    // Torna requestAnimationFrame síncrono para que runAfterPromptClose dispare imediatamente.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(0);
        return 0;
    });
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    vi.spyOn(window.localStorage, 'getItem').mockReturnValue('token');
    vi.mocked(useAppointmentsRange).mockReturnValue({
        items: [],
        loading: false,
        error: null,
    });
});

afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
});

describe('QuickScheduleModal', () => {
    it('shows the backend error without fetching a resolver appointment', async () => {
        const fetchMock = globalThis.fetch as unknown as Mock;
        const resp1: FetchResponse = {
            ok: false,
            headers: { get: () => 'text/plain' },
            text: async () => 'Não foi possível criar o compromisso',
        };
        fetchMock.mockResolvedValueOnce(resp1 as unknown as Response);

        openModal();

        const createBtn = await screen.findByRole('button', { name: /criar/i });
        fireEvent.click(createBtn);

        await waitFor(
            () => {
                expect(fetchMock).toHaveBeenCalledTimes(1);
            },
            { timeout: 10000 },
        );
    }, 15000);

    it('sends device headers on create', async () => {
        const fetchMock = globalThis.fetch as unknown as Mock;
        const resp: FetchResponse = {
            ok: true,
            json: async () => ({ id: 123 }),
        };
        fetchMock.mockResolvedValueOnce(resp as unknown as Response);

        openModal();

        const createBtn = await screen.findByRole('button', { name: /criar/i });
        fireEvent.click(createBtn);

        await waitFor(() => {
            const [url, init] = fetchMock.mock.calls[0];
            expect(String(url)).toMatch(/\/agenda\/appointments\/?$/);
            const headers = (init as RequestInit)?.headers as Record<
                string,
                string
            >;
            expect(headers).toBeTruthy();
            expect(headers['x-device-id']).toBeTruthy();
            expect(headers['x-device-info']).toBeTruthy();
        });
    });

    it('time dropdown interaction does not affect visit type select', async () => {
        (globalThis.fetch as unknown as Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        } as unknown as Response);
        openModal();
        const tipo = await screen.findByRole('button', { name: 'Tipo' });
        const initialVisitType = tipo.textContent;
        fireEvent.click(screen.getByRole('button', { name: 'Início hora' }));
        fireEvent.click(screen.getAllByRole('option')[0]);
        expect(tipo).toHaveTextContent(initialVisitType || 'Outro');
    });

    it('loads the selected appointment into the form when editing from the day card', async () => {
        const appt = makeScheduledAppt();
        vi.mocked(useAppointmentsRange).mockReturnValue({
            items: [appt],
            loading: false,
            error: null,
        });

        openModal();

        fireEvent.click(await screen.findByText('C L'));
        fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

        const startDate = new Date(appt.start_at);
        const endDate = new Date(appt.end_at);

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Salvar' }),
            ).toBeInTheDocument();
            expectTime(
                'Início',
                String(startDate.getHours()).padStart(2, '0'),
                String(startDate.getMinutes()).padStart(2, '0'),
            );
            expectTime(
                'Fim',
                String(endDate.getHours()).padStart(2, '0'),
                String(endDate.getMinutes()).padStart(2, '0'),
            );
            expect(
                screen.getByRole('button', { name: 'Tipo' }),
            ).toHaveTextContent('Consulta');
            expect(screen.getByRole('textbox')).toHaveValue('ajustar horario');
        });
    });

    it('restores the preserved draft when reopening the scheduler after another flow', async () => {
        render(
            <QuickScheduleModal
                open={true}
                onClose={() => {}}
                client={client}
                initialDraft={{
                    clientId: client.id,
                    selectedDateISO: '2026-04-19T00:00:00.000Z',
                    startHM: '11:00',
                    endHM: '11:30',
                    visitType: 'consulta',
                    notes: 'retomar rascunho',
                }}
            />,
        );

        await screen.findByRole('button', { name: 'Início hora' });
        expectTime('Início', '11', '00');
        expectTime('Fim', '11', '30');
        expect(screen.getByRole('button', { name: 'Tipo' })).toHaveTextContent(
            'Consulta',
        );
        expect(screen.getByRole('textbox')).toHaveValue('retomar rascunho');
    });

    it('clears a stale conflict message after switching from create to edit mode', async () => {
        const appt = makeScheduledAppt();
        vi.mocked(useAppointmentsRange).mockReturnValue({
            items: [appt],
            loading: false,
            error: null,
        });

        const listener = vi.fn<(e: Event) => void>();
        window.addEventListener('systemMessage', listener);

        (globalThis.fetch as unknown as Mock).mockResolvedValueOnce({
            ok: false,
            headers: { get: () => 'application/json' },
            json: async () => ({
                non_field_errors: [
                    'Conflito de horário com outro compromisso.',
                ],
            }),
        } as unknown as Response);

        openModal();

        fireEvent.click(await screen.findByRole('button', { name: /criar/i }));

        await waitFor(() => {
            expect(listener).toHaveBeenCalled();
        });

        const event = listener.mock.calls.at(-1)?.[0] as CustomEvent<{
            text?: string;
            type?: string;
        }>;
        expect(event.detail?.type).toBe('error');
        expect(event.detail?.text).toMatch(
            /existe um compromisso neste período/i,
        );

        fireEvent.click(screen.getByText('C L'));
        fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'Salvar' }),
            ).toBeInTheDocument();
        });

        expect(
            screen.queryByText(/conflito de horário:/i),
        ).not.toBeInTheDocument();
        window.removeEventListener('systemMessage', listener);
    });

    it('shows the conflict state in the header and keeps only the conflicting card visible', async () => {
        const appt = makeScheduledAppt();
        const otherAppt: Appointment = {
            ...appt,
            id: 78,
            client: { id: 2, name: 'Outro Cliente' } as unknown as number,
            client_name: 'Outro Cliente',
            start_at: new Date(
                new Date(appt.end_at).getTime() + 60 * 60 * 1000,
            ).toISOString(),
            end_at: new Date(
                new Date(appt.end_at).getTime() + 90 * 60 * 1000,
            ).toISOString(),
        };
        vi.mocked(useAppointmentsRange).mockReturnValue({
            items: [appt, otherAppt],
            loading: false,
            error: null,
        });

        const listener = vi.fn<(e: Event) => void>();
        window.addEventListener('systemMessage', listener);

        (globalThis.fetch as unknown as Mock).mockResolvedValueOnce({
            ok: false,
            headers: { get: () => 'application/json' },
            json: async () => ({
                non_field_errors: [
                    'Conflito de horário com outro compromisso.',
                ],
            }),
        } as unknown as Response);

        openModal();

        fireEvent.click(await screen.findByRole('button', { name: /criar/i }));
        await waitFor(() => expect(listener).toHaveBeenCalled());

        fireEvent.click(await screen.findByText('C L'));
        fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

        await waitFor(() => {
            expect(
                screen.getByText(
                    /Este compromisso esta ocupando o horario que C quer agendar/i,
                ),
            ).toBeInTheDocument();
        });

        const card = document.getElementById('appt-card-77');
        expect(card?.getAttribute('data-selected')).toBe('true');
        expect(card?.getAttribute('data-editing-active')).toBe('true');
        expect(screen.queryByText('Outro Cliente')).not.toBeInTheDocument();
        window.removeEventListener('systemMessage', listener);
    });

    it('highlights and scrolls the conflicting card after create conflict', async () => {
        const appt = makeScheduledAppt();
        const apptStart = new Date(appt.start_at);
        const apptEnd = new Date(appt.end_at);
        vi.mocked(useAppointmentsRange).mockReturnValue({
            items: [appt],
            loading: false,
            error: null,
        });

        const listener = vi.fn<(e: Event) => void>();
        window.addEventListener('systemMessage', listener);

        (globalThis.fetch as unknown as Mock).mockResolvedValueOnce({
            ok: false,
            headers: { get: () => 'application/json' },
            json: async () => ({
                non_field_errors: [
                    'Conflito de horário com outro compromisso.',
                ],
            }),
        } as unknown as Response);

        openModal();

        selectTimePart(
            'Início',
            'hora',
            String(apptStart.getHours()).padStart(2, '0'),
        );
        selectTimePart(
            'Início',
            'minuto',
            String(apptStart.getMinutes()).padStart(2, '0'),
        );
        selectTimePart(
            'Fim',
            'hora',
            String(apptEnd.getHours()).padStart(2, '0'),
        );
        selectTimePart(
            'Fim',
            'minuto',
            String(apptEnd.getMinutes()).padStart(2, '0'),
        );

        fireEvent.click(screen.getByRole('button', { name: /criar/i }));

        await waitFor(() => expect(listener).toHaveBeenCalled());
        await waitFor(() => {
            const card = document.getElementById('appt-card-77');
            expect(card?.getAttribute('data-highlighted')).toBe('true');
        });
        const event = listener.mock.calls.at(-1)?.[0] as CustomEvent<{
            text?: string;
        }>;
        expect(event.detail?.text).toMatch(/toque no cartão destacado/i);
        window.removeEventListener('systemMessage', listener);
    });

    it('switches the header to the conflicting client while editing the blocking appointment', async () => {
        const conflictingApptBase = makeScheduledAppt();
        const conflictingAppt: Appointment = {
            ...conflictingApptBase,
            client: {
                id: 9,
                name: 'Eduardo Figueiredo Basso',
            } as unknown as number,
            client_name: 'Eduardo Figueiredo Basso',
        };
        vi.mocked(useAppointmentsRange).mockReturnValue({
            items: [conflictingAppt],
            loading: false,
            error: null,
        });

        const listener = vi.fn<(e: Event) => void>();
        window.addEventListener('systemMessage', listener);

        (globalThis.fetch as unknown as Mock).mockResolvedValueOnce({
            ok: false,
            headers: { get: () => 'application/json' },
            json: async () => ({
                non_field_errors: [
                    'Conflito de horário com outro compromisso.',
                ],
            }),
        } as unknown as Response);

        render(
            <QuickScheduleModal
                open={true}
                onClose={() => {}}
                client={elisaClient}
            />,
        );

        const conflictingStart = new Date(conflictingAppt.start_at);
        const conflictingEnd = new Date(conflictingAppt.end_at);
        selectTimePart(
            'Início',
            'hora',
            String(conflictingStart.getHours()).padStart(2, '0'),
        );
        selectTimePart(
            'Início',
            'minuto',
            String(conflictingStart.getMinutes()).padStart(2, '0'),
        );
        selectTimePart(
            'Fim',
            'hora',
            String(conflictingEnd.getHours()).padStart(2, '0'),
        );
        selectTimePart(
            'Fim',
            'minuto',
            String(conflictingEnd.getMinutes()).padStart(2, '0'),
        );

        fireEvent.click(screen.getByRole('button', { name: /criar/i }));
        await waitFor(() => expect(listener).toHaveBeenCalled());

        const event = listener.mock.calls.at(-1)?.[0] as CustomEvent<{
            text?: string;
        }>;
        expect(event.detail?.text).toMatch(/remover o conflito/i);

        const card = document.getElementById('appt-card-77');
        expect(card).toBeTruthy();
        fireEvent.click(card as HTMLElement);
        fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

        await waitFor(() => {
            expect(
                screen.getByText((_content, node) => {
                    return (
                        node?.tagName === 'H2' &&
                        node.textContent?.replace(/\s+/g, ' ').trim() ===
                            'Eduardo Figueiredo Basso'
                    );
                }),
            ).toBeInTheDocument();
        });

        expect(
            screen.queryByRole('heading', { level: 2, name: 'Elisa' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByText(
                /Este compromisso esta ocupando o horario que Elisa quer agendar/i,
            ),
        ).toBeInTheDocument();
        window.removeEventListener('systemMessage', listener);
    });

    it('returns to the original client draft after saving the conflicting appointment edit', async () => {
        const conflictingStart = new Date(Date.now() + 3 * 60 * 60 * 1000);
        conflictingStart.setMinutes(30, 0, 0);
        const conflictingEnd = new Date(
            conflictingStart.getTime() + 30 * 60 * 1000,
        );
        const originalDraftStart = new Date(
            conflictingStart.getTime() + 20 * 60 * 1000,
        );
        const originalDraftEnd = new Date(
            originalDraftStart.getTime() + 30 * 60 * 1000,
        );
        const conflictingAppt = {
            ...makeScheduledAppt(),
            client: {
                id: 11,
                name: 'Elisa Figueiredo',
            } as unknown as number,
            client_name: 'Elisa Figueiredo',
            visit_type: 'retorno' as Appointment['visit_type'],
            start_at: conflictingStart.toISOString(),
            end_at: conflictingEnd.toISOString(),
        };
        vi.mocked(useAppointmentsRange).mockReturnValue({
            items: [conflictingAppt],
            loading: false,
            error: null,
        });

        const listener = vi.fn<(e: Event) => void>();
        window.addEventListener('systemMessage', listener);

        (globalThis.fetch as unknown as Mock)
            .mockResolvedValueOnce({
                ok: false,
                headers: { get: () => 'application/json' },
                json: async () => ({
                    non_field_errors: [
                        'Conflito de horário com outro compromisso.',
                    ],
                }),
            } as unknown as Response)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: conflictingAppt.id }),
            } as unknown as Response);

        render(
            <QuickScheduleModal
                open={true}
                onClose={() => {}}
                client={client}
            />,
        );

        selectTimePart(
            'Início',
            'hora',
            String(originalDraftStart.getHours()).padStart(2, '0'),
        );
        selectTimePart(
            'Início',
            'minuto',
            String(originalDraftStart.getMinutes()).padStart(2, '0'),
        );
        selectTimePart(
            'Fim',
            'hora',
            String(originalDraftEnd.getHours()).padStart(2, '0'),
        );
        selectTimePart(
            'Fim',
            'minuto',
            String(originalDraftEnd.getMinutes()).padStart(2, '0'),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Tipo' }));
        fireEvent.click(screen.getByRole('option', { name: 'Consulta' }));
        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: 'agendamento da cliente original' },
        });

        fireEvent.click(screen.getByRole('button', { name: /criar/i }));
        await waitFor(() => expect(listener).toHaveBeenCalled());

        const card = document.getElementById(`appt-card-${conflictingAppt.id}`);
        expect(card).toBeTruthy();
        fireEvent.click(card as HTMLElement);
        fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

        await waitFor(() => {
            expect(
                screen.getByText((_content, node) => {
                    return (
                        node?.tagName === 'H2' &&
                        node.textContent?.replace(/\s+/g, ' ').trim() ===
                            'Elisa Figueiredo'
                    );
                }),
            ).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

        await waitFor(() => {
            expect(
                screen.getByText((_content, node) => {
                    return (
                        node?.tagName === 'H2' &&
                        node.textContent?.replace(/\s+/g, ' ').trim() === 'C L'
                    );
                }),
            ).toBeInTheDocument();
        });

        expect(
            screen.getByRole('button', { name: 'Criar' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveValue(
            'agendamento da cliente original',
        );
        expect(
            screen.queryByText(
                /Este compromisso esta ocupando o horario que C quer agendar/i,
            ),
        ).not.toBeInTheDocument();
        window.removeEventListener('systemMessage', listener);
    });
});
