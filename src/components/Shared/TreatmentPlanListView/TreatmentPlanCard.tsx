import React from 'react';
import type { PlanListItem } from '../../../utils/TreatmentHelpers';
import { planDisplayName } from '../../../utils/TreatmentHelpers';
import { formatAmount } from '../../../utils/currency';
import styles from './TreatmentPlanCard.module.css';

type Props = {
    plan: PlanListItem;
    onSelect: (id: number) => void;
    onDelete: (id: number) => void;
};

function StatusBadge({
    status,
    isPrinted,
}: {
    status: PlanListItem['status'];
    isPrinted: boolean;
}) {
    const label = isPrinted
        ? 'Impresso'
        : status === 'completed'
          ? 'Concluído'
          : status === 'archived'
            ? 'Arquivado'
            : 'Em andamento';
    return (
        <span
            className={`${styles.statusBadge} ${
                isPrinted
                    ? styles.statusPrinted
                    : status === 'completed'
                      ? styles.statusCompleted
                      : styles.statusPending
            }`}
        >
            {label}
        </span>
    );
}

export default function TreatmentPlanCard({ plan, onSelect, onDelete }: Props) {
    const isArchived = plan.status === 'archived';
    const isInstallments = plan.payment_condition === 'aprazo';
    const installments = Math.max(1, plan.installments_count ?? 1);
    const total = Number(plan.plan_total ?? 0);
    const installmentValue = total / installments;
    const paymentSummary = isInstallments
        ? `Total: ${formatAmount(total)} a prazo em ${installments}x de ${formatAmount(installmentValue)}`
        : `Total: ${formatAmount(total)} à vista`;
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
                <StatusBadge
                    status={plan.status}
                    isPrinted={Boolean(plan.is_printed)}
                />
            </div>
            <div className={styles.footer}>
                <div className={styles.paymentSummary}>
                    <span>{paymentSummary}</span>
                    {isInstallments && plan.first_due_date && (
                        <span>
                            1ª parcela em{' '}
                            {new Date(
                                `${plan.first_due_date}T12:00:00`,
                            ).toLocaleDateString('pt-BR')}
                        </span>
                    )}
                </div>
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
