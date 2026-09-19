import styles from '../Shared/TreatmentWorkspacePage/TreatmentWorkspacePage.module.css';
import { formatMoney } from '../../utils/TreatmentHelpers';

interface ProductItemCardProps {
    name: string;
    quantity: number;
    value: number;
    notes?: string;
    onEdit?: () => void;
    onDelete?: () => void;
    locked?: boolean;
}

/**
 * Card neutro de item de estoque (insumo/produto), sem contexto anatômico.
 * Compartilhável entre especialidades — hoje usado só pela Podologia; promover
 * para uma pasta core caso o Odonto passe a consumi-lo também.
 */
export default function ProductItemCard({
    name,
    quantity,
    value,
    notes,
    onEdit,
    onDelete,
    locked = false,
}: ProductItemCardProps) {
    return (
        <div className={styles.procItem}>
            <div className={styles.clinicalCardHeader}>
                <strong className={styles.clinicalServiceName}>{name}</strong>
                {!locked && (onEdit || onDelete) && (
                    <div className={styles.productActions}>
                        {onEdit && (
                            <button
                                type='button'
                                className={styles.btn}
                                onClick={onEdit}
                            >
                                Editar
                            </button>
                        )}
                        {onDelete && (
                            <button
                                type='button'
                                className={styles.btnDanger}
                                onClick={onDelete}
                            >
                                Excluir
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div className={styles.clinicalDetails}>
                {notes && <p>{notes}</p>}
                <p>
                    {quantity}x — {formatMoney(value)}
                </p>
            </div>
            <div className={styles.clinicalCardFooter}>
                <strong className={styles.clinicalPrice}>
                    {formatMoney(value * quantity)}
                </strong>
            </div>
        </div>
    );
}
