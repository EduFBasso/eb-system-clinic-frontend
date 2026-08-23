// frontend\src\components\MainContent.tsx
import React, { useState } from 'react';
import styles from '../../styles/components/Main.module.css';
import { useClients } from '../../hooks/useClients';
import type { ClientBasic } from '../../types/ClientBasic';
import { AppModal } from '../Modal/Modal';
import type { ClientData } from '../../types/ClientData';
import { dispatchLogout, hasActiveSession } from '../../utils/auth/session';
import { apiFetch } from '../../utils/apiFetch';
import { useAppointmentSets } from '../../hooks/useAppointmentSets';

import { useScrollPersistence } from '../../hooks/useScrollPersistence';
import { useIosKeyboard } from '../../hooks/useIosKeyboard';
import type { FilterMode } from '../FilterBar/FilterBar';
import { MainContentHeader } from './MainContentHeader';
import { MainContentList } from './MainContentList';

// Normaliza texto para comparação: remove acentos, espaços extras e ignora caixa
function normalizeText(s: string) {
    return s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

interface MainContentProps {
    selectedClientId: number | null;
    setSelectedClientId: (id: number | null) => void;
    onClientViewData?: (client: ClientData) => void;
    // ...outros props se necessário...
}

const FILTER_SESSION_KEY = 'home.filter';

// ─────────────────────────────────────────────────────────────────────────────

export const MainContent: React.FC<MainContentProps> = ({
    selectedClientId,
    setSelectedClientId,
    onClientViewData,
    // ...outros props...
}) => {
    const debugIosFilter =
        import.meta.env.VITE_DEBUG_IOS_FILTER === '1' ||
        localStorage.getItem('VITE_DEBUG_IOS_FILTER') === '1';

    const isMobileUA = React.useMemo(() => {
        if (typeof navigator === 'undefined') return false;
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }, []);

    const { clients, loading, error, setError } = useClients();
    const [filter, setFilter] = useState<string>(() => {
        try {
            return sessionStorage.getItem(FILTER_SESSION_KEY) ?? '';
        } catch {
            return '';
        }
    });
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const {
        tomorrowIds: tomorrowClientIds,
        tomorrowAppts: tomorrowClientAppts,
    } = useAppointmentSets(clients.length);
    // Agenda selection mode state
    const [selectMode, setSelectMode] = useState(false);
    const [returnUrl, setReturnUrl] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmClient, setConfirmClient] = useState<ClientBasic | null>(
        null,
    );
    const detailCacheRef = React.useRef<Map<number, ClientData>>(new Map());
    const lastNotifiedFilterRef = React.useRef<string>('');
    const mobileFiltersOpenedAtRef = React.useRef(0);
    const mobileFiltersButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const [mobileFiltersMenuStyle, setMobileFiltersMenuStyle] =
        React.useState<React.CSSProperties>({});
    const debugFilterRef = React.useRef(filter);
    const debugSelectedClientIdRef = React.useRef(selectedClientId);

    React.useEffect(() => {
        debugFilterRef.current = filter;
    }, [filter]);

    React.useEffect(() => {
        debugSelectedClientIdRef.current = selectedClientId;
    }, [selectedClientId]);

    React.useEffect(() => {
        if (!debugIosFilter || !isMobileUA) return;

        const input = document.getElementById(
            'client-filter',
        ) as HTMLInputElement | null;

        const log = (tag: string, payload?: Record<string, unknown>) => {
            const activeEl = document.activeElement as HTMLElement | null;
            const activeId = activeEl?.id || activeEl?.tagName || 'none';
            const vv = window.visualViewport;
            const vvInfo = vv
                ? {
                      vvH: Math.round(vv.height),
                      vvY: Math.round(vv.offsetTop),
                  }
                : {};

            console.debug(`[ios-filter] ${tag}`, {
                t: Date.now(),
                activeId,
                filter: debugFilterRef.current,
                selectedClientId: debugSelectedClientIdRef.current,
                ...vvInfo,
                ...(payload || {}),
            });
        };

        const onUpdateClients = () => log('updateClients');
        const onForceRefresh = () => log('clients:forceRefresh');
        const onAppointmentsChanged = () => log('appointments:changed');
        const onScrollToClient = (e: Event) => {
            const detail = (e as CustomEvent).detail || {};
            log('scrollToClientCard', { clientId: detail.clientId });
        };
        const onVvResize = () => log('visualViewport.resize');
        const onSelection = () => log('selectionchange');

        window.addEventListener('updateClients', onUpdateClients);
        window.addEventListener('clients:forceRefresh', onForceRefresh);
        window.addEventListener('appointments:changed', onAppointmentsChanged);
        window.addEventListener('scrollToClientCard', onScrollToClient);
        window.visualViewport?.addEventListener('resize', onVvResize);
        document.addEventListener('selectionchange', onSelection);

        const onInputFocus = () => log('input.focus');
        const onInputBlur = () => log('input.blur');
        const onInputBefore = (e: Event) =>
            log('input.beforeinput', {
                inputType: (e as InputEvent).inputType,
                data: (e as InputEvent).data,
            });
        const onInput = (e: Event) =>
            log('input.input', {
                valueLen: (e.target as HTMLInputElement | null)?.value.length,
            });

        input?.addEventListener('focus', onInputFocus);
        input?.addEventListener('blur', onInputBlur);
        input?.addEventListener('beforeinput', onInputBefore);
        input?.addEventListener('input', onInput);

        log('diagnostic.enabled');

        return () => {
            window.removeEventListener('updateClients', onUpdateClients);
            window.removeEventListener('clients:forceRefresh', onForceRefresh);
            window.removeEventListener(
                'appointments:changed',
                onAppointmentsChanged,
            );
            window.removeEventListener('scrollToClientCard', onScrollToClient);
            window.visualViewport?.removeEventListener('resize', onVvResize);
            document.removeEventListener('selectionchange', onSelection);
            input?.removeEventListener('focus', onInputFocus);
            input?.removeEventListener('blur', onInputBlur);
            input?.removeEventListener('beforeinput', onInputBefore);
            input?.removeEventListener('input', onInput);
        };
    }, [debugIosFilter, isMobileUA]);

    const updateMobileFiltersMenuPosition = React.useCallback(() => {
        const button = mobileFiltersButtonRef.current;
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const menuWidth = Math.min(
            220,
            Math.max(180, Math.round(rect.width * 2.1)),
        );
        const viewportWidth = window.innerWidth;
        const left = Math.max(
            16,
            Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 16),
        );

        setMobileFiltersMenuStyle({
            top: rect.bottom + 8,
            left,
            width: menuWidth,
        });
    }, []);

    const closeMobileFilters = React.useCallback(() => {
        setMobileFiltersOpen(false);
    }, []);

    const closeMobileFiltersFromBackdrop = React.useCallback(() => {
        if (Date.now() - mobileFiltersOpenedAtRef.current < 250) {
            return;
        }
        setMobileFiltersOpen(false);
    }, []);

    React.useEffect(() => {
        const dismissSearchAndFiltersOutside = (event: Event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const touchedFilterInput = !!target.closest('#client-filter');
            const touchedFiltersButton = !!target.closest(
                '[data-filters-toggle="1"]',
            );
            const touchedFiltersMenu = !!target.closest(
                '[data-filters-menu="1"]',
            );

            if (
                touchedFilterInput ||
                touchedFiltersButton ||
                touchedFiltersMenu
            ) {
                return;
            }

            const input = document.getElementById(
                'client-filter',
            ) as HTMLInputElement | null;

            if (input && document.activeElement === input) {
                input.blur();
            }

            if (mobileFiltersOpen) {
                closeMobileFilters();
            }
        };

        document.addEventListener(
            'touchstart',
            dismissSearchAndFiltersOutside,
            {
                passive: true,
                capture: true,
            },
        );
        document.addEventListener('mousedown', dismissSearchAndFiltersOutside, {
            capture: true,
        });

        return () => {
            document.removeEventListener(
                'touchstart',
                dismissSearchAndFiltersOutside,
                true,
            );
            document.removeEventListener(
                'mousedown',
                dismissSearchAndFiltersOutside,
                true,
            );
        };
    }, [closeMobileFilters, mobileFiltersOpen]);

    React.useEffect(() => {
        if (!mobileFiltersOpen) return;

        const handleViewportChange = () => {
            updateMobileFiltersMenuPosition();
        };

        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);
        window.visualViewport?.addEventListener('resize', handleViewportChange);
        window.visualViewport?.addEventListener('scroll', handleViewportChange);

        return () => {
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
            window.visualViewport?.removeEventListener(
                'resize',
                handleViewportChange,
            );
            window.visualViewport?.removeEventListener(
                'scroll',
                handleViewportChange,
            );
        };
    }, [mobileFiltersOpen, updateMobileFiltersMenuPosition]);

    const applyFilterMode = React.useCallback(
        (mode: FilterMode) => {
            React.startTransition(() => {
                setFilterMode(prev => (prev === mode ? 'all' : mode));
            });
            setFilter('');
            closeMobileFilters();
        },
        [closeMobileFilters],
    );

    const requireActiveSession = React.useCallback(() => {
        if (hasActiveSession()) {
            return true;
        }

        setSelectedClientId(null);
        setError(
            'Sessão expirada ou usuário não autenticado. Faça login novamente.',
        );
        dispatchLogout('session_expired');
        return false;
    }, [setError, setSelectedClientId]);

    // Limpa UI imediatamente ao receber evento de logout/clearClients
    React.useEffect(() => {
        const handleClear = () => {
            setFilter('');
            detailCacheRef.current.clear();
        };
        window.addEventListener('clearClients', handleClear);
        return () => window.removeEventListener('clearClients', handleClear);
    }, []);

    React.useEffect(() => {
        const handleRefreshSignals = () => {
            detailCacheRef.current.clear();
        };

        window.addEventListener('updateClients', handleRefreshSignals);
        window.addEventListener('clients:forceRefresh', handleRefreshSignals);

        return () => {
            window.removeEventListener('updateClients', handleRefreshSignals);
            window.removeEventListener(
                'clients:forceRefresh',
                handleRefreshSignals,
            );
        };
    }, []);

    // Pós-exclusão: limpa o filtro e foca o input.
    React.useEffect(() => {
        try {
            const action = localStorage.getItem('postDeleteAction');
            if (action === 'clearFilter') {
                localStorage.removeItem('postDeleteAction');
                setFilter('');
                setSelectedClientId(null);
                lastNotifiedFilterRef.current = '';
                setTimeout(() => {
                    (
                        document.getElementById(
                            'client-filter',
                        ) as HTMLInputElement | null
                    )?.focus?.();
                }, 0);
            }
        } catch {
            /* noop */
        }
    }, [setSelectedClientId]);

    useIosKeyboard(styles.filterContainer);

    const cardRefs = React.useRef<{ [key: number]: HTMLDivElement | null }>({});
    const lastPrefixTargetRef = React.useRef<number | null>(null);
    const debounceRef = React.useRef<number | null>(null);

    // Helper: desfoca, remove lock e pede atualização da lista
    const refreshAndUnlock = React.useCallback(() => {
        try {
            const activeEl = document.activeElement as HTMLElement | null;
            const isTextInputFocused =
                !!activeEl &&
                (activeEl.tagName === 'INPUT' ||
                    activeEl.tagName === 'TEXTAREA' ||
                    activeEl.tagName === 'SELECT');
            if (isMobileUA && isTextInputFocused) {
                return;
            }
            (document.activeElement as HTMLElement | null)?.blur?.();
            document.body.classList.remove('keyboardOpen');
            window.dispatchEvent(new Event('updateClients'));
        } catch {
            /* noop */
        }
    }, [isMobileUA]);

    // Seleciona automaticamente o novo cliente cadastrado assim que aparecer na lista
    React.useEffect(() => {
        const newClientId = localStorage.getItem('newClientId');
        if (newClientId && clients.some(c => c.id === Number(newClientId))) {
            setSelectedClientId(Number(newClientId));
            localStorage.removeItem('newClientId');
        }
    }, [clients, setSelectedClientId]);

    // Se o cartão selecionado deixar de existir (ex.: após exclusão), limpa a seleção
    // e remove o foco de qualquer elemento dentro da grade para evitar travas no mobile.
    React.useEffect(() => {
        if (!selectedClientId) return;
        const stillExists = clients.some(c => c.id === selectedClientId);
        if (!stillExists) {
            setSelectedClientId(null);
            const active = document.activeElement as HTMLElement | null;
            if (active && active.closest?.(`.${styles.cardsGrid}`)) {
                active.blur?.();
            }
            // Garante atualização/realinhamento
            refreshAndUnlock();
        }
    }, [clients, selectedClientId, setSelectedClientId, refreshAndUnlock]);

    // Força uma atualização quando a tela monta (evita estados inconsistentes pós navegação)
    React.useEffect(() => {
        if (isMobileUA) return;
        const t = window.setTimeout(() => refreshAndUnlock(), 0);
        return () => window.clearTimeout(t);
    }, [refreshAndUnlock, isMobileUA]);

    // Persiste texto do filtro para sobreviver à navegação (editar e voltar).
    React.useEffect(() => {
        try {
            sessionStorage.setItem(FILTER_SESSION_KEY, filter);
        } catch {
            /* noop */
        }
    }, [filter]);

    // Salva posição de scroll e restaura após carregamento inicial.
    useScrollPersistence(loading, clients.length);

    // Modo seleção vindo da Agenda: se URL tiver selectClientFor=agenda, foca filtro e aplica retorno
    React.useEffect(() => {
        try {
            const url = new URL(window.location.href);
            const mode = url.searchParams.get('selectClientFor');
            const ret = url.searchParams.get('return');
            if (mode === 'agenda') {
                // Foca no filtro para o usuário digitar
                const input = document.getElementById(
                    'client-filter',
                ) as HTMLInputElement | null;
                input?.focus?.();
                // Guarda return para uso no clique de cartão
                if (ret) {
                    localStorage.setItem('agenda.returnUrl', ret);
                    setReturnUrl(ret);
                }
                setSelectMode(true);
            }
        } catch {
            /* noop */
        }
    }, []);

    // Integra com NavBar: foco no cartão selecionado ou solicitar seleção
    React.useEffect(() => {
        function onFocusSelectedClientCard() {
            const activeEl = document.activeElement as HTMLElement | null;
            if (activeEl?.id === 'client-filter') return;
            if (!selectedClientId) return;
            const el = cardRefs.current[selectedClientId];
            if (el) {
                el.scrollIntoView({
                    block: 'center',
                    behavior: 'instant' as ScrollBehavior,
                });
                if (isMobileUA) return;
                (
                    el.querySelector('button, [tabindex]') as HTMLElement | null
                )?.focus?.();
            }
        }
        function onScrollToClientCard(e: Event) {
            const activeEl = document.activeElement as HTMLElement | null;
            if (activeEl?.id === 'client-filter') return;
            const detail = (e as CustomEvent).detail || {};
            const id: number | undefined = detail.clientId;
            if (!id) return;
            const el = cardRefs.current[id];
            if (el) {
                el.scrollIntoView({
                    block: 'center',
                    behavior: 'instant' as ScrollBehavior,
                });
            }
        }
        function onNeedClientSelectionForAgenda() {
            const input = document.getElementById(
                'client-filter',
            ) as HTMLInputElement | null;
            input?.focus?.();
        }
        window.addEventListener(
            'focusSelectedClientCard',
            onFocusSelectedClientCard,
        );
        window.addEventListener('scrollToClientCard', onScrollToClientCard);
        window.addEventListener(
            'needClientSelectionForAgenda',
            onNeedClientSelectionForAgenda,
        );
        return () => {
            window.removeEventListener(
                'focusSelectedClientCard',
                onFocusSelectedClientCard,
            );
            window.removeEventListener(
                'scrollToClientCard',
                onScrollToClientCard,
            );
            window.removeEventListener(
                'needClientSelectionForAgenda',
                onNeedClientSelectionForAgenda,
            );
        };
    }, [selectedClientId, isMobileUA]);

    // Filtra clientes por nome (acentos/maiúsculas ignorados) e ordena com colisão pt-BR.
    // Memoizado: só recalcula quando `clients` ou `filter` mudam — evita .sort() de 1235 itens a cada render.
    const filteredClients = React.useMemo(() => {
        const norm = normalizeText(filter);

        const entries = clients.map(client => {
            const fullName = `${client.first_name} ${client.last_name}`;
            const normalizedFirstName = normalizeText(client.first_name);
            const normalizedLastName = normalizeText(client.last_name);
            const normalizedFullName = normalizeText(fullName);

            let affinityWeight: 1 | 2 | 3 | null = null;
            if (norm) {
                const firstNameStarts = normalizedFirstName.startsWith(norm);
                const lastNameStarts = normalizedLastName
                    .split(/\s+/)
                    .some(token => token.startsWith(norm));
                const includesSomewhere = normalizedFullName.includes(norm);

                if (firstNameStarts) {
                    affinityWeight = 1;
                } else if (lastNameStarts) {
                    affinityWeight = 2;
                } else if (includesSomewhere) {
                    affinityWeight = 3;
                }
            }

            return {
                client,
                fullName,
                affinityWeight,
            };
        });

        if (!norm) {
            return entries
                .sort((a, b) =>
                    a.fullName.localeCompare(b.fullName, 'pt-BR', {
                        sensitivity: 'base',
                    }),
                )
                .map(entry => entry.client);
        }

        const hasPrefixMatches = entries.some(
            entry => entry.affinityWeight === 1 || entry.affinityWeight === 2,
        );

        return entries
            .filter(entry =>
                hasPrefixMatches
                    ? entry.affinityWeight === 1 || entry.affinityWeight === 2
                    : entry.affinityWeight === 3,
            )
            .sort((a, b) => {
                const aw = a.affinityWeight ?? 99;
                const bw = b.affinityWeight ?? 99;
                if (aw !== bw) {
                    return aw - bw;
                }
                return a.fullName.localeCompare(b.fullName, 'pt-BR', {
                    sensitivity: 'base',
                });
            })
            .map(entry => entry.client);
    }, [clients, filter]);

    const sortByPeriodThenTime = React.useCallback(
        (a: ClientBasic, b: ClientBasic) => {
            const getPeriodRank = (iso?: string | null) => {
                if (!iso) return 99;
                const d = new Date(iso);
                const hour = d.getHours();
                if (hour < 12) return 0; // morning
                if (hour < 18) return 1; // tarde
                return 2; // noite
            };

            const ra = getPeriodRank(a.next_appointment_start_at);
            const rb = getPeriodRank(b.next_appointment_start_at);
            if (ra !== rb) return ra - rb;

            const ta = a.next_appointment_start_at
                ? new Date(a.next_appointment_start_at).getTime()
                : Number.MAX_SAFE_INTEGER;
            const tb = b.next_appointment_start_at
                ? new Date(b.next_appointment_start_at).getTime()
                : Number.MAX_SAFE_INTEGER;
            return ta - tb;
        },
        [],
    );

    const isSameLocalDay = React.useCallback((iso: string, target: Date) => {
        const d = new Date(iso);
        return (
            d.getFullYear() === target.getFullYear() &&
            d.getMonth() === target.getMonth() &&
            d.getDate() === target.getDate()
        );
    }, []);

    const todayClients = React.useMemo(() => {
        const today = new Date();
        return clients
            .filter(c => {
                if (c.next_appointment_status !== 'scheduled') return false;
                if (!c.next_appointment_start_at) return false;
                return isSameLocalDay(c.next_appointment_start_at, today);
            })
            .sort(sortByPeriodThenTime);
    }, [clients, isSameLocalDay, sortByPeriodThenTime]);

    // Clientes com agendamento amanhã.
    // Usa tomorrowClientIds (Set<number>) construído no effect de carregamento de agendamentos
    // para cobrir TODOS os agendamentos do cliente amanhã — não apenas next_appointment_start_at.
    // Exemplo: cliente com next_appointment hoje + future_appointment amanhã seria ignorado
    // pelo filtro se só checássemos next_appointment_start_at.
    const tomorrowClients = React.useMemo(() => {
        return clients
            .filter(c => tomorrowClientIds.has(c.id))
            .sort(sortByPeriodThenTime);
    }, [clients, tomorrowClientIds, sortByPeriodThenTime]);

    const todayCount = todayClients.length;
    const tomorrowCount = tomorrowClients.length;

    // Fase 2: estado de fade suave (mantido para compatibilidade visual)
    const [isResettingFilter] = React.useState(false);

    const displayedClients = React.useMemo(() => {
        if (filterMode === 'today') return todayClients;
        if (filterMode === 'tomorrow') return tomorrowClients;
        return filteredClients;
    }, [filterMode, todayClients, tomorrowClients, filteredClients]);

    // Ao mudar filterMode: reseta contagem e volta ao topo
    React.useEffect(() => {
        if (isMobileUA && document.activeElement?.id === 'client-filter') {
            return;
        }
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, [filterMode, isMobileUA]);

    // Reseta referência de notificação quando o filtro muda (não exibe modal — apenas tracking interno).
    React.useEffect(() => {
        if (!filter) lastNotifiedFilterRef.current = '';
    }, [filter]);

    // Navega automaticamente para o primeiro cartão cujo nome comece com o filtro digitado.
    // Debounce curto e só rola se o alvo mudou, evitando "vai e volta" a cada tecla.
    React.useEffect(() => {
        // Se filtro vazio, reseta alvo e não faz scroll.
        if (!filter) {
            lastPrefixTargetRef.current = null;
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
                debounceRef.current = null;
            }
            return;
        }
        if (!filteredClients.length) return;

        const normFilter = normalizeText(filter);
        if (!normFilter) {
            lastPrefixTargetRef.current = null;
            return;
        }

        const inputEl = document.getElementById('client-filter');

        const firstPrefix = filteredClients[0];
        if (!firstPrefix) return;

        // Se o mesmo cartão já foi alvo, não rola novamente nesta digitação.
        if (lastPrefixTargetRef.current === firstPrefix.id) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            lastPrefixTargetRef.current = firstPrefix.id;
            const el = cardRefs.current[firstPrefix.id];
            if (!el) return;
            // Seleciona o cartão para aplicar o mesmo destaque de salvar/editar
            if (selectedClientId !== firstPrefix.id) {
                setSelectedClientId(firstPrefix.id);
            }

            // No mobile, mantemos apenas a seleção visual durante digitação.
            // Evitamos qualquer auto-scroll para não desestabilizar o teclado.
            if (isMobileUA) {
                return;
            }

            // Garante que o cartão fique imediatamente abaixo do filtro visível
            const filterEl = document.querySelector(
                `.${styles.filterContainer}`,
            ) as HTMLElement | null;
            requestAnimationFrame(() => {
                // Se o input de filtro ainda estiver focado (usuário digitando), não rola a página
                // para evitar que o iOS dispense o teclado virtual ao detectar scroll programático.
                if (document.activeElement === inputEl) return;
                const targetRect = el.getBoundingClientRect();
                const filterRect = filterEl?.getBoundingClientRect();
                const desiredTop = (filterRect ? filterRect.bottom : 0) + 24; // respiro maior para não ficar sob o filtro
                const delta = targetRect.top - desiredTop;
                if (Math.abs(delta) > 1) {
                    const container = document.body.classList.contains(
                        'keyboardOpen',
                    )
                        ? (document.querySelector(
                              'main.' + styles.main,
                          ) as HTMLElement | null)
                        : null;
                    if (container) {
                        container.scrollBy({ top: delta, behavior: 'smooth' });
                    } else {
                        window.scrollBy({ top: delta, behavior: 'smooth' });
                    }
                }
            });
        }, 140);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
                debounceRef.current = null;
            }
        };
    }, [
        filter,
        filteredClients,
        selectedClientId,
        setSelectedClientId,
        isMobileUA,
    ]);

    const handleFilterChange = React.useCallback(
        (value: string) => {
            setFilter(value);

            if (!value.trim() && selectedClientId !== null) {
                setSelectedClientId(null);
            }

            // Ao digitar busca textual, volta para "Sem filtro".
            // Não resetamos o modo em blur com valor vazio para evitar oscilacao no mobile.
            if (value.trim() && filterMode !== 'all')
                React.startTransition(() => setFilterMode('all'));
        },
        [filterMode, selectedClientId, setSelectedClientId],
    );

    const handleFilterClear = React.useCallback(() => {
        setFilter('');
        document.getElementById('client-filter')?.focus();
    }, []);

    const handleOpenMobileFilters = React.useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            updateMobileFiltersMenuPosition();
            mobileFiltersOpenedAtRef.current = Date.now();
            setMobileFiltersOpen(true);
        },
        [updateMobileFiltersMenuPosition],
    );

    const handleSessionExpiredClose = React.useCallback(() => {
        setError(null);
        dispatchLogout('session_expired');
    }, [setError]);

    const handleSelectClient = React.useCallback(
        (client: ClientBasic) => {
            if (!requireActiveSession()) {
                return;
            }
            setSelectedClientId(client.id);
            try {
                const url = new URL(window.location.href);
                const mode = url.searchParams.get('selectClientFor');
                if (mode === 'agenda') {
                    setConfirmClient(client);
                    setConfirmOpen(true);
                }
            } catch {
                /* noop */
            }
        },
        [requireActiveSession, setSelectedClientId],
    );

    const handleCardRef = React.useCallback(
        (clientId: number, element: HTMLDivElement | null) => {
            cardRefs.current[clientId] = element;
        },
        [],
    );

    function handleView(cliente: ClientBasic) {
        if (!requireActiveSession()) {
            return;
        }
        const cached = detailCacheRef.current.get(cliente.id);
        if (cached) {
            onClientViewData?.(cached);
            return;
        }
        // Solta qualquer foco ativo antes de abrir a visualização, evitando foco "grudado" caso o item seja removido depois
        try {
            (document.activeElement as HTMLElement | null)?.blur?.();
        } catch {
            /* noop */
        }
        apiFetch(`/register/clients/${cliente.id}/`, {
            timeoutMs: 12000,
        })
            .then(data => {
                const clientData = data as unknown as ClientData;
                detailCacheRef.current.set(cliente.id, clientData);
                onClientViewData?.(clientData);
            })
            .catch(() => {
                alert('Erro ao buscar dados completos do cliente');
            });
    }

    return (
        <main className={styles.main}>
            <MainContentHeader
                filter={filter}
                filterMode={filterMode}
                todayCount={todayCount}
                tomorrowCount={tomorrowCount}
                mobileFiltersOpen={mobileFiltersOpen}
                mobileFiltersMenuStyle={mobileFiltersMenuStyle}
                mobileFiltersButtonRef={mobileFiltersButtonRef}
                onFilterChange={handleFilterChange}
                onFilterClear={handleFilterClear}
                onApplyFilterMode={applyFilterMode}
                onOpenMobileFilters={handleOpenMobileFilters}
                onCloseMobileFilters={closeMobileFilters}
                onCloseMobileFiltersFromBackdrop={
                    closeMobileFiltersFromBackdrop
                }
                loading={loading}
                clientsLength={clients.length}
                error={error}
                onSessionExpiredClose={handleSessionExpiredClose}
                selectMode={selectMode}
            />

            <MainContentList
                displayedClients={displayedClients}
                loading={loading}
                filter={filter}
                selectedClientId={selectedClientId}
                filterMode={filterMode}
                isResettingFilter={isResettingFilter}
                tomorrowClientAppts={tomorrowClientAppts}
                onSelectClient={handleSelectClient}
                onViewClient={handleView}
                onCardRef={handleCardRef}
            />

            <AppModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                showCloseButton={false}
                closeOnEscape
                disableBackdropClose
            >
                <div className={styles.confirmModalContent}>
                    <h3 className={styles.confirmModalTitle}>
                        Confirmar agendamento
                    </h3>
                    <div>
                        Usar o cliente{' '}
                        <strong>
                            {confirmClient
                                ? `${confirmClient.first_name} ${confirmClient.last_name}`.trim()
                                : ''}
                        </strong>{' '}
                        para um novo compromisso?
                    </div>
                    <div className={styles.confirmModalActions}>
                        <button
                            className={styles.confirmModalCancelButton}
                            onClick={() => {
                                // Cancelar Agendamento: sair do fluxo e retornar à Agenda (sem new=1)
                                const ret =
                                    returnUrl ||
                                    localStorage.getItem('agenda.returnUrl') ||
                                    '/agenda'; // kept: Home handles /agenda via modals
                                try {
                                    const u = new URL(
                                        ret,
                                        window.location.origin,
                                    );
                                    u.searchParams.delete('new');
                                    window.location.href =
                                        u.pathname + (u.search || '');
                                } catch {
                                    window.location.href = '/agenda'; // triggers Home route which opens modals
                                }
                            }}
                        >
                            Cancelar Agendamento
                        </button>
                        <button
                            className={styles.confirmModalConfirmButton}
                            onClick={() => {
                                if (!confirmClient) return;
                                // Confirm: continuar fluxo, voltar à Agenda com client
                                const label =
                                    `${confirmClient.first_name} ${confirmClient.last_name}`.trim();
                                localStorage.setItem(
                                    `client.name.${confirmClient.id}`,
                                    label,
                                );
                                const ret =
                                    returnUrl ||
                                    localStorage.getItem('agenda.returnUrl') ||
                                    '/agenda'; // kept for compatibility
                                const sep = ret.includes('?') ? '&' : '?';
                                window.location.href = `${ret}${sep}client=${confirmClient.id}`;
                            }}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </AppModal>

            {/* modal removido — nenhum resultado é exibido inline no cardsGrid */}
        </main>
    );
};
