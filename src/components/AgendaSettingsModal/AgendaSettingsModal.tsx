import React from 'react';
import { AppModal } from '../Modal/Modal';
import modalStyles from './AgendaSettingsModal.module.css';
import {
    DEFAULT_AGENDA_SETTINGS,
    type DefaultDuration,
    type DefaultVisitType,
    getAgendaSettingsSnapshot,
    hydrateAgendaSettings,
    saveAgendaSettings,
    startTelegramLink,
    verifyTelegramLink,
    sendTelegramTest,
} from '../../utils/agendaSettings';
import { emit } from '../../events/bus';

interface AgendaSettingsModalProps {
    open: boolean;
    onClose: () => void;
    onApply?: () => void;
}

const durationOptions = [
    30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360,
];
const reminderMinuteOptions = [
    5, 10, 15, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360,
];
const visitTypes = [
    { value: 'consulta', label: 'Consulta' },
    { value: 'avaliacao', label: 'Avaliação' },
    { value: 'retorno', label: 'Retorno' },
    { value: 'procedimento', label: 'Serviço' },
    { value: 'outro', label: 'Outro' },
];

function clampHM(v: string, fallback: string) {
    if (!/^\d{2}:\d{2}$/.test(v)) return fallback;
    const [h, m] = v.split(':').map(n => parseInt(n, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return fallback;
    return `${String(Math.min(23, Math.max(0, h))).padStart(2, '0')}:${String(
        Math.min(59, Math.max(0, m)),
    ).padStart(2, '0')}`;
}

function formatTimeInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function normalizeTimeInput(raw: string, fallback: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length === 0) return fallback;
    if (digits.length === 1) return clampHM(`0${digits}:00`, fallback);
    if (digits.length === 2) return clampHM(`${digits}:00`, fallback);
    if (digits.length === 3) {
        return clampHM(`${digits.slice(0, 2)}:0${digits[2]}`, fallback);
    }
    return clampHM(`${digits.slice(0, 2)}:${digits.slice(2, 4)}`, fallback);
}

const DEFAULTS = DEFAULT_AGENDA_SETTINGS;

function getDurationOptionLabel(minutes: number): string {
    if (minutes === 30) return '30 min (meia hora)';

    const hours = Math.floor(minutes / 60);
    const hasHalf = minutes % 60 === 30;
    const hourLabel = hours === 1 ? '1 hora' : `${hours} horas`;

    if (hasHalf) {
        return `${minutes} min (${hourLabel} e meia)`;
    }

    return `${minutes} min (${hourLabel})`;
}

function getReminderOptionLabel(minutes: number): string {
    if (minutes < 30) return `${minutes} min`;
    if (minutes === 30) return '30 min (meia hora antes)';

    const hours = Math.floor(minutes / 60);
    const hasHalf = minutes % 60 === 30;
    const hourLabel = hours === 1 ? '1 hora' : `${hours} horas`;

    if (hasHalf) {
        return `${minutes} min (${hourLabel} e meia antes)`;
    }

    return `${minutes} min (${hourLabel} antes)`;
}

export const AgendaSettingsModal: React.FC<AgendaSettingsModalProps> = ({
    open,
    onClose,
    onApply,
}) => {
    const [compactViewport, setCompactViewport] = React.useState(false);
    const [workStart, setWorkStart] = React.useState(DEFAULTS.workStart);
    const [workEnd, setWorkEnd] = React.useState(DEFAULTS.workEnd);
    const [workStartInput, setWorkStartInput] = React.useState(
        DEFAULTS.workStart,
    );
    const [workEndInput, setWorkEndInput] = React.useState(DEFAULTS.workEnd);
    const [slotInterval, setSlotInterval] = React.useState(
        DEFAULTS.slotInterval,
    );
    const [defaultDuration, setDefaultDuration] = React.useState(
        DEFAULTS.defaultDuration,
    );
    const [defaultVisitType, setDefaultVisitType] = React.useState(
        DEFAULTS.defaultVisitType,
    );
    const [reminderEnabled, setReminderEnabled] = React.useState(
        DEFAULTS.reminderEnabled,
    );
    const [remindersGloballyEnabled, setRemindersGloballyEnabled] =
        React.useState(DEFAULTS.remindersGloballyEnabled);
    const [telegramLinked, setTelegramLinked] = React.useState(
        DEFAULTS.telegramLinked,
    );
    const [telegramLinkActive, setTelegramLinkActive] = React.useState(
        DEFAULTS.telegramLinkActive,
    );
    const [telegramUsername, setTelegramUsername] = React.useState(
        DEFAULTS.telegramUsername,
    );
    const [telegramLastError, setTelegramLastError] = React.useState(
        DEFAULTS.telegramLastError,
    );
    const [telegramStartUrl, setTelegramStartUrl] = React.useState('');
    const [telegramStartToken, setTelegramStartToken] = React.useState('');
    const [telegramLinkBusy, setTelegramLinkBusy] = React.useState(false);
    const [telegramTestBusy, setTelegramTestBusy] = React.useState(false);
    const [reminderMinutesBefore, setReminderMinutesBefore] = React.useState(
        DEFAULTS.reminderMinutesBefore,
    );
    const [savedMsg, setSavedMsg] = React.useState<string | null>(null);
    const [msgType, setMsgType] = React.useState<'success' | 'error' | null>(
        null,
    );

    const workStartInputRef = React.useRef<HTMLInputElement | null>(null);
    const workEndInputRef = React.useRef<HTMLInputElement | null>(null);
    const hasUserEditedRef = React.useRef(false);

    const selectAllOnFocus = React.useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            e.currentTarget.select();
        },
        [],
    );

    const handleTimeInputChange = React.useCallback(
        (
            field: 'start' | 'end',
            rawValue: string,
            nextRef?: React.RefObject<HTMLInputElement | null>,
        ) => {
            hasUserEditedRef.current = true;
            const formatted = formatTimeInput(rawValue);
            const digits = rawValue.replace(/\D/g, '').slice(0, 4);

            if (field === 'start') setWorkStartInput(formatted);
            else setWorkEndInput(formatted);

            if (digits.length === 4 && nextRef?.current) {
                nextRef.current.focus();
                nextRef.current.select();
            }
        },
        [],
    );

    const commitTimeInput = React.useCallback(
        (field: 'start' | 'end') => {
            if (field === 'start') {
                const normalized = normalizeTimeInput(
                    workStartInput,
                    DEFAULTS.workStart,
                );
                setWorkStart(normalized);
                setWorkStartInput(normalized);
                return;
            }

            const normalized = normalizeTimeInput(
                workEndInput,
                DEFAULTS.workEnd,
            );
            setWorkEnd(normalized);
            setWorkEndInput(normalized);
        },
        [workStartInput, workEndInput],
    );

    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateCompactViewport = () => {
            const vvHeight =
                window.visualViewport?.height ?? window.innerHeight;
            const isNarrow = window.innerWidth <= 640;
            const isShort = vvHeight <= 560;
            setCompactViewport(isNarrow || isShort);
        };

        updateCompactViewport();
        window.addEventListener('resize', updateCompactViewport);
        window.addEventListener('orientationchange', updateCompactViewport);
        window.visualViewport?.addEventListener(
            'resize',
            updateCompactViewport,
        );

        return () => {
            window.removeEventListener('resize', updateCompactViewport);
            window.removeEventListener(
                'orientationchange',
                updateCompactViewport,
            );
            window.visualViewport?.removeEventListener(
                'resize',
                updateCompactViewport,
            );
        };
    }, []);

    React.useEffect(() => {
        if (!open) return;
        let active = true;

        hasUserEditedRef.current = false;
        setSavedMsg(null);
        setMsgType(null);
        setTelegramStartUrl('');
        setTelegramStartToken('');

        const current = getAgendaSettingsSnapshot();
        const currentStart = clampHM(current.workStart, DEFAULTS.workStart);
        const currentEnd = clampHM(current.workEnd, DEFAULTS.workEnd);

        setWorkStart(currentStart);
        setWorkEnd(currentEnd);
        setWorkStartInput(currentStart);
        setWorkEndInput(currentEnd);
        setSlotInterval(current.slotInterval);
        setDefaultDuration(current.defaultDuration);
        setDefaultVisitType(current.defaultVisitType);
        setReminderEnabled(current.reminderEnabled);
        setRemindersGloballyEnabled(current.remindersGloballyEnabled);
        setTelegramLinked(current.telegramLinked);
        setTelegramLinkActive(current.telegramLinkActive);
        setTelegramUsername(current.telegramUsername);
        setTelegramLastError(current.telegramLastError);
        setReminderMinutesBefore(current.reminderMinutesBefore);

        void hydrateAgendaSettings()
            .then(settings => {
                if (!active || hasUserEditedRef.current) return;
                const hydratedStart = clampHM(
                    settings.workStart,
                    DEFAULTS.workStart,
                );
                const hydratedEnd = clampHM(settings.workEnd, DEFAULTS.workEnd);

                setWorkStart(hydratedStart);
                setWorkEnd(hydratedEnd);
                setWorkStartInput(hydratedStart);
                setWorkEndInput(hydratedEnd);
                setSlotInterval(settings.slotInterval);
                setDefaultDuration(settings.defaultDuration);
                setDefaultVisitType(settings.defaultVisitType);
                setReminderEnabled(settings.reminderEnabled);
                setRemindersGloballyEnabled(settings.remindersGloballyEnabled);
                setTelegramLinked(settings.telegramLinked);
                setTelegramLinkActive(settings.telegramLinkActive);
                setTelegramUsername(settings.telegramUsername);
                setTelegramLastError(settings.telegramLastError);
                setReminderMinutesBefore(settings.reminderMinutesBefore);
            })
            .catch(() => {
                /* silencioso */
            });

        return () => {
            active = false;
        };
    }, [open]);

    async function save() {
        const normalizedWorkStart = normalizeTimeInput(
            workStartInputRef.current?.value ?? workStartInput,
            DEFAULTS.workStart,
        );
        const normalizedWorkEnd = normalizeTimeInput(
            workEndInputRef.current?.value ?? workEndInput,
            DEFAULTS.workEnd,
        );

        setWorkStart(normalizedWorkStart);
        setWorkEnd(normalizedWorkEnd);
        setWorkStartInput(normalizedWorkStart);
        setWorkEndInput(normalizedWorkEnd);

        if (normalizedWorkEnd <= normalizedWorkStart) {
            setSavedMsg('Fim deve ser maior que inicio.');
            setMsgType('error');
            return;
        }

        try {
            await saveAgendaSettings({
                workStart: normalizedWorkStart,
                workEnd: normalizedWorkEnd,
                slotInterval,
                defaultDuration,
                defaultVisitType,
                reminderEnabled,
                reminderMinutesBefore,
            });
        } catch (error) {
            setSavedMsg(
                error instanceof Error
                    ? error.message
                    : 'Erro ao salvar configuracoes.',
            );
            setMsgType('error');
            return;
        }

        setSavedMsg(null);
        setMsgType(null);
        emit('systemMessage', {
            text: 'Configuracoes salvas.',
            type: 'success',
        });
        if (onApply) onApply();
    }

    function hasUnsavedChanges() {
        const snapshot = getAgendaSettingsSnapshot();
        const normalizedWorkStart = normalizeTimeInput(
            workStartInput,
            DEFAULTS.workStart,
        );
        const normalizedWorkEnd = normalizeTimeInput(
            workEndInput,
            DEFAULTS.workEnd,
        );
        return (
            normalizedWorkStart !== workStart ||
            normalizedWorkEnd !== workEnd ||
            workStart !== snapshot.workStart ||
            workEnd !== snapshot.workEnd ||
            slotInterval !== snapshot.slotInterval ||
            defaultDuration !== snapshot.defaultDuration ||
            defaultVisitType !== snapshot.defaultVisitType ||
            reminderEnabled !== snapshot.reminderEnabled ||
            reminderMinutesBefore !== snapshot.reminderMinutesBefore
        );
    }

    function handleClose() {
        if (hasUnsavedChanges()) {
            emit('systemMessage', {
                text: 'Alteracoes nao salvas foram descartadas.',
                type: 'info',
            });
        }
        onClose();
    }

    async function handleStartTelegramLink() {
        setTelegramLinkBusy(true);
        try {
            const result = await startTelegramLink();
            if (!result.linkUrl || !result.startToken) {
                throw new Error('Nao foi possivel gerar o link de vinculo.');
            }
            setTelegramStartUrl(result.linkUrl);
            setTelegramStartToken(result.startToken);
            emit('systemMessage', {
                text: 'Link gerado. Abra no Telegram e toque em Iniciar.',
                type: 'info',
            });
            try {
                const opened = window.open(
                    result.linkUrl,
                    '_blank',
                    'noopener,noreferrer',
                );
                if (!opened) {
                    window.location.href = result.linkUrl;
                }
            } catch {
                window.location.href = result.linkUrl;
            }
        } catch (error) {
            emit('systemMessage', {
                text:
                    error instanceof Error
                        ? error.message
                        : 'Erro ao iniciar vínculo com Telegram.',
                type: 'error',
            });
        } finally {
            setTelegramLinkBusy(false);
        }
    }

    function openTelegramLink(url: string) {
        if (!url) return;
        try {
            const opened = window.open(url, '_blank', 'noopener,noreferrer');
            if (!opened) {
                window.location.href = url;
            }
        } catch {
            window.location.href = url;
        }
    }

    async function copyTelegramLink(url: string) {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            emit('systemMessage', {
                text: 'Link copiado.',
                type: 'success',
            });
        } catch {
            emit('systemMessage', {
                text: 'Nao foi possivel copiar automaticamente.',
                type: 'warning',
            });
        }
    }

    async function handleSendTelegramTest() {
        setTelegramTestBusy(true);
        try {
            await sendTelegramTest();
            emit('systemMessage', {
                text: 'Mensagem de teste enviada com sucesso!',
                type: 'success',
            });
        } catch (error) {
            emit('systemMessage', {
                text:
                    error instanceof Error
                        ? error.message
                        : 'Erro ao enviar teste.',
                type: 'error',
            });
        } finally {
            setTelegramTestBusy(false);
        }
    }

    async function handleVerifyTelegramLink() {
        if (!telegramStartToken) {
            emit('systemMessage', {
                text: 'Primeiro gere o link de conexao do Telegram.',
                type: 'warning',
            });
            return;
        }
        setTelegramLinkBusy(true);
        try {
            const snapshot = await verifyTelegramLink(telegramStartToken);
            setReminderEnabled(snapshot.reminderEnabled);
            setRemindersGloballyEnabled(snapshot.remindersGloballyEnabled);
            setTelegramLinked(snapshot.telegramLinked);
            setTelegramLinkActive(snapshot.telegramLinkActive);
            setTelegramUsername(snapshot.telegramUsername);
            setTelegramLastError(snapshot.telegramLastError);
            emit('systemMessage', {
                text: 'Telegram conectado com sucesso.',
                type: 'success',
            });
        } catch (error) {
            emit('systemMessage', {
                text:
                    error instanceof Error
                        ? error.message
                        : 'Ainda nao foi possivel confirmar o vinculo.',
                type: 'warning',
            });
        } finally {
            setTelegramLinkBusy(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            void save();
        }
    }

    const telegramConnected = telegramLinked && telegramLinkActive;
    const telegramStatusLabel = telegramConnected
        ? 'Conectado'
        : telegramStartToken
          ? 'Pendente de confirmação'
          : 'Não conectado';

    return (
        <AppModal
            open={open}
            onClose={onClose}
            closeOnEnter={false}
            fullScreen={compactViewport}
            maxHeightVh={96}
            unmountOnClose
        >
            <form
                className={modalStyles.container}
                onKeyDown={handleKeyDown}
                onSubmit={e => {
                    e.preventDefault();
                    void save();
                }}
            >
                <h2 className={modalStyles.header}>Notificações e Agenda</h2>
                <div className={modalStyles.formGrid}>
                    <div className={modalStyles.timeRow}>
                        <div className={modalStyles.fieldGroup}>
                            <label
                                htmlFor='agenda-workStart'
                                className={modalStyles.label}
                            >
                                Início expediente
                            </label>
                            <input
                                id='agenda-workStart'
                                ref={workStartInputRef}
                                type='text'
                                inputMode='numeric'
                                enterKeyHint='next'
                                pattern='[0-9:]*'
                                maxLength={5}
                                className={modalStyles.input}
                                placeholder='06:00'
                                value={workStartInput}
                                onChange={e =>
                                    handleTimeInputChange(
                                        'start',
                                        e.target.value,
                                        workEndInputRef,
                                    )
                                }
                                onBlur={() => commitTimeInput('start')}
                                onFocus={selectAllOnFocus}
                            />
                        </div>
                        <div className={modalStyles.fieldGroup}>
                            <label
                                htmlFor='agenda-workEnd'
                                className={modalStyles.label}
                            >
                                Fim expediente
                            </label>
                            <input
                                id='agenda-workEnd'
                                ref={workEndInputRef}
                                type='text'
                                inputMode='numeric'
                                enterKeyHint='done'
                                pattern='[0-9:]*'
                                maxLength={5}
                                className={modalStyles.input}
                                placeholder='21:00'
                                value={workEndInput}
                                onChange={e =>
                                    handleTimeInputChange('end', e.target.value)
                                }
                                onBlur={() => commitTimeInput('end')}
                                onFocus={selectAllOnFocus}
                            />
                        </div>
                    </div>

                    <div className={modalStyles.inlineRow}>
                        <div className={modalStyles.fieldGroup}>
                            <label
                                htmlFor='agenda-defaultDuration'
                                className={modalStyles.label}
                            >
                                Duração padrão
                            </label>
                            <select
                                id='agenda-defaultDuration'
                                className={modalStyles.select}
                                value={defaultDuration}
                                onChange={e =>
                                    setDefaultDuration(
                                        parseInt(
                                            e.target.value,
                                            10,
                                        ) as DefaultDuration,
                                    )
                                }
                            >
                                {durationOptions.map(i => (
                                    <option key={i} value={i}>
                                        {getDurationOptionLabel(i)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={modalStyles.fieldGroup}>
                            <label
                                htmlFor='agenda-defaultVisitType'
                                className={modalStyles.label}
                            >
                                Tipo padrão
                            </label>
                            <select
                                id='agenda-defaultVisitType'
                                className={modalStyles.select}
                                value={defaultVisitType}
                                onChange={e =>
                                    setDefaultVisitType(
                                        e.target.value as DefaultVisitType,
                                    )
                                }
                            >
                                {visitTypes.map(v => (
                                    <option key={v.value} value={v.value}>
                                        {v.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={modalStyles.telegramSection}>
                    <p className={modalStyles.telegramTitle}>
                        Lembretes Telegram
                    </p>
                    <p className={modalStyles.telegramSubtitle}>
                        Ative os lembretes, conecte sua conta e valide com um
                        teste.
                    </p>

                    <div className={modalStyles.telegramStepCard}>
                        <div className={modalStyles.telegramStepHeader}>
                            <span className={modalStyles.telegramStepTitle}>
                                1. Receber lembretes
                            </span>
                            <button
                                type='button'
                                role='switch'
                                aria-checked={reminderEnabled}
                                className={
                                    reminderEnabled
                                        ? `${modalStyles.switchButton} ${modalStyles.switchButtonOn}`
                                        : `${modalStyles.switchButton} ${modalStyles.switchButtonOff}`
                                }
                                onClick={() =>
                                    setReminderEnabled(prev => !prev)
                                }
                            >
                                <span
                                    className={
                                        reminderEnabled
                                            ? `${modalStyles.switchKnob} ${modalStyles.switchKnobOn}`
                                            : `${modalStyles.switchKnob} ${modalStyles.switchKnobOff}`
                                    }
                                />
                                <span className={modalStyles.switchText}>
                                    {reminderEnabled ? 'Ativado' : 'Desativado'}
                                </span>
                            </button>
                        </div>

                        <div className={modalStyles.inlineTelegramSelect}>
                            <label
                                htmlFor='agenda-reminderMinutesBefore'
                                className={modalStyles.label}
                            >
                                Antecedência do lembrete (min)
                            </label>
                            <select
                                id='agenda-reminderMinutesBefore'
                                className={modalStyles.select}
                                value={reminderMinutesBefore}
                                disabled={!reminderEnabled}
                                onChange={e =>
                                    setReminderMinutesBefore(
                                        parseInt(e.target.value, 10),
                                    )
                                }
                            >
                                {reminderMinuteOptions.map(i => (
                                    <option key={i} value={i}>
                                        {getReminderOptionLabel(i)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={modalStyles.telegramStepCard}>
                        <div className={modalStyles.telegramStatusRow}>
                            <span className={modalStyles.telegramStepTitle}>
                                2. Conectar Telegram
                            </span>
                            <strong
                                className={
                                    telegramConnected
                                        ? modalStyles.telegramStatusConnected
                                        : modalStyles.telegramStatusDisconnected
                                }
                            >
                                {telegramStatusLabel}
                            </strong>
                        </div>

                        <div className={modalStyles.telegramActionRow}>
                            <button
                                type='button'
                                className='ui-btn ui-btn--theme'
                                onClick={() => {
                                    void handleStartTelegramLink();
                                }}
                                disabled={telegramLinkBusy}
                            >
                                Conectar Telegram
                            </button>
                            <button
                                type='button'
                                className='ui-btn ui-btn--secondary'
                                onClick={() => {
                                    void handleVerifyTelegramLink();
                                }}
                                disabled={
                                    telegramLinkBusy || !telegramStartToken
                                }
                            >
                                Verificar conexão
                            </button>
                            <button
                                type='button'
                                className='ui-btn ui-btn--secondary'
                                onClick={() => {
                                    void handleSendTelegramTest();
                                }}
                                disabled={
                                    telegramTestBusy || !telegramConnected
                                }
                                title={
                                    !telegramConnected
                                        ? 'Conecte o Telegram primeiro'
                                        : ''
                                }
                            >
                                {telegramTestBusy
                                    ? 'Enviando...'
                                    : 'Enviar teste'}
                            </button>
                        </div>

                        {!!telegramStartUrl && !telegramConnected && (
                            <div className={modalStyles.telegramHelperRow}>
                                <button
                                    type='button'
                                    className='ui-btn ui-btn--neutral'
                                    onClick={() =>
                                        openTelegramLink(telegramStartUrl)
                                    }
                                >
                                    Abrir Telegram
                                </button>
                                <button
                                    type='button'
                                    className='ui-btn ui-btn--neutral'
                                    onClick={() => {
                                        void copyTelegramLink(telegramStartUrl);
                                    }}
                                >
                                    Copiar link de conexão
                                </button>
                            </div>
                        )}

                        {telegramUsername && (
                            <small className={modalStyles.smallNote}>
                                Conta conectada: @{telegramUsername}
                            </small>
                        )}
                        {!!telegramLastError && (
                            <small className={modalStyles.telegramErrorNote}>
                                Último erro: {telegramLastError}
                            </small>
                        )}
                    </div>

                    {!remindersGloballyEnabled && (
                        <div className={modalStyles.telegramEnvironmentWarning}>
                            O envio global de lembretes está desativado no
                            ambiente. Mesmo ativando aqui, as mensagens não
                            serão enviadas até essa liberação.
                        </div>
                    )}
                </div>

                <div
                    className={modalStyles.messageArea}
                    role='status'
                    aria-live='polite'
                >
                    <div
                        className={[
                            modalStyles.statusMessage,
                            savedMsg ? ' ' + modalStyles.visible : '',
                            msgType === 'success'
                                ? ' ' + modalStyles.statusSuccess
                                : '',
                            msgType === 'error'
                                ? ' ' + modalStyles.statusError
                                : '',
                        ].join('')}
                    >
                        {savedMsg || ''}
                    </div>
                </div>

                <div className={modalStyles.buttonBar}>
                    <button type='submit' className='ui-btn ui-btn--theme'>
                        Salvar
                    </button>
                    <button
                        type='button'
                        className='ui-btn ui-btn--neutral'
                        onClick={handleClose}
                    >
                        Fechar
                    </button>
                </div>
            </form>
        </AppModal>
    );
};
