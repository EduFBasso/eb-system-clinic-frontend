import React from 'react';
import { PodologyMemberGrid } from './PodologyMemberGrid';
import PodologyProcedureCard from './PodologyProcedureCard';
import PodologyServiceModal from './PodologyServiceModal';
import PodologyProductModal from './PodologyProductModal';
import PodologyEditProcedureModal from './PodologyEditProcedureModal';
import ProductItemCard from './ProductItemCard';
import { usePodologyItemFlows } from './usePodologyItemFlows';
import { useClinicalCatalogs } from '../../hooks/useClinicalCatalogs';
import { formatMoney } from '../../utils/TreatmentHelpers';
import type {
    PaymentCondition,
    PlanListItem,
    TreatmentItem,
} from '../../utils/TreatmentHelpers';
import styles from '../../pages/TreatmentWorkspacePage.module.css';

type Props = {
    plan: PlanListItem;
    items: TreatmentItem[];
    isPlanLocked: boolean;
    markingPrinted: boolean;
    onBack: () => void;
    onMarkPrinted: () => void;
    /** Recarrega plano+itens após qualquer alteração feita pelos modais internos. */
    onRefreshPlan: () => Promise<void>;
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
};

export default function PodologyPlanWorkspace({
    plan,
    items,
    isPlanLocked,
    markingPrinted,
    onBack,
    onMarkPrinted,
    onRefreshPlan,
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
}: Props) {
    const [mapVisible, setMapVisible] = React.useState(false);

    // Modais de procedimento/produto/edição são exclusivos do domínio Podologia e
    // vivem só aqui — a página pai não conhece mais esse estado.
    const itemFlows = usePodologyItemFlows(plan, items, onRefreshPlan);
    const catalogs = useClinicalCatalogs(
        itemFlows.serviceFlowOpen,
        itemFlows.productFlowOpen,
        itemFlows.editingItem !== null,
    );
    const hasActiveModal =
        itemFlows.serviceFlowOpen ||
        itemFlows.productFlowOpen ||
        itemFlows.editingItem !== null;
    const groupedItems = itemFlows.groupedItems;
    const activeRegionIds = itemFlows.activeRegionIds;
    const onEditItem = itemFlows.openEditItem;
    const onDeleteItem = (id: number) => void itemFlows.deleteItem(id);

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

    function renderTreatmentGroups(groups: typeof groupedItems) {
        return (
            <div className={styles.groupList}>
                {groups.map(group => (
                    <div key={group.key} className={styles.groupCard}>
                        <strong className={styles.groupDate}>
                            {group.label}
                        </strong>
                        {group.items.map(item => (
                            <PodologyProcedureCard
                                key={item.id}
                                item={item}
                                onEdit={onEditItem}
                                onDelete={onDeleteItem}
                                locked={isPlanLocked}
                            />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    function renderProductGroups(groups: typeof groupedItems) {
        return (
            <div className={styles.groupList}>
                {groups.map(group => (
                    <div key={group.key} className={styles.groupCard}>
                        <strong className={styles.groupDate}>
                            {group.label}
                        </strong>
                        {/* Cada grupo é o item "Produtos usados" (wrapper); os produtos
                            de verdade são os filhos (parent_item) desse wrapper. */}
                        {group.items.flatMap(wrapper =>
                            items
                                .filter(
                                    candidate =>
                                        candidate.parent_item === wrapper.id,
                                )
                                .map(child => (
                                    <ProductItemCard
                                        key={child.id}
                                        name={child.custom_name}
                                        quantity={1}
                                        value={Number(child.patient_price ?? 0)}
                                        onEdit={() => onEditItem(child)}
                                        onDelete={() => onDeleteItem(child.id)}
                                        locked={isPlanLocked}
                                    />
                                )),
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
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

            {/* Members map */}
            <section className={`${styles.card} ${styles.arcadeMapCard}`}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>
                        Mapa dos Membros (Mãos e Pés)
                    </h2>
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
                        <PodologyMemberGrid
                            selectedIds={Array.from(activeRegionIds)}
                            readOnly
                        />
                    </div>
                )}
            </section>

            {/* Procedures list */}
            <section className={styles.card}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>Procedimentos</h2>
                    <button
                        type='button'
                        className={styles.btnPrimary}
                        onClick={itemFlows.openServiceFlowModal}
                        disabled={isPlanLocked}
                    >
                        Novo Procedimento
                    </button>
                </div>
                {treatmentGroups.length === 0 ? (
                    <p className={styles.textMuted}>
                        Nenhum procedimento cadastrado.
                    </p>
                ) : (
                    renderTreatmentGroups(treatmentGroups)
                )}
            </section>

            {/* Products list */}
            <section className={styles.card}>
                <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionTitle}>Produtos</h2>
                    <button
                        type='button'
                        className={styles.btnPrimary}
                        onClick={itemFlows.openProductFlowModal}
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
                    renderProductGroups(productGroups)
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

            {/* Modais exclusivos do domínio Podologia — desacoplados da página pai */}
            <PodologyServiceModal
                open={itemFlows.serviceFlowOpen}
                saving={itemFlows.savingServiceFlow || catalogs.savingCatalog}
                serviceRows={itemFlows.serviceRows}
                serviceCatalog={catalogs.serviceCatalog}
                onClose={itemFlows.closeServiceFlowModal}
                onSave={async catalogIndexes => {
                    const resolvedRows =
                        await catalogs.saveNewServicesToCatalog(
                            itemFlows.serviceRows,
                            catalogIndexes,
                        );
                    if (resolvedRows)
                        await itemFlows.saveServiceFlow(resolvedRows);
                }}
                onToggleRegion={itemFlows.toggleRegionRow}
                onUpdateRow={itemFlows.updateServiceRow}
                onAddGeneralRow={itemFlows.addGeneralRow}
                onRemoveRow={itemFlows.removeServiceRow}
                onDeleteFromCatalog={serviceId =>
                    void catalogs.deleteFromCatalog(serviceId)
                }
            />

            <PodologyProductModal
                open={itemFlows.productFlowOpen}
                saving={itemFlows.savingProductFlow || catalogs.savingCatalog}
                productRows={itemFlows.productRows}
                productCatalog={catalogs.productCatalog}
                onClose={itemFlows.closeProductFlowModal}
                onSave={async catalogIndexes => {
                    const saved = await catalogs.saveNewProductsToCatalog(
                        itemFlows.productRows,
                        catalogIndexes,
                    );
                    if (saved) await itemFlows.saveProductFlow();
                }}
                onRowsChange={itemFlows.setProductRows}
            />

            <PodologyEditProcedureModal
                item={itemFlows.editingItem}
                name={itemFlows.editingItemName}
                value={itemFlows.editingItemValue}
                notes={itemFlows.editingItemNotes}
                saving={itemFlows.savingEditItem}
                onValueChange={itemFlows.setEditingItemValue}
                onNotesChange={itemFlows.setEditingItemNotes}
                onClose={itemFlows.closeEditItemModal}
                onSave={() => void itemFlows.saveEditedItem()}
            />
        </>
    );
}
