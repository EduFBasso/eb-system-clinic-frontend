// frontend/src/components/ClientCard.tsx
import React from 'react';
import { focusClientCard } from '../../utils/focusClientCard';
import styles from './ClientCard.module.css';
import { FaEye, FaWhatsapp, FaTooth } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useClientCreateAction } from '../../hooks/useClientCreateAction';
import { API_BASE } from '../../config/api';
import type { Appointment } from '../../hooks/useAppointments';
import type { ClientBasic } from '../../types/ClientBasic';
import { formatPhone } from '../../utils/formatPhone';
import { FaEdit } from 'react-icons/fa';
import '../../styles/palette.css';
import { parseDOB, calcAge } from '../../utils/dateOfBirth';
import { useClientCardStyle } from '../clientCard/useClientCardStyle';
// PendingActionsModal é gerenciado globalmente (Home) via evento 'pendingActions:open'
import { useClientPendingState } from '../../hooks/useClientPendingState';
import { useClientCardFocusScroll } from '../clientCard/useClientCardFocusScroll';
import { useClientFutureAppointments } from '../../domain/futureAppointments';
// (hysteresis & appointment state consolidated inside hooks)
import { useFinalizeAppointment } from '../../hooks/useFinalizeAppointment';
// Replaced latch/snapshot/sweep logic by consolidated hook
import { useClientOngoingState } from '../../hooks/useClientOngoingState';
import { formatAppointmentDateRange } from '../../utils/agendaPresentation';
import { openClientForm } from '../../utils/openClientForm';
import { useNowTick } from '../../hooks/useNowTick';
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
    /** Dados do compromisso pendente para exibir data/hora no card pending. */
    pendingAppt?: { start_at?: string; end_at?: string };
    /** Modo de filtro ativo. Quando 'today' ou 'tomorrow', o card exibe apenas o dia filtrado. */
    filterMode?: 'all' | 'pending' | 'today' | 'tomorrow';
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
    pendingAppt,
    filterMode = 'all',
}: ClientCardProps) {
    const navigate = useNavigate();
    const { theme } = useTheme();
    // Feature flag: disable per-client ongoing probe unless explicitly enabled (reduces debug traffic)
    const ENABLE_ONGOING_PROBE =
        (import.meta as ImportMeta).env.VITE_ENABLE_ONGOING_PROBE === 'true';
    const isScheduled = client.next_appointment_status === 'scheduled';
    // Futuros agora gerenciados por hook dedicado
    const { futureAppointments, loadingFuture, dynLimit } =
        useClientFutureAppointments({ client, isScheduled });
    const [pressed, setPressed] = React.useState(false);
    const { finishing, finalize } = useFinalizeAppointment(client.id);
    // Suprimir visual de "em andamento" por alguns segundos após finalizar/cancelar
    // suppressOngoingUntil removido (gestão dentro do hook de ongoing)
    // Tick a cada 5 s para refletir mudanças de estado (scheduled→ongoing) sem interação do usuário
    const now = useNowTick(5000);
    // Removed resumeGrace (was used for previous ongoing suppression logic)
    // const resumeGrace = useVisibilityResumeGrace(30000);
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
    const canAccessOdontoArcade = React.useMemo(() => {
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
                specialty.includes('ortodont')
            );
        } catch {
            return false;
        }
    }, []);
    // isScheduled já definido acima (reordenado para hook de futuros)
    // Base: informações vindas do servidor (se disponíveis)
    // startISO / endISO no longer directly used after ongoing refactor
    // const startISO = client.next_appointment_start_at ?? null;
    // const endISO = client.next_appointment_end_at ?? null;
    const {
        isOngoing,
        // isOngoingRaw (raw signal) not needed in card after refactor
        displayStartISO,
        displayEndISO,
        effectiveApptId,
        afterFinalizeSuccess,
    } = useClientOngoingState({
        client,
        now,
        enableProbe: ENABLE_ONGOING_PROBE,
        debug: false,
    });

    // Quando tivermos uma janela confiável e status scheduled, usamos o hook compartilhado
    // legacy variables now derived via hook (kept for potential future use) startISO/endISO still used for future fetch logic

    // Preferir dados confiáveis do servidor OU da varredura global quando houver janela atual
    // Se houver um agendamento em andamento detectado pela varredura (windowFromOverride),
    // usamos esse horário/ID em prioridade para refletir corretamente o estado "Em andamento".
    // removed: local derivations now handled by useClientOngoingState

    // Auto-clear latch some time after the end to avoid sticky ongoing if finalize didn't fire
    // removed auto-clear effect (handled inside hook)

    // Novo: limpar latch imediatamente se detectarmos que o appointment latched foi finalizado/cancelado, expirado ou janela deixou de ser confiável
    // removed immediate-clear effect (handled in hook)

    // On resume (visibility/pageshow), refresh local latched state from storage in case iOS flushed memory
    // removed visibility storage refresh (handled in hook)

    // Aplicar histerese visual: aguarda 250ms para entrar em ongoing; saída é imediata
    // hysteresis now inside hook (isOngoing already stabilized)

    // Instrumentação de diagnóstico opcional: loga decisão de ongoing/latch
    // removed debug effect (handled via hook's debug option)

    // Telemetry: entering ongoing window
    // removed telemetry enter effect (done inside hook)

    // Hook centralizado de pendência
    const {
        effectivePending: isPending,
        openPendingActions,
        tryOpenPendingElseQuick,
    } = useClientPendingState({
        client,
        now,
        probeEnabled: ENABLE_ONGOING_PROBE,
    });

    // Mostrar seção de agenda somente se há algo concreto (agendamento atual ou em andamento) ou futuros carregados.
    // Estado pendente isolado não exibe cabeçalho/tipo para manter UI minimalista.
    // Agenda line (tipo / horário) é suprimida se pendente para manter visual minimalista.
    // Porém queremos ainda exibir a linha 'Data:' com o botão Solucionar mesmo que haja um agendamento (scheduled+pending).
    // Regra revisada:
    //  - Quando pendente: não mostramos linha de agenda nem linha Data (substituímos por bloco compacto de pendência)
    //  - Linha de agenda aparece apenas se há scheduled ativo, em andamento ou futuros E não está pendente
    // isTomorrowFilter / effectiveOngoing declarados aqui porque hasAgendaLine (abaixo) os usa
    const isTomorrowFilter = filterMode === 'tomorrow' && !!notifyAppt;
    const effectiveOngoing = isOngoing && !isTomorrowFilter;

    const hasAgendaLine =
        (isScheduled || effectiveOngoing || futureAppointments.length > 0) &&
        !isPending;

    // Ações unificadas (+) para agenda e fallback
    const createActionAgenda = useClientCreateAction({
        isOngoing,
        isPending,
        futureAppointmentsCount: futureAppointments.length,
        isScheduled,
        dynLimit,
        openPendingActions,
        tryOpenPendingElseQuick,
        setEditing: () => {
            /* noop: scheduling flow is hosted globally in Home */
        },
        openQuick: () => openGlobalQuickSchedule(),
        baseTitle: 'Novo agendamento',
    });
    const createActionFallback = useClientCreateAction({
        isOngoing,
        isPending,
        futureAppointmentsCount: futureAppointments.length,
        isScheduled,
        dynLimit,
        openPendingActions,
        tryOpenPendingElseQuick,
        setEditing: () => {
            /* noop: scheduling flow is hosted globally in Home */
        },
        openQuick: () => openGlobalQuickSchedule(),
        baseTitle: 'Agendar',
    });
    // Estilos centralizados via hook: mantém regra de cartão branco durante atendimento
    const {
        containerStyle,
        labelColor,
        iconColor,
        valueColor,
        separatorColor,
        separatorOpacity,
    } = useClientCardStyle({
        isOngoing: effectiveOngoing,
        selected,
        pressed,
        isScheduled,
        isPending,
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
    // PendingActions global — sem necessidade de listener local

    // Finalização com encapsulamento via hook
    const finalizeEarlyAware = React.useCallback(async () => {
        const apptId = effectiveApptId;
        if (!apptId) return;
        const ok = await finalize(apptId, {
            preferEarly: isOngoing,
            openPendingAfter: async () => {
                await tryOpenPendingElseQuick(() => {});
            },
        });
        if (ok) {
            afterFinalizeSuccess();
            // Rola e foca o card após fechar o modal de finalização (mesmo padrão da notificação push)
            focusClientCard(client.id, { delayMs: 400 });
        }
    }, [
        effectiveApptId,
        isOngoing,
        finalize,
        tryOpenPendingElseQuick,
        afterFinalizeSuccess,
        client.id,
    ]);
    // Fechar modo edição ao clicar fora do card
    // Efeito de clique fora removido enquanto editor inline está desativado
    // Borda e fundo já definidos no hook (containerStyle)
    // title display moved into the agenda section below when scheduled
    // Flash visual ao focar/entrar em andamento removido — mantemos apenas seleção + scroll
    useClientCardFocusScroll({
        clientId: client.id,
        cardRef,
        onSelect,
        futureAppointmentsCount: futureAppointments.length,
        isOngoing,
        isScheduled,
    });

    // Inline effect de futuros removido (substituído pelo hook)

    // Clear ongoing visual immediately when a targeted event is dispatched (same-tab UX)
    // Clear ongoing event handling moved to hook; listener removed

    // Quando o filtro ativo é 'tomorrow' e temos o agendamento de amanhã, usamos seus dados
    // para o bloco "Data:" e o botão "Avisar" — substituindo os dados de hoje.
    // (isTomorrowFilter e effectiveOngoing já declarados acima, antes de hasAgendaLine)
    const activeStartISO = isTomorrowFilter
        ? (notifyAppt?.start_at ?? null)
        : displayStartISO || client.next_appointment_start_at || null;
    const activeEndISO = isTomorrowFilter
        ? (notifyAppt?.end_at ?? null)
        : displayEndISO || client.next_appointment_end_at || null;
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
                    {canAccessOdontoArcade && (
                        <button
                            className={styles.iconButton}
                            title='Abrir prontuario odontologico'
                            onClick={e => {
                                e.stopPropagation();
                                navigate(`/odonto/arcada/${client.id}`);
                            }}
                        >
                            <FaTooth color={iconColor} />
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
                pendingAppt={pendingAppt}
                hasAgendaLine={hasAgendaLine}
                isScheduled={isScheduled}
                isPending={isPending}
                isOngoing={isOngoing}
                effectiveOngoing={effectiveOngoing}
                activeStartISO={activeStartISO}
                activeEndISO={activeEndISO}
                displayStartISO={displayStartISO}
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
                finishing={finishing}
                effectiveApptId={effectiveApptId}
                onFinalize={finalizeEarlyAware}
                onOpenMonthlyAgenda={openGlobalMonthlyAgenda}
                onOpenQuickSchedule={openGlobalQuickSchedule}
                onSolvePending={async () => {
                    try {
                        onSelect?.();
                    } catch {
                        /* noop */
                    }
                    await tryOpenPendingElseQuick(
                        () => {
                            /* noop fallback */
                        },
                        {
                            kind: 'home',
                            clientId: client.id,
                        },
                    );
                }}
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
