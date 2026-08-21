import React from 'react';
import type { TreatmentItem } from '../../pages/odontoArcadeHelpers';
import { formatMoney } from '../../pages/odontoArcadeHelpers';
import styles from '../../styles/pages/OdontoArcadeSimplifiedPage.module.css';

type Props = {
    item: TreatmentItem;
    childItems: TreatmentItem[];
    isExpanded: boolean;
    onToggleDetails: (itemId: number) => void;
    onEdit: (item: TreatmentItem) => void;
    onDelete: (itemId: number) => void;
    onMarkCompleted: (itemId: number) => void;
    /** True when the parent plan is printed and locked against edits. */
    locked?: boolean;
};

function formatCompletionDate(value: string | null): string {
    if (!value) return 'Pago';
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return `Pago em ${value}`;
    return `Pago em ${parsed.toLocaleDateString('pt-BR')}`;
}

function PaymentBadge({
    item,
    onMarkCompleted,
}: {
    item: TreatmentItem;
    onMarkCompleted: (itemId: number) => void;
}) {
    const isCompleted = item.status === 'completed';
    const paymentDate = formatCompletionDate(item.completed_at);
    return (
        <span className={styles.paymentBadgeSlot}>
            <button
                type='button'
                className={`${styles.paymentBadge} ${
                    isCompleted
                        ? styles.paymentBadgePaid
                        : styles.paymentBadgePending
                }`}
                onClick={() => {
                    if (!isCompleted) onMarkCompleted(item.id);
                }}
                disabled={isCompleted}
                aria-label={isCompleted ? paymentDate : 'Marcar como pago'}
            >
                {formatMoney(item.patient_price)}
            </button>
        </span>
    );
}

function EyeIcon() {
    return (
        <svg
            viewBox='0 0 24 24'
            aria-hidden='true'
            className={styles.actionIcon}
        >
            <path
                d='M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
            <circle
                cx='12'
                cy='12'
                r='3.2'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.8'
            />
        </svg>
    );
}

function PencilIcon() {
    return (
        <svg
            viewBox='0 0 24 24'
            aria-hidden='true'
            className={styles.actionIcon}
        >
            <path
                d='M3.2 20.8h4.5L19.2 9.3a2.1 2.1 0 0 0 0-3l-1.6-1.6a2.1 2.1 0 0 0-3 0L3.2 16.1v4.7zm11.9-14.9 1.6 1.6-9.2 9.2H5.9v-1.6l9.2-9.2z'
                fill='currentColor'
            />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg
            viewBox='0 0 24 24'
            aria-hidden='true'
            className={styles.actionIcon}
        >
            <path
                d='M8.5 3.8A1.8 1.8 0 0 0 6.7 5.6V7H4.4a1 1 0 1 0 0 2h.7l.8 10.3a2.6 2.6 0 0 0 2.6 2.4h7a2.6 2.6 0 0 0 2.6-2.4L18.9 9h.7a1 1 0 1 0 0-2h-2.3V5.6a1.8 1.8 0 0 0-1.8-1.8h-7zm.2 3.2V5.8h6.6V7H8.7zm1.2 4.1a1 1 0 0 1 1 1v5.3a1 1 0 1 1-2 0v-5.3a1 1 0 0 1 1-1zm4.2 0a1 1 0 0 1 1 1v5.3a1 1 0 1 1-2 0v-5.3a1 1 0 0 1 1-1z'
                fill='currentColor'
            />
        </svg>
    );
}

function ItemActions({
    item,
    isExpanded,
    onToggleDetails,
    onEdit,
    onDelete,
    locked,
}: {
    item: TreatmentItem;
    isExpanded: boolean;
    onToggleDetails: (itemId: number) => void;
    onEdit: (p: TreatmentItem) => void;
    onDelete: (id: number) => void;
    locked?: boolean;
}) {
    return (
        <div className={styles.procIconGroup}>
            <button
                type='button'
                className={`${styles.iconActionBtn} ${styles.iconEdit}`}
                onClick={() => onEdit(item)}
                aria-label='Editar item'
                title='Editar item'
                disabled={locked}
            >
                <PencilIcon />
            </button>
            <button
                type='button'
                className={`${styles.iconActionBtn} ${styles.iconDetail}`}
                onClick={() => onToggleDetails(item.id)}
                aria-label={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                title={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
            >
                <EyeIcon />
            </button>
            {!locked && (
                <button
                    type='button'
                    className={`${styles.iconActionBtn} ${styles.iconDelete}`}
                    onClick={() => onDelete(item.id)}
                    aria-label='Apagar item'
                    title='Apagar item'
                >
                    <TrashIcon />
                </button>
            )}
        </div>
    );
}

export default function OdontoProcedureCard({
    item,
    childItems,
    isExpanded,
    onToggleDetails,
    onEdit,
    onDelete,
    onMarkCompleted,
    locked,
}: Props) {
    const [expandedChildId, setExpandedChildId] = React.useState<number | null>(
        null,
    );
    const isProductContainer = childItems.length > 0;
    const ctx = item.dental_context;
    const itemLabel = item.service_name || item.custom_name || 'Tratamento';

    let cardTitle: string;
    let cardSubtitle: string | null = null;

    if (isProductContainer) {
        cardTitle = 'Produtos usados';
    } else if (ctx?.scope === 'tooth' && ctx.tooth_number) {
        cardTitle = itemLabel;
        cardSubtitle = `Dente ${ctx.tooth_number}${ctx.tooth_surface ? ` [${ctx.tooth_surface}]` : ''}`;
    } else if (ctx?.scope === 'arch' && ctx.arcade_arch) {
        const archLabel =
            ctx.arcade_arch === 'superior' ? 'Superior' : 'Inferior';
        cardTitle = itemLabel;
        cardSubtitle = `Arcada ${archLabel}`;
    } else if (ctx?.scope === 'full') {
        cardTitle = itemLabel;
        cardSubtitle = 'Arcada Superior e Inferior';
    } else {
        cardTitle = itemLabel;
    }

    return (
        <div className={styles.procItem}>
            <div className={styles.procMain}>
                <div className={styles.procInfoBlock}>
                    <div
                        className={
                            isProductContainer
                                ? styles.productsTitleRow
                                : styles.procTitleRow
                        }
                    >
                        <strong>{cardTitle}</strong>
                        {cardSubtitle && (
                            <p className={styles.textMuted}>{cardSubtitle}</p>
                        )}
                    </div>
                </div>
                {!isProductContainer && (
                    <div className={styles.procHeaderActions}>
                        <PaymentBadge
                            item={item}
                            onMarkCompleted={onMarkCompleted}
                        />
                        <ItemActions
                            item={item}
                            isExpanded={isExpanded}
                            onToggleDetails={onToggleDetails}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            locked={locked}
                        />
                    </div>
                )}
            </div>

            {isExpanded && !isProductContainer && (
                <div className={styles.procDetailsBox}>
                    {ctx?.scope === 'tooth' && (
                        <p className={styles.textMuted}>
                            <strong>Faces:</strong> {ctx.tooth_surface || '-'}
                        </p>
                    )}
                    {item.notes && (
                        <p className={styles.textMuted}>
                            <strong>Observações:</strong> {item.notes}
                        </p>
                    )}
                </div>
            )}

            {childItems.length > 0 && (
                <div className={styles.productsBlock}>
                    {childItems.map(child => {
                        const childExpanded = expandedChildId === child.id;
                        return (
                            <div key={child.id} className={styles.productRow}>
                                <div className={styles.procInfoBlock}>
                                    <div className={styles.procTitleRow}>
                                        <span>{child.custom_name}</span>
                                    </div>
                                </div>
                                <div className={styles.procHeaderActions}>
                                    <PaymentBadge
                                        item={child}
                                        onMarkCompleted={onMarkCompleted}
                                    />
                                    <ItemActions
                                        item={child}
                                        isExpanded={childExpanded}
                                        onToggleDetails={childId =>
                                            setExpandedChildId(
                                                childId === child.id &&
                                                    childExpanded
                                                    ? null
                                                    : childId,
                                            )
                                        }
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        locked={locked}
                                    />
                                </div>
                                {childExpanded && child.notes && (
                                    <div className={styles.procDetailsBox}>
                                        <p className={styles.textMuted}>
                                            <strong>Observações:</strong>{' '}
                                            {child.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
