import React from 'react';
import { OdontoToothGrid } from '../OdontoToothGrid/OdontoToothGrid';
import OdontoProcedureCard from './OdontoProcedureCard';
import {
    formatDate,
    formatMoney,
    planDisplayName,
    ORDERED_TEETH,
} from '../../pages/odontoArcadeHelpers';
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
    onBack: () => void;
    onMarkPrinted: () => void;
    onSaveNotes: (value: string) => void;

    paymentCondition: PaymentCondition;
    onPaymentConditionChange: (value: PaymentCondition) => void;
    installmentsCount: number;
    onInstallmentsCountChange: (value: number) => void;
    firstDueDate: string;
    onFirstDueDateChange: (value: string) => void;
    installmentValue: number;
    planTotal: number;

    expandedItemIds: Set<number>;
    onToggleDetails: (id: number) => void;
    onEditItem: (item: TreatmentItem) => void;
    onDeleteItem: (id: number) => void;
    onMarkItemCompleted: (id: number) => void;
};

export default function OdontoPlanWorkspace({
    plan,
    items,
    groupedItems,
    activeToothNumbers,
    isPlanLocked,
    markingPrinted,
    onBack,
    onMarkPrinted,
    onSaveNotes,
    paymentCondition,
    onPaymentConditionChange,
    installmentsCount,
    onInstallmentsCountChange,
    firstDueDate,
    onFirstDueDateChange,
    installmentValue,
    planTotal,
    expandedItemIds,
    onToggleDetails,
    onEditItem,
    onDeleteItem,
    onMarkItemCompleted,
}: Props) {
    const [mapVisible, setMapVisible] = React.useState(false);
    const [printTooltipVisible, setPrintTooltipVisible] = React.useState(false);
    const printTooltipTimer = React.useRef<ReturnType<
        typeof setTimeout
    > | null>(null);

    React.useEffect(() => {
        return () => {
            if (printTooltipTimer.current) {
                clearTimeout(printTooltipTimer.current);
            }
        };
    }, []);

    function showPrintTooltip() {
        if (printTooltipTimer.current) {
            clearTimeout(printTooltipTimer.current);
            printTooltipTimer.current = null;
        }
        setPrintTooltipVisible(true);
    }

    function hidePrintTooltip() {
        setPrintTooltipVisible(false);
    }

    function showPrintTooltipOnTouch() {
        showPrintTooltip();
        printTooltipTimer.current = setTimeout(() => {
            setPrintTooltipVisible(false);
            printTooltipTimer.current = null;
        }, 3000);
    }

    return (
        <>
            {/* Plan workspace header */}
            <div className={styles.planWorkspaceHeader}>
                <button type='button' className={styles.btn} onClick={onBack}>
                    ← Planos
                </button>
                <div className={styles.planWorkspaceTitle}>
                    <strong>{planDisplayName(plan)}</strong>
                    <span className={styles.textMuted}>
                        {plan.created_at
                            ? formatDate(plan.created_at.slice(0, 10))
                            : ''}
                    </span>
                </div>
                <span
                    className={styles.printTooltipSlot}
                    onMouseEnter={showPrintTooltip}
                    onMouseLeave={hidePrintTooltip}
                >
                    <button
                        type='button'
                        className={styles.btn}
                        onClick={onMarkPrinted}
                        disabled={markingPrinted}
                        onFocus={showPrintTooltip}
                        onBlur={hidePrintTooltip}
                        onTouchStart={showPrintTooltipOnTouch}
                        aria-label='Imprimir orçamento A4'
                        aria-describedby={
                            printTooltipVisible
                                ? 'print-lock-tooltip'
                                : undefined
                        }
                    >
                        <span aria-hidden='true'>🖨</span>{' '}
                        <span className={styles.printButtonLabel}>
                            Imprimir Orçamento
                        </span>
                    </button>
                    {printTooltipVisible && (
                        <span
                            id='print-lock-tooltip'
                            className={styles.printTooltip}
                            role='status'
                        >
                            Ao imprimir, o orçamento ficará travado e não poderá
                            mais ser editado.
                        </span>
                    )}
                </span>
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

            {/* Observations textarea — persisted on blur */}
            <section className={styles.card}>
                <label className={styles.labelWide}>
                    <span className={styles.sectionTitle}>Observações</span>
                    <textarea
                        className={`${styles.textarea} ${styles.planNotes}`}
                        rows={3}
                        defaultValue={plan.notes ?? ''}
                        placeholder='Observações clínicas, orientações e condições especiais…'
                        onBlur={e => onSaveNotes(e.target.value)}
                        disabled={isPlanLocked}
                    />
                </label>
            </section>

            {/* Payment condition selector */}
            <section className={styles.card}>
                <h2 className={styles.sectionTitle}>Condição de Pagamento</h2>
                <div className={styles.paymentConditionRow}>
                    <label className={styles.paymentRadioLabel}>
                        <input
                            type='radio'
                            name='paymentCondition'
                            checked={paymentCondition === 'avista'}
                            onChange={() => onPaymentConditionChange('avista')}
                            disabled={isPlanLocked}
                        />
                        À Vista
                    </label>
                    <label className={styles.paymentRadioLabel}>
                        <input
                            type='radio'
                            name='paymentCondition'
                            checked={paymentCondition === 'aprazo'}
                            onChange={() => onPaymentConditionChange('aprazo')}
                            disabled={isPlanLocked}
                        />
                        A Prazo
                    </label>
                </div>

                {paymentCondition === 'aprazo' && (
                    <div className={styles.formGrid}>
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
                            <strong>{formatMoney(installmentValue)}</strong>{' '}
                            (Total: {formatMoney(planTotal)})
                        </p>
                    </div>
                )}
            </section>

            {/* Arcade map */}
            <section className={styles.card}>
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
                        <OdontoToothGrid
                            orderedTeeth={ORDERED_TEETH}
                            selectedToothNumber={null}
                            suppressDateHighlights={false}
                            activeDateToothNumbers={activeToothNumbers}
                            readOnly
                        />
                    </div>
                )}
            </section>

            {/* Appointments list */}
            <section className={styles.card}>
                <h2 className={styles.sectionTitle}>Atendimentos</h2>
                {groupedItems.length === 0 ? (
                    <p className={styles.textMuted}>
                        Nenhum procedimento cadastrado.
                    </p>
                ) : (
                    <div className={styles.groupList}>
                        {groupedItems.map(group => (
                            <div key={group.key} className={styles.groupCard}>
                                <strong className={styles.groupDate}>
                                    {group.label}
                                </strong>
                                {group.items.map(item => {
                                    const children = items.filter(
                                        i => i.parent_item === item.id,
                                    );
                                    return (
                                        <OdontoProcedureCard
                                            key={item.id}
                                            item={item}
                                            childItems={children}
                                            isExpanded={expandedItemIds.has(
                                                item.id,
                                            )}
                                            onToggleDetails={onToggleDetails}
                                            onEdit={onEditItem}
                                            onDelete={onDeleteItem}
                                            onMarkCompleted={
                                                onMarkItemCompleted
                                            }
                                            locked={isPlanLocked}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
}
