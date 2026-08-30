// frontend/src/components/ClientCard.tsx
import React from 'react';
import styles from './ClientCard.module.css';
import { FaEye, FaWhatsapp, FaTooth, FaShoePrints } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useClientCreateAction } from '../../hooks/useClientCreateAction';
import { API_BASE } from '../../config/api';
import type { Appointment } from '../../hooks/useAppointments';
import type { ClientBasic } from '../../types/ClientBasic';
import { formatPhone } from '../../utils/formatPhone';
import { FaEdit } from 'react-icons/fa';
import '../../styles/palette.css';
import { parseDOB, calcAge } from '../../utils/dateOfBirth';
import { useClientCardStyle } from './useClientCardStyle';
import { useClientCardFocusScroll } from './useClientCardFocusScroll';
import { useClientFutureAppointments } from '../../domain/futureAppointments';
// (hysteresis & appointment state consolidated inside hooks)
import { formatAppointmentDateRange } from '../../utils/agendaPresentation';
import { openClientForm } from '../../utils/openClientForm';
// import { useNowTick } from '../../hooks/useNowTick'; <- sem uso
import { emit } from '../../events/bus';
import { getAccessToken } from '../../utils/auth/session';
import { useTheme } from '../../contexts/ThemeContext';
import EditClientActionsModal from './EditClientActionsModal';
import ClientCardAgendaSection from './ClientCardAgendaSection';
import {
    buildWhatsAppUrl,
    normalizePhoneDigits,
    openWhatsAppInNewTab,
} from '../../utils/whatsapp';

interface ClientCardProps {
    client: ClientBasic;
    onView: (client: ClientBasic) => void;
    selected?: boolean;
    onSelect?: () => void;
    /** Quando definido, o botão "Avisar" usa este agendamento em vez do next_appointment do cliente.
     *  Útil quando o filtro ativo é "Amanhã" e o cliente tem um agendamento amanhã distinto do next. */
    notifyAppt?: { start_at?: string; end_at?: string; title?: string };
    /** Modo de filtro ativo. Quando 'today' ou 'tomorrow', o card exibe apenas o dia filtrado. */
    filterMode?: 'all' | 'today' | 'tomorrow';
}

const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|::1)$/i;

function isLocalHostname(hostname: string): boolean {
    return LOCAL_HOST_PATTERN.test((hostname || '').trim());
}

function parseAbsoluteUrl(value: string): URL | null {
    try {
        return new URL(value);
    } catch {
        return null;
    }
}

function resolvePublicAnamnesisBaseUrl(): string {
    const currentOrigin = window.location.origin.replace(/\/+$/, '');

    // In local development, keep domain parity with the current access mode.
    // If user opened with localhost, generate localhost link.
    // If user opened with LAN IP, generate LAN IP link.
    if (import.meta.env.DEV) {
        return currentOrigin;
    }

    const configuredBase = (
        import.meta.env.VITE_PUBLIC_ANAMNESIS_BASE_URL as string | undefined
    )?.trim();
    if (configuredBase && /^https?:\/\//i.test(configuredBase)) {
        return configuredBase.replace(/\/+$/, '');
    }

    const currentHost = window.location.hostname || '';

    // If app is running on localhost, try inferring a LAN host from API_BASE
    // so links can be opened by another device (e.g., client phone).
    if (isLocalHostname(currentHost)) {
        const apiUrl = parseAbsoluteUrl(API_BASE);
        if (apiUrl && !isLocalHostname(apiUrl.hostname)) {
            const protocol = window.location.protocol || apiUrl.protocol;
            const frontendPort = window.location.port || '5173';
            return `${protocol}//${apiUrl.hostname}:${frontendPort}`.replace(
                /\/+$/,
                '',
            );
        }
    }

    return currentOrigin;
}

function ClientCardBase({
    client,
    onView,
    selected,
    onSelect,
    notifyAppt,
    filterMode = 'all',
}: ClientCardProps) {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isScheduled = client.next_appointment_status === 'scheduled';
    // Futuros agora gerenciados por hook dedicado
    const { futureAppointments, loadingFuture, dynLimit } =
        useClientFutureAppointments({ client, isScheduled });
    const [pressed, setPressed] = React.useState(false);
    // const now = useNowTick(5000); <- sem uso
    // start derivado como Date não é necessário; mantemos ISO para o snapshot
    // end derivado não é necessário para estilização; snapshot usa ISO strings
    // Idade calculada uma vez (se data válida) para exibir em linha própria
    const ageYears = React.useMemo(() => {
        if (!client.date_of_birth) return null;
        const parsed = parseDOB(client.date_of_birth);
        if (!parsed) return null;
        return parsed.age != null
            ? parsed.age
            : calcAge(parsed.year, parsed.month, parsed.day);
    }, [client.date_of_birth]);
    const canAccessTreatmentPlan = React.useMemo(() => {
        try {
            const stored = localStorage.getItem('loggedProfessional');
            if (!stored) return false;
            const professional = JSON.parse(stored) as { specialty?: string };
            const specialty = (professional.specialty || '')
                .toString()
                .trim()
                .toLowerCase();
            return (
                specialty.includes('odonto') ||
                specialty.includes('dent') ||
                specialty.includes('ortodont') ||
                specialty.includes('podolog')
            );
        } catch {
            return false;
        }
    }, []);
    const isPodology = React.useMemo(() => {
        try {
            const stored = localStorage.getItem('loggedProfessional');
            const specialty = stored
                ? String(
                      (JSON.parse(stored) as { specialty?: string })
                          .specialty || '',
                  )
                : '';
            return specialty.toLowerCase().includes('podolog');
        } catch {
            return false;
        }
    }, []);
    const isTomorrowFilter = filterMode === 'tomorrow' && !!notifyAppt;

    const hasAgendaLine = isScheduled || futureAppointments.length > 0;

    // Ações unificadas (+) para agenda e fallback
    const createActionAgenda = useClientCreateAction({
        futureAppointmentsCount: futureAppointments.length,
        isScheduled,
        dynLimit,
        setEditing: () => {
            /* noop: scheduling flow is hosted globally in Home */
        },
        openQuick: () => openGlobalQuickSchedule(),
        baseTitle: 'Novo agendamento',
    });
    const createActionFallback = useClientCreateAction({
        futureAppointmentsCount: futureAppointments.length,
        isScheduled,
        dynLimit,
        setEditing: () => {
            /* noop: scheduling flow is hosted globally in Home */
        },
        openQuick: () => openGlobalQuickSchedule(),
        baseTitle: 'Agendar',
    });
    const {
        containerStyle,
        labelColor,
        iconColor,
        valueColor,
        separatorColor,
        separatorOpacity,
    } = useClientCardStyle({
        selected,
        pressed,
    });
    const openGlobalQuickSchedule = React.useCallback(
        (appointment?: Appointment | null) => {
            try {
                window.dispatchEvent(
                    new CustomEvent('openScheduleEdit', {
                        detail: {
                            client,
                            appointment: appointment ?? undefined,
                        },
                    }),
                );
            } catch {
                /* noop */
            }
        },
        [client],
    );
    const cardRef = React.useRef<HTMLDivElement | null>(null);
    const [editActionsOpen, setEditActionsOpen] = React.useState(false);
    const [sendingAnamnesisLink, setSendingAnamnesisLink] =
        React.useState(false);

    const openGlobalMonthlyAgenda = React.useCallback(
        (dateISO?: string | null) => {
            try {
                emit('openMonthlyAgenda', {
                    clientId: client.id,
                    date: dateISO || undefined,
                });
            } catch {
                /* noop */
            }
        },
        [client.id],
    );

    // Align with global forceClose: ensure any ClientCard modal closes too

    // Fechar modo edição ao clicar fora do card
    // Efeito de clique fora removido enquanto editor inline está desativado
    // Borda e fundo já definidos no hook (containerStyle)
    // title display moved into the agenda section below when scheduled
    useClientCardFocusScroll({
        clientId: client.id,
        cardRef,
        onSelect,
        futureAppointmentsCount: futureAppointments.length,
        isScheduled,
    });

    // Inline effect de futuros removido (substituído pelo hook)

    // Quando o filtro ativo é 'tomorrow' e temos o agendamento de amanhã, usamos seus dados
    // para o bloco "Data:" e o botão "Avisar" — substituindo os dados de hoje.
    const activeStartISO = isTomorrowFilter
        ? (notifyAppt?.start_at ?? null)
        : client.next_appointment_start_at || null;
    const activeEndISO = isTomorrowFilter
        ? (notifyAppt?.end_at ?? null)
        : client.next_appointment_end_at || null;
    // Ocultar o bloco "Próximos compromissos" quando um filtro de dia específico está ativo
    const hideFutureList = filterMode === 'today' || filterMode === 'tomorrow';
    const cardClassNames = [styles.card, selected ? styles.cardSelected : '']
        .filter(Boolean)
        .join(' ');

    const openEditClientFlow = React.useCallback(() => {
        const token = getAccessToken();
        if (!token) {
            onView(client);
            return;
        }
        openClientForm({ id: client.id, navigate });
    }, [client, navigate, onView]);

    const directWhatsappHref = React.useMemo(() => {
        const digits = normalizePhoneDigits(client.phone);
        return buildWhatsAppUrl({ phoneE164: digits });
    }, [client.phone]);

    const sendAnamnesisByWhatsApp = React.useCallback(async () => {
        const token = getAccessToken();
        if (!token) {
            window.dispatchEvent(
                new CustomEvent('systemMessage', {
                    detail: {
                        text: 'Sessão expirada. Faça login novamente para enviar o link.',
                        type: 'error',
                    },
                }),
            );
            return;
        }

        const normalizedPhone = normalizePhoneDigits(client.phone);
        if (!normalizedPhone) {
            window.dispatchEvent(
                new CustomEvent('systemMessage', {
                    detail: {
                        text: 'Telefone do cliente não cadastrado.',
                        type: 'error',
                    },
                }),
            );
            return;
        }

        const phoneE164 = normalizedPhone.startsWith('55')
            ? normalizedPhone
            : `55${normalizedPhone}`;

        setSendingAnamnesisLink(true);
        try {
            const response = await fetch(
                `${API_BASE}/register/clients/${client.id}/generate-anamnesis-token/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Não foi possível gerar o link de anamnese.');
            }

            const data = (await response.json()) as { token?: string };
            if (!data?.token) {
                throw new Error(
                    'Token de anamnese não retornado pelo servidor.',
                );
            }

            const basePublicUrl = resolvePublicAnamnesisBaseUrl();
            const normalizedBase = basePublicUrl.replace(/\/+$/, '');
            const params = new URLSearchParams({
                token: data.token,
                theme,
            });
            const link = `${normalizedBase}/anamnesis/public?${params.toString()}`;

            const resolvedHost =
                parseAbsoluteUrl(normalizedBase)?.hostname || '';
            if (isLocalHostname(resolvedHost)) {
                window.dispatchEvent(
                    new CustomEvent('systemMessage', {
                        detail: {
                            text: 'Link de anamnese gerado com localhost. Para abrir em outro aparelho, configure VITE_PUBLIC_ANAMNESIS_BASE_URL com uma URL acessível (LAN, túnel ou domínio público).',
                            type: 'warning',
                        },
                    }),
                );
            }

            const message = [
                `Olá ${client.first_name}!`,
                '',
                'Para preencher ou atualizar sua ficha, toque no link abaixo:',
                link,
                '',
                'Este link é válido por 1 hora.',
                '',
                'Se não abrir automaticamente, copie e cole o link no navegador.',
            ].join('\n');

            const userAgent =
                typeof navigator !== 'undefined' ? navigator.userAgent : '';
            const isIOSDevice = /iPhone|iPad|iPod/i.test(userAgent);
            const isStandaloneMode =
                (typeof window !== 'undefined' &&
                    window.matchMedia &&
                    window.matchMedia('(display-mode: standalone)').matches) ||
                (typeof navigator !== 'undefined' &&
                    'standalone' in navigator &&
                    (navigator as Navigator & { standalone?: boolean })
                        .standalone === true);
            const whatsappTarget: '_blank' | '_self' =
                isIOSDevice || isStandaloneMode ? '_self' : '_blank';

            const openResult = openWhatsAppInNewTab({
                phoneE164,
                text: message,
                target: whatsappTarget,
            });
            setEditActionsOpen(false);

            window.dispatchEvent(
                new CustomEvent('systemMessage', {
                    detail: {
                        text:
                            openResult === 'opened'
                                ? 'Link de anamnese aberto no WhatsApp.'
                                : 'Pop-up bloqueado pelo navegador. Permita pop-ups para abrir o WhatsApp em nova aba.',
                        type: openResult === 'opened' ? 'success' : 'error',
                    },
                }),
            );
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Falha ao solicitar link de anamnese.';
            window.dispatchEvent(
                new CustomEvent('systemMessage', {
                    detail: { text: message, type: 'error' },
                }),
            );
        } finally {
            setSendingAnamnesisLink(false);
        }
    }, [client.first_name, client.id, client.phone, theme]);

    const requestAnamnesisFromModal = React.useCallback(() => {
        void sendAnamnesisByWhatsApp();
    }, [sendAnamnesisByWhatsApp]);

    return (
        <div
            ref={cardRef}
            className={cardClassNames}
            style={containerStyle}
            onClick={e => {
                // Não disparar onSelect se o clique veio de um botão interno (ex.: Finalizar)
                if ((e.target as HTMLElement).closest('button')) return;
                onSelect?.();
            }}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            onTouchStart={() => setPressed(true)}
            onTouchEnd={() => setPressed(false)}
        >
            {/* Removida barra lateral colorida: foco no esquema de dois tons (borda + fundo) */}
            <div className={styles.infoRow}>
                <div className={styles.rowBaseline}>
                    <span
                        className={styles.label}
                        style={{
                            color: labelColor,
                            fontWeight: 'bold',
                            minWidth: 56,
                        }}
                    >
                        Nome:
                    </span>
                    <span
                        className={styles.value}
                        style={{ color: valueColor, lineHeight: 1.3 }}
                    >
                        {client.first_name} {client.last_name}
                    </span>
                </div>
                <div className={styles.nameActions}>
                    {canAccessTreatmentPlan && (
                        <button
                            className={styles.iconButton}
                            title={
                                isPodology
                                    ? 'Abrir plano de tratamento'
                                    : 'Abrir prontuario odontologico'
                            }
                            onClick={e => {
                                e.stopPropagation();
                                navigate(`/treatment/plans/${client.id}`);
                            }}
                        >
                            {isPodology ? (
                                <FaShoePrints color={iconColor} />
                            ) : (
                                <FaTooth color={iconColor} />
                            )}
                        </button>
                    )}
                    <button
                        className={styles.iconButton}
                        title='Editar cliente'
                        onClick={e => {
                            e.stopPropagation();
                            setEditActionsOpen(true);
                        }}
                    >
                        <FaEdit color={iconColor} />
                    </button>
                    <button
                        className={styles.iconButton}
                        title='Visualizar detalhes'
                        onClick={e => {
                            e.stopPropagation();
                            onView(client);
                        }}
                    >
                        <FaEye color={iconColor} />
                    </button>
                </div>
            </div>

            {ageYears !== null && (
                <div className={styles.infoRow}>
                    <span
                        className={styles.label}
                        style={{ color: labelColor, fontWeight: 'bold' }}
                    >
                        Idade:
                    </span>
                    <span
                        className={styles.value}
                        style={{ color: valueColor }}
                    >
                        {ageYears} anos
                    </span>
                </div>
            )}

            <div className={styles.infoRow}>
                <span
                    className={styles.label}
                    style={{ color: labelColor, fontWeight: 'bold' }}
                >
                    Tel:
                </span>
                <span className={styles.value} style={{ color: valueColor }}>
                    {formatPhone(client.phone)}
                </span>
                <a
                    className={styles.iconButton}
                    title='WhatsApp'
                    href={directWhatsappHref}
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={e => e.stopPropagation()}
                >
                    <FaWhatsapp color={iconColor} />
                </a>
            </div>
            {/* Endereço - inclui número se houver */}
            {client.address && (
                <div className={styles.infoRow}>
                    <span
                        className={styles.label}
                        style={{ color: labelColor, fontWeight: 'bold' }}
                    >
                        Rua:
                    </span>
                    <span
                        className={styles.value}
                        style={{ color: valueColor, lineHeight: 1.3 }}
                    >
                        {client.address}
                        {client.address_number && (
                            <span style={{ marginLeft: 4 }}>
                                Nº {client.address_number}
                            </span>
                        )}
                        {client.address_complement && (
                            <span style={{ marginLeft: 4 }}>
                                — {client.address_complement}
                            </span>
                        )}
                    </span>
                </div>
            )}
            {client.email && client.email.trim() && (
                <div className={styles.infoRow}>
                    <span
                        className={styles.label}
                        style={{
                            color: labelColor,
                            fontWeight: 'bold',
                        }}
                    >
                        E-mail:
                    </span>
                    <span
                        className={styles.value}
                        style={{ color: valueColor }}
                    >
                        {client.email}
                    </span>
                    {/* Email sending removed intentionally */}
                </div>
            )}

            <ClientCardAgendaSection
                client={client}
                notifyAppt={notifyAppt}
                hasAgendaLine={hasAgendaLine}
                isScheduled={isScheduled}
                activeStartISO={activeStartISO}
                activeEndISO={activeEndISO}
                displayStartISO={client.next_appointment_start_at || null}
                futureAppointments={futureAppointments}
                loadingFuture={loadingFuture}
                hideFutureList={hideFutureList}
                createActionAgenda={createActionAgenda}
                createActionFallback={createActionFallback}
                labelColor={labelColor}
                valueColor={valueColor}
                iconColor={iconColor}
                separatorColor={separatorColor}
                separatorOpacity={separatorOpacity}
                onOpenMonthlyAgenda={openGlobalMonthlyAgenda}
                onOpenQuickSchedule={openGlobalQuickSchedule}
                formatDateRange={formatAppointmentDateRange}
            />

            <EditClientActionsModal
                isOpen={editActionsOpen}
                onClose={() => setEditActionsOpen(false)}
                clientName={`${client.first_name} ${client.last_name}`}
                onEditRecord={() => {
                    setEditActionsOpen(false);
                    openEditClientFlow();
                }}
                onRequestAnamnesis={requestAnamnesisFromModal}
                loading={sendingAnamnesisLink}
            />
        </div>
    );
}

function sameNotifyAppt(
    left?: ClientCardProps['notifyAppt'],
    right?: ClientCardProps['notifyAppt'],
) {
    return (
        left?.start_at === right?.start_at &&
        left?.end_at === right?.end_at &&
        left?.title === right?.title
    );
}

export const ClientCard = React.memo(ClientCardBase, (prev, next) => {
    return (
        prev.client === next.client &&
        prev.selected === next.selected &&
        prev.filterMode === next.filterMode &&
        sameNotifyAppt(prev.notifyAppt, next.notifyAppt)
    );
});
