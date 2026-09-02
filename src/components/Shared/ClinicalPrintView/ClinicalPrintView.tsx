import React from 'react';
import type {
    PaymentCondition,
    PlanListItem,
    TreatmentItem,
} from '../../../utils/TreatmentHelpers';
import {
    planDisplayName,
    formatMoney,
    formatDate,
} from '../../../utils/TreatmentHelpers';
import { formatCnpj } from '../../../utils/formatCpf';
import { formatPhone } from '../../../utils/formatPhone';
import styles from './ClinicalPrintView.module.css';

type Professional = {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    specialty?: string;
    email?: string;
    phone?: string;
    register_number?: string;
    address?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    zip_code?: string;
    cnpj?: string;
    city?: string;
    state?: string;
    odonto_quote_validity_days?: number | string;
};

type PrintableItem = {
    section: 'treatment' | 'product';
    item: TreatmentItem;
};

const PAGE_ITEM_CAPACITY = 6;

function paginateItems(items: PrintableItem[]): PrintableItem[][] {
    if (items.length === 0) return [[]];
    const pages: PrintableItem[][] = [];
    for (let index = 0; index < items.length; index += PAGE_ITEM_CAPACITY) {
        pages.push(items.slice(index, index + PAGE_ITEM_CAPACITY));
    }
    return pages;
}

function loadProfessional(): Professional {
    try {
        const raw = localStorage.getItem('loggedProfessional');
        return raw ? (JSON.parse(raw) as Professional) : {};
    } catch {
        return {};
    }
}

type Props = {
    plan: PlanListItem | null;
    items: TreatmentItem[];
    clientName: string | null;
    paymentCondition: PaymentCondition;
    installmentsCount: number;
    installmentValue: number;
    firstDueDate: string;
    planTotal: number;
    professionalVersion?: number;
    screenPreview?: boolean;
    printable?: boolean;
};

export default function ClinicalPrintView({
    plan,
    items,
    clientName,
    paymentCondition,
    installmentsCount,
    installmentValue,
    firstDueDate,
    planTotal,
    professionalVersion = 0,
    screenPreview = false,
    printable = true,
}: Props) {
    const prof = React.useMemo(loadProfessional, [professionalVersion]);
    if (!plan) return null;

    // Container rows (e.g. "Produtos usados") are excluded — only leaf lines are printed.
    const containerIds = new Set(
        items.map(i => i.parent_item).filter((id): id is number => id != null),
    );
    const leafItems = items.filter(i => i.is_active && !containerIds.has(i.id));
    const services = leafItems.filter(i => i.kind === 'service');
    const products = leafItems.filter(i => i.kind === 'product');

    const clinicName =
        prof.display_name ||
        [prof.first_name, prof.last_name].filter(Boolean).join(' ') ||
        'Consultório Clínico';
    const addressLine = [prof.address || prof.street, prof.number]
        .filter(Boolean)
        .join(', ');
    const locationLine = [prof.neighborhood, prof.city, prof.state]
        .filter(Boolean)
        .join(' - ');
    const postalLine = prof.zip_code ? `CEP ${prof.zip_code}` : '';
    const businessAddress =
        [addressLine, locationLine, postalLine].filter(Boolean).join(' | ') ||
        'Endereço comercial não informado';
    const formattedPhone = formatPhone(prof.phone);
    const formattedCnpj = formatCnpj(prof.cnpj ?? '');
    const printDate = new Intl.DateTimeFormat('pt-BR').format(new Date());
    const validityDays = Math.max(
        1,
        Number(prof.odonto_quote_validity_days) || 30,
    );
    const pages = paginateItems([
        ...services.map(item => ({
            section: 'treatment' as const,
            item,
        })),
        ...products.map(item => ({ section: 'product' as const, item })),
    ]);

    return (
        // data-print-card opts into the app-wide print visibility hack (src/index.css @media print).
        <div
            className={`${styles.printSheet} ${screenPreview ? styles.screenPreview : ''}`}
            {...(printable && { 'data-print-card': true })}
            data-print-layout='odonto-quote'
        >
            {pages.map((pageItems, pageIndex) => {
                const pageTreatments = pageItems
                    .filter(entry => entry.section === 'treatment')
                    .map(entry => entry.item);
                const pageProducts = pageItems
                    .filter(entry => entry.section === 'product')
                    .map(entry => entry.item);
                const isLastPage = pageIndex === pages.length - 1;

                return (
                    <article className={styles.printPage} key={pageIndex}>
                        <header className={styles.printHeader}>
                            <div>
                                <p className={styles.profName}>{clinicName}</p>
                                {prof.specialty && (
                                    <p className={styles.profDetail}>
                                        {prof.specialty}
                                    </p>
                                )}
                                {businessAddress !==
                                    'Endereço comercial não informado' && (
                                    <p className={styles.profAddress}>
                                        {businessAddress}
                                    </p>
                                )}
                            </div>
                            <div className={styles.printHeaderRight}>
                                {formattedCnpj && (
                                    <p className={styles.profDetail}>
                                        CNPJ {formattedCnpj}
                                    </p>
                                )}
                                {prof.register_number && (
                                    <p className={styles.profDetail}>
                                        Registro {prof.register_number}
                                    </p>
                                )}
                                {formattedPhone && (
                                    <p className={styles.profDetail}>
                                        {formattedPhone}
                                    </p>
                                )}
                            </div>
                        </header>

                        <hr className={styles.printDivider} />

                        <div className={styles.printMeta}>
                            <p>
                                <strong>Paciente:</strong> {clientName || '—'}
                            </p>
                            <p>
                                <strong>Plano:</strong> {planDisplayName(plan)}
                            </p>
                            <p>
                                <strong>Data da impressão:</strong> {printDate}
                            </p>
                        </div>

                        <h1 className={styles.printTitle}>Orçamento Clínico</h1>

                        <section className={styles.printSection}>
                            <h2 className={styles.printSubtitle}>
                                Tratamentos
                            </h2>
                            {pageTreatments.length === 0 ? (
                                <p className={styles.printEmpty}>
                                    Nenhum tratamento nesta página.
                                </p>
                            ) : (
                                <table className={styles.printTable}>
                                    <tbody>
                                        {pageTreatments.map(item => (
                                            <tr key={item.id}>
                                                <td>
                                                    {item.service_name ||
                                                        item.custom_name}
                                                </td>
                                                <td className={styles.colValue}>
                                                    {formatMoney(
                                                        item.patient_price,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>

                        <section className={styles.printSection}>
                            <h2 className={styles.printSubtitle}>
                                Materiais e Produtos
                            </h2>
                            {pageProducts.length === 0 ? (
                                <p className={styles.printEmpty}>
                                    Nenhum produto nesta página.
                                </p>
                            ) : (
                                <table className={styles.printTable}>
                                    <tbody>
                                        {pageProducts.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.custom_name}</td>
                                                <td className={styles.colValue}>
                                                    {formatMoney(
                                                        item.patient_price,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>

                        {isLastPage && (
                            <div className={styles.printClosingBlock}>
                                <section
                                    className={`${styles.printSection} ${styles.clinicalNotes}`}
                                >
                                    <h2 className={styles.printSubtitle}>
                                        Observações
                                    </h2>
                                    {plan.notes?.trim() ? (
                                        <p className={styles.printNotesText}>
                                            {plan.notes}
                                        </p>
                                    ) : (
                                        <div
                                            className={styles.observationLines}
                                            aria-hidden='true'
                                        >
                                            <div />
                                        </div>
                                    )}
                                </section>

                                <section className={styles.printSection}>
                                    <hr className={styles.printDivider} />
                                    <div className={styles.printTotalRow}>
                                        <strong>Valor Total</strong>
                                        <strong>
                                            {formatMoney(planTotal)}
                                        </strong>
                                    </div>
                                    <p className={styles.printPaymentLine}>
                                        {paymentCondition === 'avista'
                                            ? 'Forma de pagamento: À Vista'
                                            : `Forma de pagamento: ${installmentsCount} parcelas de ${formatMoney(
                                                  installmentValue,
                                              )} com vencimento inicial em ${formatDate(firstDueDate)}`}
                                    </p>
                                </section>

                                <p className={styles.validityText}>
                                    Este orçamento é válido por {validityDays}{' '}
                                    dias a partir da data de impressão.
                                </p>

                                <div className={styles.signatureBlock}>
                                    <div className={styles.signatureLine} />
                                    <span>Assinatura do responsável</span>
                                </div>
                            </div>
                        )}

                        <footer className={styles.printFooter}>
                            Página {pageIndex + 1} de {pages.length}
                        </footer>
                    </article>
                );
            })}
        </div>
    );
}
