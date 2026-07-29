import React from 'react';
import { FaCalendarAlt, FaEdit, FaPlus } from 'react-icons/fa';
import type { Appointment } from '../../hooks/useAppointments';
import type { ClientBasic } from '../../types/ClientBasic';
import styles from './ClientCard.module.css';
import FinalizeButton from './FinalizeButton';
import SolveButton from './SolveButton';
import { FutureAppointmentsList } from '../../domain/futureAppointments';
import { API_BASE } from '../../config/api';
import { getAccessToken } from '../../utils/auth/session';
import { formatTime } from '../../utils/timeFormat';
import {
    normalizePhoneDigits,
    openWhatsAppInNewTab,
} from '../../utils/whatsapp';
import type { AppointmentDateRangeArgs } from '../../utils/agendaPresentation';

interface AgendaActionControl {
    title: string;
    disabled?: boolean;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

interface ClientCardAgendaSectionProps {
    client: ClientBasic;
    notifyAppt?: { start_at?: string; end_at?: string; title?: string };
    pendingAppt?: { start_at?: string; end_at?: string };
    hasAgendaLine: boolean;
    isScheduled: boolean;
    isPending: boolean;
    isOngoing: boolean;
    effectiveOngoing: boolean;
    activeStartISO: string | null;
    activeEndISO: string | null;
    displayStartISO: string | null;
    futureAppointments: Appointment[];
    loadingFuture: boolean;
    hideFutureList: boolean;
    createActionAgenda: AgendaActionControl;
    createActionFallback: AgendaActionControl;
    labelColor: string;
    valueColor: string;
    iconColor: string;
    separatorColor: string;
    separatorOpacity: number;
    finishing: boolean;
    effectiveApptId?: number | null;
    onFinalize: () => Promise<void> | void;
    onOpenMonthlyAgenda: (dateISO?: string | null) => void;
    onOpenQuickSchedule: (appointment?: Appointment | null) => void;
    onSolvePending: () => Promise<void> | void;
    formatDateRange: (args: AppointmentDateRangeArgs) => string;
}

function getProfessionalFirstName(): string {
    const profRaw = localStorage.getItem('loggedProfessional');
    if (!profRaw) return '';

    try {
        const p = JSON.parse(profRaw) as {
            display_name?: string;
            first_name?: string;
        };
        return p?.display_name || p?.first_name || '';
    } catch {
        return '';
    }
}

function buildDayLabel(sIso: string | null): string {
    const apptDate = sIso ? new Date(sIso) : null;
    const isValidDate = apptDate && !isNaN(apptDate.getTime());

    if (!isValidDate) return 'hoje';

    const datePart = `, ${String(apptDate.getDate()).padStart(2, '0')}/${String(
        apptDate.getMonth() + 1,
    ).padStart(2, '0')}`;

    const now = new Date();
    const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
    );
    const apptDay = new Date(
        apptDate.getFullYear(),
        apptDate.getMonth(),
        apptDate.getDate(),
    );

    if (apptDay.getTime() === tomorrowDay.getTime()) return `amanhã${datePart}`;
    if (apptDay.getTime() === todayDay.getTime()) return `hoje${datePart}`;
    return datePart.replace(/^, /, '');
}

export default function ClientCardAgendaSection({
    client,
    notifyAppt,
    pendingAppt,
    hasAgendaLine,
    isScheduled,
    isPending,
    isOngoing,
    effectiveOngoing,
    activeStartISO,
    activeEndISO,
    displayStartISO,
    futureAppointments,
    loadingFuture,
    hideFutureList,
    createActionAgenda,
    createActionFallback,
    labelColor,
    valueColor,
    iconColor,
    separatorColor,
    separatorOpacity,
    finishing,
    effectiveApptId,
    onFinalize,
    onOpenMonthlyAgenda,
    onOpenQuickSchedule,
    onSolvePending,
    formatDateRange,
}: ClientCardAgendaSectionProps) {
    const handleEditNextAppointment = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            if (!client.next_appointment_id) return;

            const token = getAccessToken();
            fetch(
                `${API_BASE}/agenda/appointments/${client.next_appointment_id}/`,
                {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                },
            )
                .then(r => (r.ok ? r.json() : null))
                .then(data => {
                    onOpenQuickSchedule(data);
                })
                .catch(() => {
                    onOpenQuickSchedule();
                });
        },
        [client.next_appointment_id, onOpenQuickSchedule],
    );

    const handleSendConfirmation = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();

            if (!client.phone) {
                alert('Telefone não cadastrado para este cliente.');
                return;
            }

            const sIso = activeStartISO;
            const time = sIso ? formatTime(sIso) : '—';
            const visitType =
                notifyAppt?.title ||
                client.next_appointment_title ||
                'Consulta';
            const profFirstName = getProfessionalFirstName();
            const profPart = profFirstName ? ` com ${profFirstName}` : '';
            const dayLabel = buildDayLabel(sIso);

            const waText = `Olá ${client.first_name}, ${visitType} agendada para ${dayLabel} às ${time}${profPart}, confirma sua presença?`;
            const normalizedPhone = normalizePhoneDigits(client.phone);
            const waPhone =
                normalizedPhone && !normalizedPhone.startsWith('55')
                    ? `55${normalizedPhone}`
                    : normalizedPhone;
            if (!waPhone) return;

            openWhatsAppInNewTab({
                phoneE164: waPhone,
                text: waText,
            });
        },
        [
            activeStartISO,
            client.first_name,
            client.next_appointment_title,
            client.phone,
            notifyAppt?.title,
        ],
    );

    return (
        <>
            {hasAgendaLine && (
                <div
                    aria-hidden
                    style={{
                        height: 1,
                        background: separatorColor,
                        opacity: separatorOpacity,
                        margin: '12px 0 12px',
                        borderRadius: 1,
                    }}
                />
            )}

            {hasAgendaLine && (
                <>
                    {(isScheduled ||
                        effectiveOngoing ||
                        futureAppointments.length > 0) && (
                        <div className={styles.infoRow}>
                            <span
                                className={styles.label}
                                style={{
                                    color: labelColor,
                                    fontWeight: 'bold',
                                }}
                            >
                                Agenda (tipo):
                            </span>
                            <span
                                className={styles.value}
                                style={{ color: valueColor }}
                            >
                                {client.next_appointment_title || 'Consulta'}
                            </span>
                            <button
                                className={styles.iconButton}
                                title={createActionAgenda.title}
                                disabled={createActionAgenda.disabled}
                                style={
                                    createActionAgenda.disabled
                                        ? {
                                              opacity: 0.45,
                                              cursor: 'not-allowed',
                                          }
                                        : undefined
                                }
                                onClick={createActionAgenda.onClick}
                            >
                                <FaPlus color={iconColor} />
                            </button>
                            <button
                                className={styles.iconButton}
                                title='Agenda mensal'
                                onClick={event => {
                                    event.stopPropagation();
                                    onOpenMonthlyAgenda(
                                        displayStartISO ||
                                            client.next_appointment_start_at ||
                                            null,
                                    );
                                }}
                            >
                                <FaCalendarAlt color={iconColor} />
                            </button>
                        </div>
                    )}
                    <div className={styles.infoRow}>
                        <span
                            className={styles.label}
                            style={{ color: labelColor, fontWeight: 'bold' }}
                        >
                            Data:
                        </span>
                        <span
                            className={styles.value}
                            style={{ color: labelColor, fontWeight: 'bold' }}
                        >
                            {formatDateRange({
                                startIso: activeStartISO,
                                endIso: activeEndISO,
                                requireEnd: true,
                            })}
                        </span>
                        {client.next_appointment_id && !effectiveOngoing && (
                            <button
                                className={styles.iconButton}
                                title='Editar agendamento'
                                onClick={handleEditNextAppointment}
                            >
                                <FaEdit color={iconColor} />
                            </button>
                        )}
                    </div>
                    {(isScheduled || effectiveOngoing) &&
                        client.next_appointment_notes?.trim() && (
                            <div
                                className={styles.infoRow}
                                style={{ paddingTop: 2 }}
                            >
                                <span
                                    className={styles.value}
                                    style={{
                                        color: valueColor,
                                        fontSize: 13,
                                        lineHeight: 1.35,
                                        whiteSpace: 'pre-wrap',
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    <span className={styles.notesText}>
                                        {client.next_appointment_notes.trim()}
                                    </span>
                                </span>
                            </div>
                        )}
                    {effectiveOngoing && (
                        <div
                            className={styles.infoRow}
                            style={{ paddingTop: 2 }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%',
                                    gap: 12,
                                }}
                            >
                                <span
                                    style={{
                                        background: 'var(--color-ongoing)',
                                        color: '#fff',
                                        borderRadius: 6,
                                        padding: '2px 8px',
                                        fontWeight: 700,
                                        fontSize: 12,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    Em andamento
                                </span>
                                <FinalizeButton
                                    finishing={finishing}
                                    disabled={!effectiveApptId}
                                    isEarly={isOngoing}
                                    clientId={client.id}
                                    appointmentId={effectiveApptId}
                                    onFinalize={onFinalize}
                                />
                            </div>
                        </div>
                    )}
                    {isScheduled && !effectiveOngoing && (
                        <div
                            className={styles.infoRow}
                            style={{ paddingTop: 2 }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    width: '100%',
                                }}
                            >
                                <button
                                    type='button'
                                    className={`${styles.actionButton} ${styles.actionScheduled}`}
                                    title={
                                        client.phone
                                            ? 'Enviar aviso de confirmação via WhatsApp'
                                            : 'Telefone não cadastrado'
                                    }
                                    style={{
                                        fontWeight: 700,
                                        opacity: client.phone ? 1 : 0.45,
                                    }}
                                    onClick={handleSendConfirmation}
                                >
                                    Avisar
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {!hasAgendaLine && !isPending && !isOngoing && (
                <div className={styles.infoRow}>
                    <span
                        className={styles.label}
                        style={{ color: labelColor, fontWeight: 'bold' }}
                    >
                        Data:
                    </span>
                    <span
                        className={styles.value}
                        style={{ color: valueColor }}
                    >
                        {isScheduled ? 'Agendado' : 'Sem agendamento'}
                    </span>
                    <button
                        className={styles.iconButton}
                        title={createActionFallback.title}
                        disabled={createActionFallback.disabled}
                        style={
                            createActionFallback.disabled
                                ? { opacity: 0.45, cursor: 'not-allowed' }
                                : undefined
                        }
                        onClick={createActionFallback.onClick}
                    >
                        <FaPlus color={iconColor} />
                    </button>
                    <button
                        className={styles.iconButton}
                        title='Agenda mensal'
                        onClick={event => {
                            event.stopPropagation();
                            onOpenMonthlyAgenda(
                                client.next_appointment_start_at || null,
                            );
                        }}
                    >
                        <FaCalendarAlt color={iconColor} />
                    </button>
                </div>
            )}

            {isPending && !isOngoing && (
                <>
                    <div
                        aria-hidden
                        style={{
                            height: 1,
                            background: separatorColor,
                            opacity: separatorOpacity,
                            margin: '12px 0 12px',
                            borderRadius: 1,
                        }}
                    />
                    {(client.next_appointment_start_at ||
                        pendingAppt?.start_at) && (
                        <div className={styles.infoRow}>
                            <span
                                className={styles.label}
                                style={{
                                    color: labelColor,
                                    fontWeight: 'bold',
                                }}
                            >
                                Data:
                            </span>
                            <span
                                className={styles.value}
                                style={{ color: valueColor }}
                            >
                                {formatDateRange({
                                    startIso:
                                        client.next_appointment_start_at ||
                                        pendingAppt?.start_at ||
                                        null,
                                    endIso:
                                        client.next_appointment_end_at ||
                                        pendingAppt?.end_at ||
                                        null,
                                })}
                            </span>
                        </div>
                    )}
                    <div
                        className={styles.infoRow}
                        style={{ alignItems: 'center' }}
                    >
                        <span
                            className={styles.label}
                            style={{ color: labelColor, fontWeight: 'bold' }}
                        >
                            Status:
                        </span>
                        <span
                            className={styles.value}
                            style={{
                                color: 'var(--color-text-secondary, #6b7280)',
                                fontStyle: 'italic',
                            }}
                        >
                            Compromisso pendente
                        </span>
                        <SolveButton onSolve={onSolvePending} />
                    </div>
                </>
            )}

            {futureAppointments.length > 0 && !hideFutureList && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        marginTop: 4,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                        }}
                    >
                        <FutureAppointmentsList
                            items={futureAppointments}
                            valueColor={valueColor}
                            iconColor={iconColor}
                            labelColor={labelColor}
                            clientId={client.id}
                            onEdit={(appt: Appointment) => {
                                onOpenQuickSchedule(appt);
                            }}
                        />
                        {loadingFuture && (
                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'var(--color-text-muted)',
                                }}
                            >
                                Carregando…
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
