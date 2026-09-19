import type { TreatmentItem } from '../../utils/TreatmentHelpers';
import { formatMoney } from '../../utils/TreatmentHelpers';
import styles from '../Shared/TreatmentWorkspacePage/TreatmentWorkspacePage.module.css';

type Props = {
    item: TreatmentItem;
    childItems: TreatmentItem[];
    onEdit: (item: TreatmentItem) => void;
    onDelete: (itemId: number) => void;
    /** True when the parent plan is printed and locked against edits. */
    locked?: boolean;
};

function ItemActions({
    item,
    onEdit,
    onDelete,
    locked,
}: {
    item: TreatmentItem;
    onEdit: (p: TreatmentItem) => void;
    onDelete: (id: number) => void;
    locked?: boolean;
}) {
    return (
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
    );
}

export default function OdontoProcedureCard({
    item,
    childItems,
    onEdit,
    onDelete,
    locked,
}: Props) {
    const isProductContainer = childItems.length > 0;
    const ctx = item.dental_context;
    const itemLabel = item.service_name || item.custom_name || 'Tratamento';

    let anatomicalLabel: string | null = null;

    if (ctx?.scope === 'tooth' && ctx.tooth_number) {
        anatomicalLabel = `Dente ${ctx.tooth_number}`;
    } else if (ctx?.scope === 'arch' && ctx.arcade_arch) {
        const archLabel =
            ctx.arcade_arch === 'superior' ? 'Superior' : 'Inferior';
        anatomicalLabel = `Arcada ${archLabel}`;
    } else if (ctx?.scope === 'full') {
        anatomicalLabel = 'Arcada Superior e Inferior';
    } else if (item.kind === 'service' && !ctx) {
        anatomicalLabel = 'Outros';
    }

    return (
        <div
            className={`${styles.procItem} ${isProductContainer ? styles.productContainer : ''}`}
        >
            {!isProductContainer && (
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
                    <ItemActions
                        item={item}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        locked={locked}
                    />
                </div>
            )}

            {!isProductContainer && (
                <>
                    <div className={styles.clinicalDetails}>
                        {ctx?.scope === 'tooth' && ctx.tooth_surface && (
                            <p>
                                <strong>Face:</strong> {ctx.tooth_surface}
                            </p>
                        )}
                        {item.notes && (
                            <p>
                                <strong>Observação clínica:</strong>{' '}
                                {item.notes}
                            </p>
                        )}
                    </div>
                    <div className={styles.clinicalCardFooter}>
                        <strong className={styles.clinicalPrice}>
                            {formatMoney(item.patient_price)}
                        </strong>
                    </div>
                </>
            )}

            {childItems.length > 0 && (
                <div className={styles.productsBlock}>
                    {childItems.map(child => (
                        <div key={child.id} className={styles.productRow}>
                            <div className={styles.clinicalCardHeader}>
                                <strong className={styles.clinicalServiceName}>
                                    {child.custom_name}
                                </strong>
                                <ItemActions
                                    item={child}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    locked={locked}
                                />
                            </div>
                            {child.notes && (
                                <div className={styles.clinicalDetails}>
                                    <p>
                                        <strong>Observação clínica:</strong>{' '}
                                        {child.notes}
                                    </p>
                                </div>
                            )}
                            <div className={styles.clinicalDetails}>
                                <p>
                                    {child.quantity ?? 1}x —{' '}
                                    {formatMoney(child.patient_price)}
                                </p>
                            </div>
                            <div className={styles.clinicalCardFooter}>
                                <strong className={styles.clinicalPrice}>
                                    {formatMoney(
                                        Number(child.patient_price ?? 0) *
                                            Number(child.quantity ?? 1),
                                    )}
                                </strong>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
