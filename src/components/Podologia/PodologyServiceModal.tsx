import React from 'react';
import { AppModal } from '../Modal/Modal';
import styles from '../../styles/pages/OdontoArcadeSimplifiedPage.module.css';

interface PodologyServiceModalProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Modal de procedimentos de podologia (dedos/mãos/pés).
 * Estrutura preparada na Fase 3 — CRUD real via podology_context fica para a Fase 4.
 */
export default function PodologyServiceModal({
    open,
    onClose,
}: PodologyServiceModalProps) {
    return (
        <AppModal open={open} onClose={onClose}>
            <div style={{ padding: 16 }}>
                <h2 className={styles.sectionTitle}>Novo Procedimento</h2>
                <p className={styles.textMuted}>
                    Em construção — persistência via podology_context prevista
                    para a Fase 4.
                </p>
            </div>
        </AppModal>
    );
}
