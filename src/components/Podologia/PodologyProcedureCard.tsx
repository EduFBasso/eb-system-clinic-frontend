import type { TreatmentItem } from '../../utils/TreatmentHelpers';
import { formatMoney } from '../../utils/TreatmentHelpers';
import {
    PODOLOGY_SCOPE_OPTIONS,
    getPodologyRegionLabel,
} from './PodologyAnatomyHelpers';
import styles from '../../pages/TreatmentWorkspacePage.module.css';

type Props = {
    item: TreatmentItem;
    onEdit: (item: TreatmentItem) => void;
    onDelete: (itemId: number) => void;
    /** True when the parent plan is printed and locked against edits. */
    locked?: boolean;
};

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

export default function PodologyProcedureCard({
    item,
    onEdit,
    onDelete,
    locked,
}: Props) {
    const ctx = item.podology_context;
    const itemLabel = item.service_name || item.custom_name || 'Procedimento';
    const anatomicalLabel = ctx
        ? getPodologyRegionLabel(ctx.scope, ctx.location_number)
        : null;

    return (
        <div className={styles.procItem}>
            <div className={styles.clinicalCardHeader}>
                <div className={styles.clinicalIdentity}>
                    {anatomicalLabel && (
                        <strong className={styles.anatomicalLabel}>
                            {anatomicalLabel}
                        </strong>
                    )}
                    <strong className={styles.clinicalServiceName}>
                        {itemLabel}
                    </strong>
                </div>
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
            </div>

            <div className={styles.clinicalDetails}>
                {item.notes && (
                    <p>
                        <strong>Observação clínica:</strong> {item.notes}
                    </p>
                )}
            </div>
            <div className={styles.clinicalCardFooter}>
                <strong className={styles.clinicalPrice}>
                    {formatMoney(item.patient_price)}
                </strong>
            </div>
        </div>
    );
}
