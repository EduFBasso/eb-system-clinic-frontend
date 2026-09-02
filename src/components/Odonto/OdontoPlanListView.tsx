import type { PlanListItem } from '../../utils/TreatmentHelpers';
import OdontoPlanCard from './OdontoPlanCard';
import styles from '../../pages/TreatmentWorkspacePage.module.css';

type Props = {
    allPlans: PlanListItem[];
    onSelect: (id: number) => void;
    onDelete: (id: number) => void;
    onCreateClick: () => void;
};

export default function OdontoPlanListView({
    allPlans,
    onSelect,
    onDelete,
    onCreateClick,
}: Props) {
    return (
        <>
            <div className={styles.planListHeader}>
                <button
                    type='button'
                    className={styles.btnPrimary}
                    onClick={onCreateClick}
                >
                    + Novo Plano
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
        </>
    );
}
