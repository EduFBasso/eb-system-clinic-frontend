import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OdontoPlanCreateModal from '../components/odonto/OdontoPlanCreateModal';
import OdontoPrintView from '../components/odonto/OdontoPrintView';
import OdontoServiceModal from '../components/odonto/OdontoServiceModal';
import OdontoProductModal from '../components/odonto/OdontoProductModal';
import OdontoEditProcedureModal from '../components/odonto/OdontoEditProcedureModal';
import OdontoPlanListView from '../components/odonto/OdontoPlanListView';
import OdontoPlanWorkspace from '../components/odonto/OdontoPlanWorkspace';
import { useOdontoTreatmentPlans } from '../hooks/useOdontoTreatmentPlans';
import { useOdontoItemFlows } from '../hooks/useOdontoItemFlows';
import { useOdontoCatalogs } from '../hooks/useOdontoCatalogs';
import { hasOdontoAccess, ORDERED_TEETH } from './odontoArcadeHelpers';
import styles from '../styles/pages/OdontoArcadeSimplifiedPage.module.css';

export default function OdontoArcadeSimplifiedPage() {
    const navigate = useNavigate();
    const { clientId } = useParams();

    const canAccess = React.useMemo(() => hasOdontoAccess(), []);
    const numericClientId = React.useMemo(
        () => Number(clientId || 0),
        [clientId],
    );

    const plans = useOdontoTreatmentPlans(numericClientId, canAccess);
    const itemFlows = useOdontoItemFlows(
        plans.plan,
        plans.items,
        plans.loadPlan,
    );
    const catalogs = useOdontoCatalogs(
        itemFlows.serviceFlowOpen,
        itemFlows.productFlowOpen,
    );
    const [professionalVersion, setProfessionalVersion] = React.useState(0);
    const [profileModalOpen, setProfileModalOpen] = React.useState(false);

    if (!canAccess) {
        return (
            <div className={styles.page}>
                <h1 className={styles.title}>Arcada odontologica</h1>
                <p className={styles.text}>
                    Este modulo esta disponivel apenas para profissionais da
                    area odontologica.
                </p>
                <button
                    type='button'
                    onClick={() => navigate('/')}
                    className={styles.btn}
                >
                    Voltar
                </button>
            </div>
        );
    }

    return (
        <>
            <div className={styles.page}>
                {/* ── Page header ─────────────────────────────────────────── */}
                <header className={styles.headerCard}>
                    <div className={styles.headerInfo}>
                        <div className={styles.headerTitleRow}>
                            <h1 className={styles.title}>
                                Arcada odontologica
                            </h1>
                            <button
                                type='button'
                                onClick={() => navigate('/')}
                                className={styles.closeBtn}
                                aria-label='Voltar para clientes'
                                title='Voltar para clientes'
                            >
                                X
                            </button>
                        </div>
                        <p className={styles.subtitle}>
                            {plans.clientName ?? `Cliente #${clientId}`}
                        </p>
                    </div>

                    {/* Workspace action buttons — visible only when a plan is active */}
                    {plans.plan && (
                        <div className={styles.headerActions}>
                            <div className={styles.headerActionsBottomRow}>
                                <button
                                    type='button'
                                    onClick={() => setProfileModalOpen(true)}
                                    className={styles.btn}
                                >
                                    Dados da clínica
                                </button>
                                <button
                                    type='button'
                                    onClick={itemFlows.openServiceFlowModal}
                                    className={styles.btnPrimary}
                                    disabled={plans.isPlanLocked}
                                >
                                    Novo Tratamento
                                </button>
                                <button
                                    type='button'
                                    onClick={itemFlows.openProductFlowModal}
                                    className={styles.btnPrimary}
                                    disabled={plans.isPlanLocked}
                                >
                                    Novo Produto
                                </button>
                            </div>
                        </div>
                    )}
                    {!plans.plan && (
                        <div className={styles.headerActions}>
                            <button
                                type='button'
                                onClick={() => setProfileModalOpen(true)}
                                className={styles.btn}
                            >
                                Dados da clínica
                            </button>
                        </div>
                    )}
                </header>

                {plans.loading && <p className={styles.text}>Carregando...</p>}
                {!plans.loading && plans.error && (
                    <div className={styles.errorCard}>{plans.error}</div>
                )}

                {/* ── A: Plan list view (no plan selected) ────────────────── */}
                {!plans.loading && !plans.error && !plans.plan && (
                    <OdontoPlanListView
                        allPlans={plans.allPlans}
                        showArchivedPlans={plans.showArchivedPlans}
                        onShowArchivedPlansChange={plans.setShowArchivedPlans}
                        onSelect={id => void plans.selectPlan(id)}
                        onDelete={id => void plans.deletePlan(id)}
                        onCreateClick={() => plans.setPlanModalOpen(true)}
                    />
                )}

                {!plans.loading && !plans.error && (
                    <section className={styles.printLockPreference}>
                        <label className={styles.printLockToggle}>
                            <input
                                type='checkbox'
                                checked={plans.lockAfterPrint}
                                onChange={event =>
                                    void plans.updateLockAfterPrint(
                                        event.target.checked,
                                    )
                                }
                            />
                            <span>
                                <strong>Bloquear edição após imprimir?</strong>
                                <small>
                                    Quando ativo, a impressão trava este plano
                                    contra novas alterações. Planos já travados
                                    continuam protegidos.
                                </small>
                            </span>
                        </label>
                    </section>
                )}

                {/* ── B: Workspace (plan active) ───────────────────────────── */}
                {!plans.loading && !plans.error && plans.plan && (
                    <OdontoPlanWorkspace
                        key={plans.plan.id}
                        plan={plans.plan}
                        items={plans.items}
                        groupedItems={itemFlows.groupedItems}
                        activeToothNumbers={itemFlows.activeToothNumbers}
                        isPlanLocked={plans.isPlanLocked}
                        markingPrinted={plans.markingPrinted}
                        onBack={plans.backToPlanList}
                        onMarkPrinted={() => void plans.markPrinted()}
                        onSaveNotes={value => void plans.savePlanNotes(value)}
                        paymentCondition={plans.paymentCondition}
                        onPaymentConditionChange={plans.setPaymentCondition}
                        installmentsCount={plans.installmentsCount}
                        onInstallmentsCountChange={plans.setInstallmentsCount}
                        firstDueDate={plans.firstDueDate}
                        onFirstDueDateChange={plans.setFirstDueDate}
                        installmentValue={plans.installmentValue}
                        planTotal={plans.planTotal}
                        expandedItemIds={itemFlows.expandedItemIds}
                        onToggleDetails={itemFlows.toggleItemDetails}
                        onEditItem={itemFlows.openEditItem}
                        onDeleteItem={id => void itemFlows.deleteItem(id)}
                        onMarkItemCompleted={id =>
                            void itemFlows.markItemCompleted(id)
                        }
                    />
                )}

                {/* ── Modals ───────────────────────────────────────────────── */}
                <OdontoPlanCreateModal
                    open={plans.planModalOpen}
                    saving={plans.savingCreatePlan}
                    onClose={() => plans.setPlanModalOpen(false)}
                    onSave={data => void plans.createPlan(data)}
                    onProfileSaved={() =>
                        setProfessionalVersion(version => version + 1)
                    }
                />

                <OdontoPlanCreateModal
                    open={profileModalOpen}
                    saving={false}
                    profileOnly
                    onClose={() => setProfileModalOpen(false)}
                    onSave={() => undefined}
                    onProfileSaved={() =>
                        setProfessionalVersion(version => version + 1)
                    }
                />

                <OdontoServiceModal
                    open={itemFlows.serviceFlowOpen}
                    saving={itemFlows.savingServiceFlow}
                    flowType={itemFlows.serviceFlowType}
                    serviceRows={itemFlows.serviceRows}
                    orderedTeeth={ORDERED_TEETH}
                    serviceCatalog={catalogs.serviceCatalog}
                    savingSuggestionIndex={catalogs.savingSuggestionIndex}
                    onClose={itemFlows.closeServiceFlowModal}
                    onSave={() => void itemFlows.saveServiceFlow()}
                    onFlowTypeChange={itemFlows.changeServiceFlowType}
                    onUpdateRow={itemFlows.updateServiceRow}
                    onToggleToothRow={itemFlows.toggleToothServiceRow}
                    onAddItem={itemFlows.addServiceRow}
                    onSaveSuggestion={index =>
                        void catalogs.saveTreatmentSuggestion(
                            itemFlows.serviceRows[index],
                            index,
                            itemFlows.serviceFlowType,
                        )
                    }
                    onDeleteFromCatalog={serviceId =>
                        void catalogs.deleteFromCatalog(serviceId)
                    }
                />

                <OdontoProductModal
                    open={itemFlows.productFlowOpen}
                    saving={itemFlows.savingProductFlow}
                    productRows={itemFlows.productRows}
                    productCatalog={catalogs.productCatalog}
                    savingSuggestionIndex={
                        catalogs.savingProductSuggestionIndex
                    }
                    onClose={itemFlows.closeProductFlowModal}
                    onSave={() => void itemFlows.saveProductFlow()}
                    onRowsChange={itemFlows.setProductRows}
                    onSaveSuggestion={index =>
                        void catalogs.saveProductNameSuggestion(
                            itemFlows.productRows[index],
                            index,
                        )
                    }
                />

                <OdontoEditProcedureModal
                    item={itemFlows.editingItem}
                    name={itemFlows.editingItemName}
                    value={itemFlows.editingItemValue}
                    notes={itemFlows.editingItemNotes}
                    saving={itemFlows.savingEditItem}
                    onNameChange={itemFlows.setEditingItemName}
                    onValueChange={itemFlows.setEditingItemValue}
                    onNotesChange={itemFlows.setEditingItemNotes}
                    onClose={itemFlows.closeEditItemModal}
                    onSave={() => void itemFlows.saveEditedItem()}
                />
            </div>

            {/* Print view rendered outside .page so @media print can show it
                even though .page itself is hidden (display:none !important). */}
            <OdontoPrintView
                plan={plans.plan}
                items={plans.items}
                clientName={plans.clientName}
                paymentCondition={plans.paymentCondition}
                installmentsCount={plans.installmentsCount}
                installmentValue={plans.installmentValue}
                firstDueDate={plans.firstDueDate}
                planTotal={plans.planTotal}
                professionalVersion={professionalVersion}
            />
        </>
    );
}
