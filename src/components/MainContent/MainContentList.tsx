import React from 'react';
import styles from '../../styles/components/Main.module.css';
import { ClientCard } from '../ClientCard/ClientCard';
import type { FilterMode } from '../FilterBar/FilterBar';
import type { ScheduledAppointmentLike } from '../../hooks/useAppointmentSets';
import type { ClientBasic } from '../../types/ClientBasic';

const LOAD_BATCH = 50;

interface MainContentListProps {
    displayedClients: ClientBasic[];
    loading: boolean;
    filter: string;
    selectedClientId: number | null;
    filterMode: FilterMode;
    isResettingFilter: boolean;
    tomorrowClientAppts: Map<number, ScheduledAppointmentLike>;
    onSelectClient: (client: ClientBasic) => void;
    onViewClient: (client: ClientBasic) => void;
    onCardRef: (clientId: number, element: HTMLDivElement | null) => void;
}

export function MainContentList({
    displayedClients,
    loading,
    filter,
    selectedClientId,
    filterMode,
    isResettingFilter,
    tomorrowClientAppts,
    onSelectClient,
    onViewClient,
    onCardRef,
}: MainContentListProps) {
    const [visibleCount, setVisibleCount] = React.useState(LOAD_BATCH);
    const sentinelRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        React.startTransition(() => setVisibleCount(LOAD_BATCH));
    }, [displayedClients]);

    const deferredDisplayedClients = React.useDeferredValue(displayedClients);
    const totalDisplayed = deferredDisplayedClients.length;
    const hasMore = visibleCount < totalDisplayed;
    const visibleClients = React.useMemo(
        () => deferredDisplayedClients.slice(0, visibleCount),
        [deferredDisplayedClients, visibleCount],
    );

    React.useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore) {
                    React.startTransition(() => {
                        setVisibleCount(n =>
                            Math.min(n + LOAD_BATCH, totalDisplayed),
                        );
                    });
                }
            },
            { rootMargin: '200px' },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, totalDisplayed]);

    return (
        <>
            <div
                className={`${styles.cardsGrid}${isResettingFilter ? ` ${styles.cardsGridResetting}` : ''}`}
            >
                {!loading && filter && visibleClients.length === 0 && (
                    <p className={styles.noResultsMessage}>
                        Nenhum cliente encontrado para &ldquo;{filter}&rdquo;.
                    </p>
                )}

                {visibleClients.map(client => (
                    <div
                        key={client.id}
                        data-client-card-item='1'
                        ref={el => onCardRef(client.id, el)}
                    >
                        <ClientCard
                            client={client}
                            selected={selectedClientId === client.id}
                            filterMode={filterMode}
                            notifyAppt={
                                filterMode === 'tomorrow'
                                    ? tomorrowClientAppts.get(client.id)
                                    : undefined
                            }
                            onSelect={() => onSelectClient(client)}
                            onView={onViewClient}
                        />
                    </div>
                ))}
            </div>

            <div
                ref={sentinelRef}
                aria-hidden='true'
                className={styles.listSentinel}
            />
        </>
    );
}
