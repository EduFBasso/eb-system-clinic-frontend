import React from 'react';
import styles from '../../styles/components/Main.module.css';

export type FilterMode = 'all' | 'pending' | 'today' | 'tomorrow' | 'ongoing';

export interface FilterBarProps {
    filter: string;
    filterMode: FilterMode;
    pendingCount: number;
    todayCount: number;
    tomorrowCount: number;
    ongoingCount: number;
    mobileFiltersOpen: boolean;
    mobileFiltersMenuStyle: React.CSSProperties;
    mobileFiltersButtonRef: React.RefObject<HTMLButtonElement | null>;
    onFilterChange: (value: string) => void;
    onFilterClear: () => void;
    onApplyFilterMode: (mode: FilterMode) => void;
    onOpenMobileFilters: (e: React.MouseEvent) => void;
    onCloseMobileFilters: () => void;
    onCloseMobileFiltersFromBackdrop: () => void;
}

// IMPORTANTE: definido fora de MainContent para que a referência da função seja estável.
// Se definido dentro, cada re-render de MainContent cria uma nova referência → React
// desmonta e remonta o FilterBar → input perde o foco a cada keystroke.
export const FilterBar = React.memo(function FilterBar({
    filter,
    filterMode,
    pendingCount,
    todayCount,
    tomorrowCount,
    ongoingCount,
    mobileFiltersOpen,
    mobileFiltersMenuStyle,
    mobileFiltersButtonRef,
    onFilterChange,
    onFilterClear,
    onApplyFilterMode,
    onOpenMobileFilters,
    onCloseMobileFilters,
    onCloseMobileFiltersFromBackdrop,
}: FilterBarProps) {
    const [localFilter, setLocalFilter] = React.useState(filter);
    const debounceRef = React.useRef<number | null>(null);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const isInputFocusedRef = React.useRef(false);
    const forceRefocusRef = React.useRef(false);
    const isMobileUA = React.useMemo(() => {
        if (typeof navigator === 'undefined') return false;
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }, []);

    React.useEffect(() => {
        if (!isInputFocusedRef.current) {
            setLocalFilter(filter);
        }
    }, [filter]);

    React.useEffect(() => {
        return () => {
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
                debounceRef.current = null;
            }
        };
    }, []);

    const commitFilter = React.useCallback(
        (value: string) => {
            onFilterChange(value);
        },
        [onFilterChange],
    );

    const handleFilterInputChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const next = event.target.value;
            setLocalFilter(next);

            if (!isMobileUA) {
                commitFilter(next);
                return;
            }

            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
            }
            debounceRef.current = window.setTimeout(() => {
                commitFilter(next);
                debounceRef.current = null;
            }, 180);
        },
        [commitFilter, isMobileUA],
    );

    const handleFilterInputFocus = React.useCallback(() => {
        isInputFocusedRef.current = true;
        onCloseMobileFilters();
        (
            window as Window & {
                __filterInputFocused?: boolean;
            }
        ).__filterInputFocused = true;
    }, [onCloseMobileFilters]);

    const handleFilterInputBlur = React.useCallback(
        (event: React.FocusEvent<HTMLInputElement>) => {
            if (isMobileUA) {
                const allowBlurAt = (
                    window as Window & {
                        __allowFilterBlurAt?: number;
                    }
                ).__allowFilterBlurAt;
                const blurFromCardTouch =
                    typeof allowBlurAt === 'number' &&
                    Date.now() - allowBlurAt < 900;

                if (!blurFromCardTouch && !forceRefocusRef.current) {
                    const active = document.activeElement as HTMLElement | null;
                    if (active?.id === 'client-filter') return;

                    forceRefocusRef.current = true;
                    event.currentTarget.focus({ preventScroll: true });
                    forceRefocusRef.current = false;

                    // Fallback in case iOS ignores synchronous focus during blur.
                    requestAnimationFrame(() => {
                        const focused =
                            document.activeElement as HTMLElement | null;
                        if (focused?.id === 'client-filter') return;
                        const inputEl = document.getElementById(
                            'client-filter',
                        ) as HTMLInputElement | null;
                        inputEl?.focus?.({ preventScroll: true });
                    });
                    return;
                }
            }

            isInputFocusedRef.current = false;
            (
                window as Window & {
                    __filterInputFocused?: boolean;
                }
            ).__filterInputFocused = false;
            if (debounceRef.current) {
                window.clearTimeout(debounceRef.current);
                debounceRef.current = null;
            }
            commitFilter(localFilter);
        },
        [commitFilter, isMobileUA, localFilter],
    );

    const handleFilterClearClick = React.useCallback(() => {
        setLocalFilter('');
        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        onFilterClear();
    }, [onFilterClear]);

    return (
        <div
            className={`${styles.filterContainer}${mobileFiltersOpen ? ` ${styles.filterContainerMenuOpen}` : ''}`}
        >
            <div className={styles.filterRow}>
                <div className={styles.filterInputWrapper}>
                    <input
                        ref={inputRef}
                        id='client-filter'
                        type='text'
                        className={styles.filterInput}
                        placeholder='Digite o nome do cliente...'
                        value={localFilter}
                        autoCapitalize='none'
                        autoCorrect='off'
                        spellCheck={false}
                        inputMode='search'
                        enterKeyHint='search'
                        onChange={handleFilterInputChange}
                        onFocus={handleFilterInputFocus}
                        onBlur={handleFilterInputBlur}
                    />
                    <button
                        type='button'
                        className={styles.filterClearBtn}
                        onClick={handleFilterClearClick}
                        aria-label='Limpar filtro'
                        tabIndex={-1}
                        style={{
                            opacity: localFilter ? 1 : 0,
                            pointerEvents: localFilter ? 'auto' : 'none',
                        }}
                    >
                        ×
                    </button>
                </div>
                <div className={styles.filterActionsDesktop}>
                    <button
                        className={`${styles.filterToggleBtn}${filterMode === 'ongoing' ? ' ' + styles.filterToggleBtnActive : ''}`}
                        onClick={() => onApplyFilterMode('ongoing')}
                        title='Filtrar clientes em atendimento agora'
                        style={
                            ongoingCount === 0 ? { opacity: 0.5 } : undefined
                        }
                    >
                        Em atendimento{' '}
                        {ongoingCount > 0 && (
                            <span
                                key={`ongoing-${ongoingCount}`}
                                className={styles.countBadge}
                                style={{
                                    display: 'inline-block',
                                    marginLeft: '4px',
                                    animation: 'badgePulse 0.35s ease-out',
                                }}
                            >
                                ({ongoingCount})
                            </span>
                        )}
                    </button>
                    <button
                        className={`${styles.filterToggleBtn}${filterMode === 'pending' ? ' ' + styles.filterToggleBtnActive : ''}`}
                        onClick={() => onApplyFilterMode('pending')}
                        title='Filtrar por compromissos pendentes'
                    >
                        {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                    </button>
                    <button
                        className={`${styles.filterToggleBtn}${filterMode === 'today' ? ' ' + styles.filterToggleBtnActive : ''}`}
                        onClick={() => onApplyFilterMode('today')}
                        title='Filtrar compromissos de hoje'
                    >
                        Hoje {todayCount > 0 ? `(${todayCount})` : ''}
                    </button>
                    <button
                        className={`${styles.filterToggleBtn}${filterMode === 'tomorrow' ? ' ' + styles.filterToggleBtnActive : ''}`}
                        onClick={() => onApplyFilterMode('tomorrow')}
                        title='Filtrar compromissos de amanhã'
                    >
                        Amanhã {tomorrowCount > 0 ? `(${tomorrowCount})` : ''}
                    </button>
                </div>

                <div className={styles.filterActionsMobile}>
                    <button
                        ref={mobileFiltersButtonRef}
                        className={`${styles.filtersMenuButton}${filterMode !== 'all' ? ' ' + styles.filtersMenuButtonActive : pendingCount > 0 ? ' ' + styles.filtersMenuButtonPending : ''}`}
                        onClick={e => {
                            e.stopPropagation();
                            if (mobileFiltersOpen) {
                                onCloseMobileFilters();
                            } else {
                                (
                                    window as Window & {
                                        __allowFilterBlurAt?: number;
                                    }
                                ).__allowFilterBlurAt = Date.now();
                                inputRef.current?.blur();
                                onOpenMobileFilters(e);
                            }
                        }}
                        aria-expanded={mobileFiltersOpen}
                        aria-haspopup='menu'
                        title='Abrir filtros'
                    >
                        Filtros
                        {pendingCount > 0 && filterMode !== 'pending'
                            ? ` (${pendingCount})`
                            : ''}
                    </button>

                    {mobileFiltersOpen && (
                        <button
                            type='button'
                            className={styles.filtersMenuBackdrop}
                            onClick={onCloseMobileFiltersFromBackdrop}
                            aria-label='Fechar filtros'
                        />
                    )}

                    {mobileFiltersOpen && (
                        <div
                            className={styles.filtersMenuPanel}
                            style={mobileFiltersMenuStyle}
                            role='menu'
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                className={`${styles.filtersMenuItem}${filterMode === 'all' ? ' ' + styles.filtersMenuItemActive : ''}`}
                                onClick={() => onApplyFilterMode('all')}
                                role='menuitem'
                            >
                                Sem filtro
                            </button>
                            <button
                                className={`${styles.filtersMenuItem}${filterMode === 'ongoing' ? ' ' + styles.filtersMenuItemActive : ''}`}
                                onClick={() => onApplyFilterMode('ongoing')}
                                role='menuitem'
                            >
                                Em atendimento ({ongoingCount})
                            </button>
                            <button
                                className={`${styles.filtersMenuItem}${filterMode === 'pending' ? ' ' + styles.filtersMenuItemActive : ''}`}
                                onClick={() => onApplyFilterMode('pending')}
                                role='menuitem'
                            >
                                Pendentes ({pendingCount})
                            </button>
                            <button
                                className={`${styles.filtersMenuItem}${filterMode === 'today' ? ' ' + styles.filtersMenuItemActive : ''}`}
                                onClick={() => onApplyFilterMode('today')}
                                role='menuitem'
                            >
                                Hoje ({todayCount})
                            </button>
                            <button
                                className={`${styles.filtersMenuItem}${filterMode === 'tomorrow' ? ' ' + styles.filtersMenuItemActive : ''}`}
                                onClick={() => onApplyFilterMode('tomorrow')}
                                role='menuitem'
                            >
                                Amanhã ({tomorrowCount})
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
