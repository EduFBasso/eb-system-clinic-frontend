import React from 'react';
import { PodologyMemberGrid } from './PodologyMemberGrid';
import PodologyServiceModal from './PodologyServiceModal';
import PodologyProductModal from './PodologyProductModal';
import styles from '../../pages/TreatmentWorkspacePage.module.css';

interface PodologyPlanWorkspaceProps {
    planId?: number;
    isPlanLocked?: boolean;
}

export default function PodologyPlanWorkspace({
    planId,
    isPlanLocked = false,
}: PodologyPlanWorkspaceProps) {
    // Estado dos modais espelha o mesmo formato de useOdontoItemFlows — a
    // busca/gravação real dos itens de podologia é lógica de persistência da Fase 4.
    const [serviceModalOpen, setServiceModalOpen] = React.useState(false);
    const [productModalOpen, setProductModalOpen] = React.useState(false);

    return (
        <>
            <section className={`${styles.card} ${styles.arcadeMapCard}`}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>
                        Mapa dos Membros (Mãos e Pés)
                    </h2>
                </div>
                <PodologyMemberGrid />
            </section>

            <section className={styles.card}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>Procedimentos</h2>
                    <button
                        type='button'
                        className={styles.btnPrimary}
                        onClick={() => setServiceModalOpen(true)}
                        disabled={isPlanLocked}
                    >
                        Novo Procedimento
                    </button>
                </div>
                <p className={styles.textMuted}>
                    Plano #{planId} — lista de procedimentos ainda pendente
                    (Fase 4).
                </p>
            </section>

            <section className={styles.card}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>Produtos</h2>
                    <button
                        type='button'
                        className={styles.btnPrimary}
                        onClick={() => setProductModalOpen(true)}
                        disabled={isPlanLocked}
                    >
                        Novo Produto
                    </button>
                </div>
                {/* ProductItemCard neutro entra na lista aqui assim que a Fase 4 trouxer os itens reais */}
                <p className={styles.textMuted}>Nenhum produto cadastrado.</p>
            </section>

            <PodologyServiceModal
                open={serviceModalOpen}
                onClose={() => setServiceModalOpen(false)}
            />
            <PodologyProductModal
                open={productModalOpen}
                onClose={() => setProductModalOpen(false)}
            />
        </>
    );
}
