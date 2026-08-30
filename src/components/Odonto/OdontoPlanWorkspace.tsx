import React from 'react';

import { PodologiaFootGrid } from '../Podologia/PodologiaFootGrid';
import { OdontoToothGrid } from '../OdontoToothGrid/OdontoToothGrid';

import OdontoProcedureCard from './OdontoProcedureCard';
import { formatMoney, ORDERED_TEETH } from '../../pages/odontoArcadeHelpers';
import type {
    ItemGroup,
    PaymentCondition,
    PlanListItem,
    TreatmentItem,
} from '../../pages/odontoArcadeHelpers';
import styles from '../../styles/pages/OdontoArcadeSimplifiedPage.module.css';

type Props = {
    plan: PlanListItem;
    items: TreatmentItem[];
    groupedItems: ItemGroup[];
    activeToothNumbers: Set<number>;
    isPlanLocked: boolean;
    markingPrinted: boolean;
    hasActiveModal: boolean;
    onBack: () => void;
    onMarkPrinted: () => void;
    onOpenService: () => void;
    onOpenProduct: () => void;
    notes: string;
    onNotesChange: (value: string) => void;
    savingPlanDetails: boolean;
    planDetailsDirty: boolean;
    onCancelPlanDetails: () => void;
    onSavePlanDetails: () => void;

    paymentCondition: PaymentCondition;
    onPaymentConditionChange: (value: PaymentCondition) => void;
    installmentsCount: number;
    onInstallmentsCountChange: (value: number) => void;
    firstDueDate: string;
    onFirstDueDateChange: (value: string) => void;
    installmentValue: number;
    planTotal: number;

    onEditItem: (item: TreatmentItem) => void;
    onDeleteItem: (id: number) => void;
};

export default function OdontoPlanWorkspace({
    plan,
    items,
    groupedItems,
    activeToothNumbers,
    isPlanLocked,
    markingPrinted,
    hasActiveModal,
    onBack,
    onMarkPrinted,
    onOpenService,
    onOpenProduct,
    notes,
    onNotesChange,
    savingPlanDetails,
    planDetailsDirty,
    onCancelPlanDetails,
    onSavePlanDetails,
    paymentCondition,
    onPaymentConditionChange,
    installmentsCount,
    onInstallmentsCountChange,
    firstDueDate,
    onFirstDueDateChange,
    installmentValue,
    planTotal,
    onEditItem,
    onDeleteItem,
}: Props) {
    const [mapVisible, setMapVisible] = React.useState(false);

    const productParentIds = new Set(
        items
            .filter(item => item.parent_item != null)
            .map(item => item.parent_item as number),
    );
    const treatmentGroups = groupedItems
        .map(group => ({
            ...group,
            items: group.items.filter(
                item =>
                    !productParentIds.has(item.id) &&
                    !(
                        item.kind === 'service' &&
                        item.custom_name.trim() === 'Produtos usados'
                    ),
            ),
        }))
        .filter(group => group.items.length > 0);
    const productGroups = groupedItems
        .map(group => ({
            ...group,
            items: group.items.filter(item => productParentIds.has(item.id)),
        }))
        .filter(group => group.items.length > 0);

    function renderGroups(groups: ItemGroup[]) {
        return (
            <div className={styles.groupList}>
                {groups.map(group => (
                    <div key={group.key} className={styles.groupCard}>
                        <strong className={styles.groupDate}>
                            {group.label}
                        </strong>
                        {group.items.map(item => {
                            const children = items.filter(
                                candidate => candidate.parent_item === item.id,
                            );
                            return (
                                <OdontoProcedureCard
                                    key={item.id}
                                    item={item}
                                    childItems={children}
                                    onEdit={onEditItem}
                                    onDelete={onDeleteItem}
                                    locked={isPlanLocked}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    }

    // --- Circuitos Lógicos de Capabilities ---
    const storedProf = localStorage.getItem('loggedProfessional');
    const profJson = storedProf ? JSON.parse(storedProf) : null;

    // Lendo a propriedade 'specialty' direto da raiz do JSON!
    const isOdonto = profJson?.specialty === 'Odontologia';
    const isPodologia = profJson?.specialty === 'Podologia';

    return (
        <>
            {/* Plan workspace header */}
            <div className={styles.planWorkspaceHeader}>
                <button type='button' className={styles.btn} onClick={onBack}>
                    ← Planos
                </button>
            </div>

            {isPlanLocked && (
                <div className={styles.lockedBanner}>
                    Este orçamento foi impresso em{' '}
                    {plan.printed_at
                        ? new Date(plan.printed_at).toLocaleString('pt-BR')
                        : 'data anterior não registrada'}{' '}
                    e está travado para segurança histórica. Para novas
                    alterações, crie um novo plano.
                </div>
            )}

            {/* Arcade map */}
            <section className={`${styles.card} ${styles.arcadeMapCard}`}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>Mapa da arcada</h2>
                    <button
                        type='button'
                        className={styles.viewBtn}
                        onClick={() => setMapVisible(prev => !prev)}
                        aria-label={mapVisible ? 'Ocultar mapa' : 'Ver mapa'}
                    >
                        <svg
                            viewBox='0 0 24 24'
                            aria-hidden='true'
                            className={styles.viewIcon}
                        >
                            <path
                                d='M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='1.8'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                            <circle
                                cx='12'
                                cy='12'
                                r='3.2'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='1.8'
                            />
                        </svg>
                        {mapVisible ? 'Ocultar' : 'Ver'}
                    </button>
                </div>
                {mapVisible && (
                    <div className={styles.gridWrap}>
                        {/* Se o consultório ativo for de odontologia, mostra os dentes */}
                        {isOdonto && (
                            <OdontoToothGrid
                                orderedTeeth={ORDERED_TEETH}
                                selectedToothNumber={null}
                                suppressDateHighlights={false}
                                activeDateToothNumbers={activeToothNumbers}
                                readOnly
                            />
                        )}

                        {/* Se o consultório ativo for de podologia, mostra o pezinho interativo! */}
                        {isPodologia && <PodologiaFootGrid />}
                    </div>
                )}
            </section>

            {/* Treatments list */}
            <section className={styles.card}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>Tratamentos</h2>
                    <button
                        type='button'
                        className={styles.btnPrimary}
                        onClick={onOpenService}
                        disabled={isPlanLocked}
                    >
                        Novo Tratamento
                    </button>
                </div>
                {treatmentGroups.length === 0 ? (
                    <p className={styles.textMuted}>
                        Nenhum tratamento cadastrado.
                    </p>
                ) : (
                    renderGroups(treatmentGroups)
                )}
            </section>

            {/* Products list */}
            <section className={styles.card}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>Produtos</h2>
                    <button
                        type='button'
                        className={styles.btnPrimary}
                        onClick={onOpenProduct}
                        disabled={isPlanLocked}
                    >
                        Novo Produto
                    </button>
                </div>
                {productGroups.length === 0 ? (
                    <p className={styles.textMuted}>
                        Nenhum produto cadastrado.
                    </p>
                ) : (
                    renderGroups(productGroups)
                )}
            </section>

            {/* General plan observations */}
            <section className={styles.card}>
                <label className={styles.labelWide}>
                    <span className={styles.sectionTitle}>
                        Observações Gerais
                    </span>
                    <textarea
                        className={`${styles.textarea} ${styles.planNotes}`}
                        rows={3}
                        value={notes}
                        placeholder='Observações clínicas, orientações e condições especiais…'
                        onChange={event => onNotesChange(event.target.value)}
                        disabled={isPlanLocked}
                    />
                </label>
            </section>

            {/* Payment condition selector */}
            <section className={`${styles.card} ${styles.paymentCard}`}>
                <h2 className={styles.sectionTitle}>Condição de Pagamento</h2>
                <div className={styles.paymentContent}>
                    <div className={styles.paymentConditionRow}>
                        <label className={styles.paymentRadioLabel}>
                            <input
                                type='radio'
                                name='paymentCondition'
                                checked={paymentCondition === 'avista'}
                                onChange={() =>
                                    onPaymentConditionChange('avista')
                                }
                                disabled={isPlanLocked}
                            />
                            À Vista
                        </label>
                        <label className={styles.paymentRadioLabel}>
                            <input
                                type='radio'
                                name='paymentCondition'
                                checked={paymentCondition === 'aprazo'}
                                onChange={() =>
                                    onPaymentConditionChange('aprazo')
                                }
                                disabled={isPlanLocked}
                            />
                            A Prazo
                        </label>
                    </div>

                    {paymentCondition === 'aprazo' && (
                        <div className={styles.paymentFields}>
                            <label className={styles.label}>
                                Número de Parcelas
                                <input
                                    className={styles.input}
                                    type='number'
                                    min={2}
                                    max={24}
                                    value={installmentsCount}
                                    onChange={e =>
                                        onInstallmentsCountChange(
                                            Math.max(
                                                1,
                                                Number(e.target.value) || 1,
                                            ),
                                        )
                                    }
                                    disabled={isPlanLocked}
                                />
                            </label>
                            <label className={styles.label}>
                                Vencimento da 1ª Parcela
                                <input
                                    className={styles.input}
                                    type='date'
                                    value={firstDueDate}
                                    onChange={e =>
                                        onFirstDueDateChange(e.target.value)
                                    }
                                    disabled={isPlanLocked}
                                />
                            </label>
                            <p className={styles.installmentPreview}>
                                {installmentsCount}x de{' '}
                                <strong>{formatMoney(installmentValue)}</strong>
                            </p>
                        </div>
                    )}

                    <div className={styles.paymentTotalRow}>
                        <span>Total</span>
                        <strong>{formatMoney(planTotal)}</strong>
                        {paymentCondition === 'avista' && <span>à vista</span>}
                    </div>
                </div>
            </section>

            {!isPlanLocked && planDetailsDirty && (
                <div className={styles.planDetailsActions}>
                    <button
                        type='button'
                        className={styles.btnDanger}
                        onClick={onCancelPlanDetails}
                        disabled={savingPlanDetails}
                    >
                        Cancelar alterações
                    </button>
                    <button
                        type='button'
                        className={styles.btnPrimary}
                        onClick={onSavePlanDetails}
                        disabled={savingPlanDetails}
                    >
                        {savingPlanDetails
                            ? 'Salvando...'
                            : 'Salvar alterações'}
                    </button>
                </div>
            )}

            {!hasActiveModal && (
                <footer className={styles.planWorkspaceFooter}>
                    <button
                        type='button'
                        className={styles.btnPrimary}
                        onClick={onMarkPrinted}
                        disabled={markingPrinted}
                        aria-label='Imprimir orçamento A4'
                    >
                        Imprimir
                    </button>
                </footer>
            )}
        </>
    );
}
