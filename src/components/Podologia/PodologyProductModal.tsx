import { AppModal } from '../Modal/Modal';
import styles from '../../styles/pages/OdontoArcadeSimplifiedPage.module.css';

interface PodologyProductModalProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Modal de insumos/produtos de estoque usados no plano de podologia.
 * Estrutura preparada na Fase 3 — CRUD real fica para a Fase 4.
 */
export default function PodologyProductModal({
    open,
    onClose,
}: PodologyProductModalProps) {
    return (
        <AppModal open={open} onClose={onClose}>
            <div style={{ padding: 16 }}>
                <h2 className={styles.sectionTitle}>Novo Produto</h2>
                <p className={styles.textMuted}>
                    Em construção — vínculo com o catálogo de estoque previsto
                    para a Fase 4.
                </p>
            </div>
        </AppModal>
    );
}
