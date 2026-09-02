import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import OdontoPlanCreateModal from '../components/Odonto/OdontoPlanCreateModal';
import ClinicalPrintView from '../components/Shared/ClinicalPrintView/ClinicalPrintView';
import OdontoPlanListView from '../components/Odonto/OdontoPlanListView';
import OdontoPlanWorkspace from '../components/Odonto/OdontoPlanWorkspace';
import PodologyPlanWorkspace from '../components/Podologia/PodologyPlanWorkspace';
import ActionPromptModal from '../components/Shared/ActionPromptModal';
import { useClinicalTreatmentPlans } from '../hooks/useClinicalTreatmentPlans';
import { planDisplayName } from '../utils/TreatmentHelpers';
import { on } from '../events/bus';
import {
    hasPodologiaCapability,
    readLoggedProfessionalCapabilities,
} from '../utils/tenantCapabilities';
import styles from './TreatmentWorkspacePage.module.css';

export default function TreatmentWorkspacePage() {
    const navigate = useNavigate();
    const { clientId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    // Tenants são exclusivamente odonto OU podologia; nunca misturam as duas capabilities.
    const isPodologia = React.useMemo(
        () => hasPodologiaCapability(readLoggedProfessionalCapabilities()),
        [],
    );

    const canAccess = true;
    const numericClientId = React.useMemo(
        () => Number(clientId || 0),
        [clientId],
    );

    const initialPlanId = React.useMemo(() => {
        const value = Number(searchParams.get('plan'));
        return Number.isInteger(value) && value > 0 ? value : null;
    }, [searchParams]);
    const plans = useClinicalTreatmentPlans(
        numericClientId,
        canAccess,
        initialPlanId,
    );
    const [professionalVersion, setProfessionalVersion] = React.useState(0);
    const [printConfirmationOpen, setPrintConfirmationOpen] =
        React.useState(false);

    function handleMarkPrinted() {
        if (plans.lockAfterPrint && plans.plan && !plans.plan.is_printed) {
            setPrintConfirmationOpen(true);
            return;
        }
        void plans.markPrinted();
    }

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
            if (typeof settings.lockAfterPrint === 'boolean') {
                void plans.updateLockAfterPrint(settings.lockAfterPrint);
            }
        });
    }, [plans]);

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
                    !plans.isPlanLocked &&
                    (isPodologia ? (
                        <>
                            <div className={styles.planWorkspaceHeader}>
                                <button
                                    type='button'
                                    className={styles.btn}
                                    onClick={plans.backToPlanList}
                                >
                                    ← Planos
                                </button>
                            </div>
                            <PodologyPlanWorkspace
                                key={plans.plan.id}
                                planId={plans.plan.id}
                            />
                        </>
                    ) : (
                        <OdontoPlanWorkspace
                            key={plans.plan.id}
                            plan={plans.plan}
                            items={plans.items}
                            isPlanLocked={plans.isPlanLocked}
                            markingPrinted={plans.markingPrinted}
                            onBack={plans.backToPlanList}
                            onMarkPrinted={handleMarkPrinted}
                            onRefreshPlan={plans.loadPlan}
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
                        />
                    ))}

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
                                    onClick={handleMarkPrinted}
                                    disabled={plans.markingPrinted}
                                    aria-label='Imprimir orçamento A4'
                                >
                                    Imprimir
                                </button>
                            </div>
                            <div data-screen-only='odonto-quote-preview'>
                                <ClinicalPrintView
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

                <ActionPromptModal
                    open={printConfirmationOpen}
                    title='Confirmar impressão do plano?'
                    message={
                        <p style={{ margin: 0 }}>
                            A impressão vai bloquear futuras alterações neste
                            plano.
                        </p>
                    }
                    onClose={() => setPrintConfirmationOpen(false)}
                    actions={[
                        {
                            label: 'Cancelar',
                            onClick: () => setPrintConfirmationOpen(false),
                        },
                        {
                            label: 'Imprimir e bloquear',
                            variant: 'danger',
                            onClick: () => {
                                setPrintConfirmationOpen(false);
                                void plans.markPrinted();
                            },
                        },
                    ]}
                />

                <ActionPromptModal
                    open={plans.deleteConfirmation !== null}
                    title='Excluir plano definitivamente?'
                    message={
                        <p style={{ margin: 0 }}>
                            Todos os tratamentos, produtos e valores deste plano
                            serão excluídos definitivamente.
                        </p>
                    }
                    onClose={plans.cancelDeletePlan}
                    actions={[
                        {
                            label: 'Cancelar',
                            onClick: plans.cancelDeletePlan,
                        },
                        {
                            label: 'Excluir definitivamente',
                            variant: 'danger',
                            onClick: () => void plans.confirmDeletePlan(),
                        },
                    ]}
                />
            </div>

            <ClinicalPrintView
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
