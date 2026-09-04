import styles from '../Shared/TreatmentWorkspacePage/TreatmentWorkspacePage.module.css';

interface ProductItemCardProps {
    name: string;
    quantity: number;
    value: number;
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
    onEdit,
    onDelete,
    locked = false,
}: ProductItemCardProps) {
    return (
        <div className={styles.productItem}>
            <strong>{name}</strong>
            <span className={styles.textMuted}>
                {quantity}x — R$ {value.toFixed(2)}
            </span>
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
    );
}
