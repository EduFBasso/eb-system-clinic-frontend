import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
    const [searchParams, setSearchParams] = useSearchParams();

    const canAccess = true;
    const numericClientId = React.useMemo(
        () => Number(clientId || 0),
        [clientId],
    );

    const initialPlanId = React.useMemo(() => {
        const value = Number(searchParams.get('plan'));
        return Number.isInteger(value) && value > 0 ? value : null;
    }, [searchParams]);
    const plans = useOdontoTreatmentPlans(
        numericClientId,
        canAccess,
        initialPlanId,
    );
    const itemFlows = useOdontoItemFlows(
        plans.plan,
        plans.items,
        plans.loadPlan,
    );
    const catalogs = useOdontoCatalogs(
        itemFlows.serviceFlowOpen,
        itemFlows.productFlowOpen,
        itemFlows.editingItem !== null,
    );
    const [professionalVersion, setProfessionalVersion] = React.useState(0);

    React.useEffect(() => {
        if (plans.loading) return;
        const currentPlanId = searchParams.get('plan');
        const nextPlanId = plans.plan ? String(plans.plan.id) : null;
        if (currentPlanId === nextPlanId) return;
        setSearchParams(
            previous => {
                const next = new URLSearchParams(previous);
                if (nextPlanId) next.set('plan', nextPlanId);
                else next.delete('plan');
                return next;
            },
            { replace: true },
        );
    }, [plans.loading, plans.plan, searchParams, setSearchParams]);

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
                {(!plans.plan || !plans.isPlanLocked) && (
                    <header
                        className={
                            plans.plan
                                ? styles.planDetailPageHeader
                                : styles.planListPageHeader
                        }
                    >
                        <div className={styles.headerInfo}>
                            <div className={styles.headerTitleRow}>
                                <h1 className={styles.planListPageTitle}>
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
                            <p className={styles.patientName}>
                                {plans.clientName ?? `Cliente #${clientId}`}
                            </p>
                        </div>
                    </header>
                )}

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
                {!plans.loading &&
                    !plans.error &&
                    plans.plan &&
                    !plans.isPlanLocked && (
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
                            notes={plans.planNotes}
                            onNotesChange={plans.setPlanNotes}
                            savingPlanDetails={plans.savingPlanDetails}
                            planDetailsDirty={plans.isPlanDetailsDirty}
                            onCancelPlanDetails={plans.cancelPlanDetails}
                            onSavePlanDetails={() =>
                                void plans.savePlanDetails()
                            }
                            paymentCondition={plans.paymentCondition}
                            onPaymentConditionChange={plans.setPaymentCondition}
                            installmentsCount={plans.installmentsCount}
                            onInstallmentsCountChange={
                                plans.setInstallmentsCount
                            }
                            firstDueDate={plans.firstDueDate}
                            onFirstDueDateChange={plans.setFirstDueDate}
                            installmentValue={plans.installmentValue}
                            planTotal={plans.planTotal}
                            onEditItem={itemFlows.openEditItem}
                            onDeleteItem={id => void itemFlows.deleteItem(id)}
                        />
                    )}

                {!plans.loading &&
                    !plans.error &&
                    plans.plan &&
                    plans.isPlanLocked && (
                        <>
                            <div
                                className={`${styles.planWorkspaceHeader} ${styles.lockedPreviewActions}`}
                            >
                                <button
                                    type='button'
                                    className={styles.btn}
                                    onClick={plans.backToPlanList}
                                >
                                    ← Planos
                                </button>
                                <button
                                    type='button'
                                    className={styles.btnPrimary}
                                    onClick={() => void plans.markPrinted()}
                                    disabled={plans.markingPrinted}
                                    aria-label='Imprimir orçamento A4'
                                >
                                    Imprimir
                                </button>
                            </div>
                            <div data-screen-only='odonto-quote-preview'>
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
                                    screenPreview
                                    printable={false}
                                />
                            </div>
                        </>
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
                    saving={
                        itemFlows.savingServiceFlow || catalogs.savingCatalog
                    }
                    flowType={itemFlows.serviceFlowType}
                    serviceRows={itemFlows.serviceRows}
                    orderedTeeth={ORDERED_TEETH}
                    serviceCatalog={catalogs.serviceCatalog}
                    onClose={itemFlows.closeServiceFlowModal}
                    onSave={async catalogIndexes => {
                        const saved = await catalogs.saveServicesToCatalog(
                            itemFlows.serviceRows,
                            catalogIndexes,
                        );
                        if (saved) await itemFlows.saveServiceFlow();
                    }}
                    onFlowTypeChange={itemFlows.changeServiceFlowType}
                    onUpdateRow={itemFlows.updateServiceRow}
                    onToggleToothRow={itemFlows.toggleToothServiceRow}
                    onAddItem={itemFlows.addServiceRow}
                    onDeleteFromCatalog={serviceId =>
                        void catalogs.deleteFromCatalog(serviceId)
                    }
                />

                <OdontoProductModal
                    open={itemFlows.productFlowOpen}
                    saving={
                        itemFlows.savingProductFlow || catalogs.savingCatalog
                    }
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

                <OdontoEditProcedureModal
                    item={itemFlows.editingItem}
                    name={itemFlows.editingItemName}
                    value={itemFlows.editingItemValue}
                    notes={itemFlows.editingItemNotes}
                    saving={itemFlows.savingEditItem || catalogs.savingCatalog}
                    serviceCatalog={catalogs.serviceCatalog}
                    onValueChange={itemFlows.setEditingItemValue}
                    onNotesChange={itemFlows.setEditingItemNotes}
                    onClose={itemFlows.closeEditItemModal}
                    onSave={async updateCatalog => {
                        const item = itemFlows.editingItem;
                        if (!item) return;

                        if (updateCatalog) {
                            const saved = await catalogs.saveServicesToCatalog(
                                [
                                    {
                                        toothNumber:
                                            item.dental_context?.tooth_number ??
                                            null,
                                        toothSurface:
                                            item.dental_context
                                                ?.tooth_surface ?? '',
                                        scope: item.dental_context?.tooth_number
                                            ? 'tooth'
                                            : item.dental_context?.arcade_arch
                                              ? 'arch'
                                              : 'other',
                                        arcadeArch:
                                            item.dental_context?.arcade_arch ??
                                            null,
                                        treatment: itemFlows.editingItemName,
                                        serviceId: item.service,
                                        value: itemFlows.editingItemValue,
                                        notes: itemFlows.editingItemNotes,
                                    },
                                ],
                                [0],
                            );
                            if (!saved) return;
                        }

                        await itemFlows.saveEditedItem();
                    }}
                />
            </div>

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
