import type { PlanListItem } from '../../pages/odontoArcadeHelpers';
import OdontoPlanCard from './OdontoPlanCard';
import styles from '../../styles/pages/OdontoArcadeSimplifiedPage.module.css';

type Props = {
    allPlans: PlanListItem[];
    showArchivedPlans: boolean;
    onShowArchivedPlansChange: (show: boolean) => void;
    onSelect: (id: number) => void;
    onDelete: (id: number) => void;
    onCreateClick: () => void;
};

export default function OdontoPlanListView({
    allPlans,
    showArchivedPlans,
    onShowArchivedPlansChange,
    onSelect,
    onDelete,
    onCreateClick,
}: Props) {
    return (
        <>
            <div className={styles.planListHeader}>
                <h2 className={styles.sectionTitle}>Planos de Tratamento</h2>
                <button
                    type='button'
                    className={styles.btnPrimary}
                    onClick={onCreateClick}
                >
                    + Criar Novo Plano
                </button>
            </div>

            {allPlans.length === 0 ? (
                <div className={styles.emptyCard}>
                    <p className={styles.text}>
                        Nenhum plano cadastrado para este paciente.
                    </p>
                </div>
            ) : (
                <div className={styles.planList}>
                    {allPlans.map(p => (
                        <OdontoPlanCard
                            key={p.id}
                            plan={p}
                            onSelect={id => onSelect(id)}
                            onDelete={id => onDelete(id)}
                        />
                    ))}
                </div>
            )}

            <label className={styles.archivedPlansToggle}>
                <input
                    type='checkbox'
                    checked={showArchivedPlans}
                    onChange={event =>
                        onShowArchivedPlansChange(event.target.checked)
                    }
                />
                <span>
                    <strong>Mostrar planos arquivados</strong>
                    <small>
                        Planos removidos com tratamentos ficam arquivados para
                        preservar o histórico e permanecem ocultos por padrão.
                    </small>
                </span>
            </label>
        </>
    );
}
