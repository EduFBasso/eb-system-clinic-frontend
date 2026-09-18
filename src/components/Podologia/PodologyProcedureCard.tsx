import type { TreatmentItem } from '../../utils/TreatmentHelpers';
import { formatMoney } from '../../utils/TreatmentHelpers';
import { getPodologyRegionLabel } from './PodologyAnatomyHelpers';
import styles from '../Shared/TreatmentWorkspacePage/TreatmentWorkspacePage.module.css';

type Props = {
    item: TreatmentItem;
    onEdit: (item: TreatmentItem) => void;
    onDelete: (itemId: number) => void;
    /** True when the parent plan is printed and locked against edits. */
    locked?: boolean;
};

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
                <div className={styles.productActions}>
                    <button
                        type='button'
                        className={styles.btn}
                        onClick={() => onEdit(item)}
                        disabled={locked}
                    >
                        Editar
                    </button>
                    {!locked && (
                        <button
                            type='button'
                            className={styles.btnDanger}
                            onClick={() => onDelete(item.id)}
                        >
                            Excluir
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
