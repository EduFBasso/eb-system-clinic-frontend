import React from 'react';
import styles from '../../styles/components/Main.module.css';
import { SessionExpiredModal } from '../SessionExpiredModal/SessionExpiredModal';
import { FilterBar } from '../FilterBar/FilterBar';
import type { FilterMode } from '../FilterBar/FilterBar';

interface MainContentHeaderProps {
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
    loading: boolean;
    clientsLength: number;
    error: string | null;
    onSessionExpiredClose: () => void;
    selectMode: boolean;
}

export function MainContentHeader({
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
    loading,
    clientsLength,
    error,
    onSessionExpiredClose,
    selectMode,
}: MainContentHeaderProps) {
    return (
        <>
            <FilterBar
                filter={filter}
                filterMode={filterMode}
                pendingCount={pendingCount}
                todayCount={todayCount}
                tomorrowCount={tomorrowCount}
                ongoingCount={ongoingCount}
                mobileFiltersOpen={mobileFiltersOpen}
                mobileFiltersMenuStyle={mobileFiltersMenuStyle}
                mobileFiltersButtonRef={mobileFiltersButtonRef}
                onFilterChange={onFilterChange}
                onFilterClear={onFilterClear}
                onApplyFilterMode={onApplyFilterMode}
                onOpenMobileFilters={onOpenMobileFilters}
                onCloseMobileFilters={onCloseMobileFilters}
                onCloseMobileFiltersFromBackdrop={
                    onCloseMobileFiltersFromBackdrop
                }
            />

            {loading && clientsLength === 0 && (
                <div>Carregando clientes...</div>
            )}

            {error && error.includes('Sessão expirada') && (
                <SessionExpiredModal
                    open={true}
                    onClose={onSessionExpiredClose}
                    message='Sua sessão expirou ou você não está autenticado. Por favor, faça login para acessar os clientes.'
                    color='var(--color-error-light)'
                />
            )}

            {error && !error.includes('Sessão expirada') && (
                <div className={styles.errorMessage}>{error}</div>
            )}

            {selectMode && (
                <div className={styles.agendaSelectionBanner}>
                    Selecione um cliente para agendar
                </div>
            )}
        </>
    );
}
