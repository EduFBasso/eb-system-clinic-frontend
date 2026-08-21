import React from 'react';
import type { PlanListItem } from '../../pages/odontoArcadeHelpers';
import { planDisplayName } from '../../pages/odontoArcadeHelpers';
import styles from './OdontoPlanCard.module.css';

type Props = {
    plan: PlanListItem;
    onSelect: (id: number) => void;
    onDelete: (id: number) => void;
};

function StatusBadge({ status }: { status: PlanListItem['status'] }) {
    const label =
        status === 'completed'
            ? 'Concluído'
            : status === 'archived'
              ? 'Arquivado'
              : 'Em andamento';
    return (
        <span
            className={`${styles.statusBadge} ${
                status === 'completed'
                    ? styles.statusCompleted
                    : styles.statusPending
            }`}
        >
            {label}
        </span>
    );
}

export default function OdontoPlanCard({ plan, onSelect, onDelete }: Props) {
    const isArchived = plan.status === 'archived';
    return (
        <div
            className={`${styles.card} ${isArchived ? styles.archivedCard : ''}`}
            onClick={() => {
                if (!isArchived) onSelect(plan.id);
            }}
            aria-disabled={isArchived}
        >
            <div className={styles.body}>
                <p className={styles.planName}>{planDisplayName(plan)}</p>
                <StatusBadge status={plan.status} />
            </div>
            <div className={styles.footer}>
                <span className={styles.counts}>
                    {plan.pending_items ?? 0} pendentes ·{' '}
                    {plan.completed_items ?? 0} pagos
                </span>
                {!plan.is_printed && !isArchived && (
                    <button
                        type='button'
                        className={styles.deleteBtn}
                        onClick={e => {
                            e.stopPropagation();
                            onDelete(plan.id);
                        }}
                        aria-label='Remover plano'
                        title='Remover plano'
                    >
                        <svg viewBox='0 0 24 24' aria-hidden='true'>
                            <path
                                d='M8.5 3.8A1.8 1.8 0 0 0 6.7 5.6V7H4.4a1 1 0 1 0 0 2h.7l.8 10.3a2.6 2.6 0 0 0 2.6 2.4h7a2.6 2.6 0 0 0 2.6-2.4L18.9 9h.7a1 1 0 1 0 0-2h-2.3V5.6a1.8 1.8 0 0 0-1.8-1.8h-7zm.2 3.2V5.8h6.6V7H8.7zm1.2 4.1a1 1 0 0 1 1 1v5.3a1 1 0 1 1-2 0v-5.3a1 1 0 0 1 1-1zm4.2 0a1 1 0 0 1 1 1v5.3a1 1 0 1 1-2 0v-5.3a1 1 0 0 1 1-1z'
                                fill='currentColor'
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
