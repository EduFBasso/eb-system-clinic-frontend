// Detecta se está em dispositivo mobile
function isMobileDevice() {
    return (
        typeof window !== 'undefined' &&
        /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
            window.navigator.userAgent,
        )
    );
}
// frontend\src\components\NavBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AboutModal } from '../AboutModal/AboutModal';
import TreatmentPlanCreateModal from '../Shared/TreatmentPlanCreateModal/TreatmentPlanCreateModal';
import { SessionExpiredModal } from '../SessionExpiredModal/SessionExpiredModal';
import { API_BASE } from '../../config/api';
import { openClientForm } from '../../utils/openClientForm';
import { getOrCreateDeviceId } from '../../utils/device';
import { startPerformanceSpan } from '../../utils/telemetry';
type VerifyResponse = {
    access?: string;
    refresh?: string;
    professional?: Professional;
    // Dados comerciais/políticas Odonto do tenant ativo (endereço etc.).
    tenant?: Professional['tenant'];
    active_sessions_count?: number;
    device_id?: string;
    message?: string;
};
import type { Professional } from '../../types/models';
import styles from './NavBar.module.css';
import { AgendaSettingsModal } from '../AgendaSettingsModal/AgendaSettingsModal';
// formatTime removido: não exibimos mais relógio no header
import { AppModal } from '../Modal/Modal';
import '../../styles/modal-message.css';
import { isTokenExpired } from '../../utils/jwt';
import { extractApiErrorMessage } from '../../utils/apiFetch';
import { emit, on } from '../../events/bus';
import {
    clearStoredAuth,
    dispatchLogout,
    hasActiveSession,
    getAccessToken,
} from '../../utils/auth/session';
import { useNavigate } from 'react-router-dom';
import { resolveClinicTenantSlug } from '../../config/tenant';

interface NavBarProps {
    openNewClientModal?: () => void;
    selectedClientId?: number | null;
    agendaOpeners?: {
        openWeekly: (date?: Date) => void | Promise<void>;
    };
}

export const NavBar: React.FC<NavBarProps> = ({
    openNewClientModal,
    selectedClientId,
    agendaOpeners,
}) => {
    const navigate = useNavigate();

    // Viewport listener removido (usado apenas pelo relógio)
    const [loginEmail, setLoginEmail] = useState<string>(() => {
        const tenantSlug = resolveClinicTenantSlug() ?? 'unknown';
        return localStorage.getItem(`clinic:lastLogin:${tenantSlug}`) ?? '';
    });
    const [loginPassword, setLoginPassword] = useState('');
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loggedProfessional, setLoggedProfessional] =
        useState<Professional | null>(() => {
            const stored = localStorage.getItem('loggedProfessional');
            return stored ? JSON.parse(stored) : null;
        });

    // Dropdown state
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    // Agenda dropdown state
    const [agendaDropdownOpen, setAgendaDropdownOpen] = useState(false);
    const agendaDropdownRef = useRef<HTMLDivElement>(null);
    // Consulta dropdown state
    const [consultaDropdownOpen, setConsultaDropdownOpen] = useState(false);
    const consultaDropdownRef = useRef<HTMLDivElement>(null);
    const loginButtonRef = useRef<HTMLButtonElement>(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    // Modal de decisão para Novo Compromisso quando já existe um ativo
    // Estados de decisão de novo compromisso removidos após simplificação do menu
    // Modal configurações agenda
    const [agendaSettingsOpen, setAgendaSettingsOpen] = useState(false);

    // About modal state
    const [aboutOpen, setAboutOpen] = useState(false);
    const [clinicProfileOpen, setClinicProfileOpen] = useState(false);

    // Estado para modal de sessão expirada
    const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);
    const [sessionExpiredMessage, setSessionExpiredMessage] = useState(
        'Sua sessão expirou. Por favor, faça login novamente.',
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;

            if (dropdownRef.current && !dropdownRef.current.contains(target)) {
                setDropdownOpen(false);
            }
            if (
                agendaDropdownRef.current &&
                !agendaDropdownRef.current.contains(target)
            ) {
                setAgendaDropdownOpen(false);
            }
            if (
                consultaDropdownRef.current &&
                !consultaDropdownRef.current.contains(target)
            ) {
                setConsultaDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef, agendaDropdownRef, consultaDropdownRef]);

    useEffect(() => {
        const token = getAccessToken();
        if (isTokenExpired(token)) {
            clearStoredAuth({ clearNewClientId: false });
            setLoggedProfessional(null);
        } else {
            const stored = localStorage.getItem('loggedProfessional');
            if (stored) setLoggedProfessional(JSON.parse(stored));
        }
    }, []);

    useEffect(() => {
        const disposeLogin = on('auth:login', () => {
            try {
                const stored = localStorage.getItem('loggedProfessional');
                setLoggedProfessional(stored ? JSON.parse(stored) : null);
            } catch {
                setLoggedProfessional(null);
            }
            setSessionExpiredOpen(false);
            setSessionExpiredMessage(
                'Sua sessão expirou. Por favor, faça login novamente.',
            );
        });

        const disposeLogout = on('auth:logout', detail => {
            setLoggedProfessional(null);
            setLoginPassword('');
            setDropdownOpen(false);
            setAgendaDropdownOpen(false);
            setConsultaDropdownOpen(false);

            if (detail?.reason && detail.reason !== 'manual') {
                setSessionExpiredMessage(
                    'Sua sessão expirou. Faça login novamente para continuar usando agenda, notificações e ações protegidas.',
                );
                setSessionExpiredOpen(true);
            }
        });

        return () => {
            disposeLogin();
            disposeLogout();
        };
    }, []);

    const openSessionExpiredState = React.useCallback(
        (
            reason: 'session_expired' = 'session_expired',
        ) => {
            dispatchLogout(reason);
        },
        [],
    );

    const toggleProtectedDropdown = React.useCallback(
        (toggle: React.Dispatch<React.SetStateAction<boolean>>) => {
            if (!hasActiveSession()) {
                openSessionExpiredState();
                return;
            }

            toggle(open => !open);
        },
        [openSessionExpiredState],
    );

    // Handler para abrir modal de novo cliente (integração futura)
    // ...existing code...

    function handleNewClient() {
        setDropdownOpen(false);
        if (!hasActiveSession()) {
            openSessionExpiredState();
            return;
        }
        if (openNewClientModal && isMobileDevice()) {
            // Caso específico: se houver modal especial mobile
            openNewClientModal();
            return;
        }
        openClientForm({});
    }

    // Handler para editar cliente (integração futura)
    // Função removida (duplicada)

    function handleEditClient() {
        setDropdownOpen(false);
        if (!selectedClientId) {
            alert('Selecione um cliente antes de editar.');
            return;
        }
        openClientForm({ id: selectedClientId });
    }

    return (
        <div className={styles.navBar}>
            <div className={styles.menuContainer}>
                <div className={styles.dropdownWrapper} ref={dropdownRef}>
                    <button
                        className={styles.menuButton}
                        onClick={() => {
                            if (!hasActiveSession()) {
                                openSessionExpiredState();
                                return;
                            }
                            setDropdownOpen(open => !open);
                        }}
                        aria-haspopup='true'
                        aria-expanded={dropdownOpen}
                    >
                        👤 Clientes
                        <span className={styles.caret}>▼</span>
                    </button>
                    {dropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            <button
                                className={styles.dropdownItem}
                                onClick={handleNewClient}
                            >
                                Novo
                            </button>
                            <button
                                className={styles.dropdownItem}
                                onClick={handleEditClient}
                            >
                                Editar
                            </button>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setDropdownOpen(false);
                                    setAboutOpen(true);
                                }}
                            >
                                Tema
                            </button>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setDropdownOpen(false);
                                    setClinicProfileOpen(true);
                                }}
                            >
                                Editar Dados da Clínica
                            </button>
                            {/* Opções adicionais removidas para simplificar o menu de Clientes */}
                        </div>
                    )}
                </div>
                {/* Agenda dropdown reintroduzido */}
                <div className={styles.dropdownWrapper} ref={agendaDropdownRef}>
                    <button
                        className={styles.menuButton}
                        onClick={() =>
                            toggleProtectedDropdown(setAgendaDropdownOpen)
                        }
                        aria-haspopup='true'
                        aria-expanded={agendaDropdownOpen}
                    >
                        📆 Agenda <span className={styles.caret}>▼</span>
                    </button>
                    {agendaDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setAgendaDropdownOpen(false);
                                    if (!hasActiveSession()) {
                                        openSessionExpiredState();
                                        return;
                                    }
                                    // Abrir agenda diária via evento (usar {} para evitar access de propriedades em undefined no handler)
                                    emit('openDailyAgenda', {});
                                }}
                            >
                                Agenda Diária
                            </button>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setAgendaDropdownOpen(false);
                                    if (!hasActiveSession()) {
                                        openSessionExpiredState();
                                        return;
                                    }
                                    const now = new Date();
                                    if (agendaOpeners) {
                                        agendaOpeners.openWeekly(now);
                                    } else {
                                        emit('openDailyAgenda', {});
                                    }
                                }}
                            >
                                Agenda
                            </button>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setAgendaDropdownOpen(false);
                                    setAgendaSettingsOpen(true);
                                }}
                            >
                                Notificações
                            </button>
                        </div>
                    )}
                </div>
                <div
                    className={styles.dropdownWrapper}
                    ref={consultaDropdownRef}
                >
                    <button
                        className={styles.menuButton}
                        onClick={() =>
                            toggleProtectedDropdown(setConsultaDropdownOpen)
                        }
                        aria-haspopup='true'
                        aria-expanded={consultaDropdownOpen}
                    >
                        🩺 Catálogo <span className={styles.caret}>▼</span>
                    </button>
                    {consultaDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setConsultaDropdownOpen(false);
                                    if (!hasActiveSession()) {
                                        openSessionExpiredState();
                                        return;
                                    }
                                    navigate('/catalog/services');
                                }}
                                title='Tratamentos'
                            >
                                📋 Tratamentos
                            </button>
                            <button
                                className={styles.dropdownItem}
                                onClick={() => {
                                    setConsultaDropdownOpen(false);
                                    if (!hasActiveSession()) {
                                        openSessionExpiredState();
                                        return;
                                    }
                                    navigate('/catalog/products');
                                }}
                                title='Produtos'
                            >
                                📦 Produtos
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de decisão removido */}
            <AgendaSettingsModal
                open={agendaSettingsOpen}
                onClose={() => setAgendaSettingsOpen(false)}
                onApply={() => {
                    // Broadcast para outros componentes recalcularem intervalos ou defaults
                    try {
                        window.dispatchEvent(
                            new CustomEvent('agendaSettingsUpdated'),
                        );
                    } catch {
                        /* noop */
                    }
                }}
            />

            <div className={styles.loginContainer}>
                {loggedProfessional ? (
                    <div className={styles.loggedInfo}>
                        <div className={styles.proNameBlock}>
                            <span className={styles.nameLine}>
                                Olá, {loggedProfessional.first_name}
                            </span>
                        </div>
                        <button
                            className={
                                styles.loginButton + ' ' + styles.logoutButton
                            }
                            onClick={() => {
                                setLoggedProfessional(null);
                                setLoginEmail('');
                                setLoginPassword('');
                                dispatchLogout('manual');
                            }}
                        >
                            Sair
                        </button>
                    </div>
                ) : (
                    <div className={styles.passBlock}>
                        <div className={styles.passInlineRow}>
                            <input
                                type='text'
                                name='clinic-login'
                                placeholder='Apelido ou e-mail'
                                className={styles.loginInput}
                                value={loginEmail}
                                onChange={e => setLoginEmail(e.target.value)}
                                autoComplete='username'
                                autoCorrect='off'
                                autoCapitalize='off'
                                spellCheck={false}
                            />
                            <input
                                type='password'
                                name='clinic-password'
                                placeholder='Senha'
                                className={styles.loginInput}
                                value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                autoComplete='current-password'
                                autoCorrect='off'
                                autoCapitalize='off'
                                spellCheck={false}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        loginButtonRef.current?.click();
                                    }
                                }}
                            />
                        </div>
                        <button
                            ref={loginButtonRef}
                            className={`${styles.loginButton} ${styles.enterButton}`}
                            disabled={loadingLogin || !loginPassword}
                            aria-busy={loadingLogin}
                            onClick={async () => {
                                setLoadingLogin(true);
                                try {
                                    const deviceIdKey = 'device_id';
                                    const deviceId =
                                        getOrCreateDeviceId(deviceIdKey);
                                    const tenantSlug =
                                        resolveClinicTenantSlug();
                                    if (!tenantSlug) {
                                        setModalMessage(
                                            'Acesso bloqueado: domínio da clínica não reconhecido.',
                                        );
                                        setModalOpen(true);
                                        setLoadingLogin(false);
                                        return;
                                    }
                                    const finishLoginPerformance =
                                        startPerformanceSpan('api:token');
                                    let res: Response;
                                    try {
                                        res = await fetch(
                                            `${API_BASE}/token/`,
                                            {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type':
                                                        'application/json',
                                                },
                                                body: JSON.stringify({
                                                    login: loginEmail,
                                                    password: loginPassword,
                                                    device_id: deviceId,
                                                    tenant_slug: tenantSlug,
                                                }),
                                            },
                                        );
                                    } catch (error) {
                                        finishLoginPerformance({
                                            ok: false,
                                            error:
                                                error instanceof Error
                                                    ? error.message
                                                    : String(error),
                                        });
                                        throw error;
                                    }
                                    finishLoginPerformance({
                                        ok: res.ok,
                                        status: res.status,
                                    });
                                    let data: VerifyResponse = {};
                                    try {
                                        data = await res.json();
                                    } catch {
                                        data = {
                                            message:
                                                'Falha ao interpretar resposta do servidor',
                                        };
                                    }
                                    if (res.ok && data.access) {
                                        setModalMessage(
                                            'Login realizado! Dados dos clientes liberados.',
                                        );
                                        setModalOpen(true);
                                        localStorage.setItem(
                                            'accessToken',
                                            data.access,
                                        );
                                        setLoginPassword('');
                                        // Endereço/políticas vêm do tenant; CNPJ vem do professional.
                                        const loggedProfessionalData =
                                            data.professional
                                                ? {
                                                      ...data.professional,
                                                      tenant: data.tenant,
                                                  }
                                                : null;
                                        setLoggedProfessional(
                                            loggedProfessionalData,
                                        );
                                        localStorage.setItem(
                                            'loggedProfessional',
                                            JSON.stringify(
                                                loggedProfessionalData,
                                            ),
                                        );
                                        if (data.device_id) {
                                            localStorage.setItem(
                                                deviceIdKey,
                                                String(data.device_id),
                                            );
                                        }
                                        emit('auth:login', undefined);
                                        window.dispatchEvent(
                                            new Event('updateClients'),
                                        );
                                        window.dispatchEvent(
                                            new Event('clearClients'),
                                        );
                                        const tenantKey =
                                            resolveClinicTenantSlug();
                                        if (tenantKey) {
                                            localStorage.setItem(
                                                `clinic:lastLogin:${tenantKey}`,
                                                loginEmail,
                                            );
                                        }
                                    } else {
                                        setModalMessage(
                                            extractApiErrorMessage(
                                                data,
                                                'Credenciais inválidas',
                                            ),
                                        );
                                        setModalOpen(true);
                                    }
                                } catch (err) {
                                    const detail =
                                        err instanceof Error
                                            ? err.message
                                            : String(err);
                                    setModalMessage(
                                        `Erro ao validar credenciais: ${detail}`,
                                    );
                                    setModalOpen(true);
                                }
                                setLoadingLogin(false);
                            }}
                        >
                            {loadingLogin ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal padrão para mensagens */}
            <AppModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                unmountOnClose
            >
                <div className='modal-message'>
                    <h3>{modalMessage}</h3>
                    <button onClick={() => setModalOpen(false)}>Ok</button>
                </div>
            </AppModal>

            {/* Modal de sessão expirada */}
            <SessionExpiredModal
                open={sessionExpiredOpen}
                onClose={() => {
                    setSessionExpiredOpen(false);
                    dispatchLogout('manual');
                }}
                message={sessionExpiredMessage}
            />
            <AboutModal
                open={aboutOpen}
                onClose={() => setAboutOpen(false)}
                buildCommit={
                    import.meta.env?.VITE_APP_COMMIT as string | undefined
                }
                buildTime={
                    import.meta.env?.VITE_BUILD_TIME as string | undefined
                }
            />
            {createPortal(
                <TreatmentPlanCreateModal
                    open={clinicProfileOpen}
                    saving={false}
                    profileOnly
                    onClose={() => setClinicProfileOpen(false)}
                    onSave={() => undefined}
                    onProfileSaved={() => undefined}
                />,
                document.body,
            )}
        </div>
    );
};
