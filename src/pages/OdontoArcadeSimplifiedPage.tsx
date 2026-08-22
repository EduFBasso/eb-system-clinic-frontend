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
import { ORDERED_TEETH, planDisplayName } from './odontoArcadeHelpers';
import { on } from '../events/bus';
import styles from '../styles/pages/OdontoArcadeSimplifiedPage.module.css';

export default function OdontoArcadeSimplifiedPage() {
    const navigate = useNavigate();
    const { clientId } = useParams();

    const canAccess = true;
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

    React.useEffect(() => {
        return on('treatmentSettingsUpdated', settings => {
            if (typeof settings.showArchivedPlans === 'boolean') {
                plans.setShowArchivedPlans(settings.showArchivedPlans);
            }
            if (typeof settings.lockAfterPrint === 'boolean') {
                void plans.updateLockAfterPrint(settings.lockAfterPrint);
            }
        });
    }, [plans.setShowArchivedPlans, plans.updateLockAfterPrint]);

    return (
        <>
            <div className={styles.page}>
                {/* ── Page header ─────────────────────────────────────────── */}
                <header
                    className={
                        plans.plan
                            ? styles.planDetailPageHeader
                            : styles.planListPageHeader
                    }
                >
                    <div className={styles.headerInfo}>
                        <div className={styles.headerTitleRow}>
                            <h1
                                className={
                                    plans.plan
                                        ? styles.planListPageTitle
                                        : styles.planListPageTitle
                                }
                            >
                                {plans.plan
                                    ? planDisplayName(plans.plan)
                                    : 'Planos de Tratamento'}
                            </h1>
                            {!plans.plan && (
                                <button
                                    type='button'
                                    onClick={() => navigate('/')}
                                    className={styles.planListPageCloseBtn}
                                    aria-label='Voltar para clientes'
                                    title='Voltar para clientes'
                                >
                                    X
                                </button>
                            )}
                        </div>
                        {plans.plan && (
                            <p className={styles.patientName}>
                                {plans.clientName ?? `Cliente #${clientId}`}
                            </p>
                        )}
                    </div>
                </header>

                {plans.loading && <p className={styles.text}>Carregando...</p>}
                {!plans.loading && plans.error && (
                    <div className={styles.errorCard}>{plans.error}</div>
                )}

                {/* ── A: Plan list view (no plan selected) ────────────────── */}
                {!plans.loading && !plans.error && !plans.plan && (
                    <OdontoPlanListView
                        allPlans={plans.allPlans}
                        onSelect={id => void plans.selectPlan(id)}
                        onDelete={id => void plans.deletePlan(id)}
                        onCreateClick={() => plans.setPlanModalOpen(true)}
                    />
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
                        hasActiveModal={
                            plans.planModalOpen ||
                            itemFlows.serviceFlowOpen ||
                            itemFlows.productFlowOpen ||
                            itemFlows.editingItem !== null
                        }
                        onBack={plans.backToPlanList}
                        onMarkPrinted={() => void plans.markPrinted()}
                        onOpenService={itemFlows.openServiceFlowModal}
                        onOpenProduct={itemFlows.openProductFlowModal}
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
