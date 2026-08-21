import React from 'react';
import type {
    PaymentCondition,
    PlanListItem,
    TreatmentItem,
} from '../../pages/odontoArcadeHelpers';
import {
    planDisplayName,
    formatMoney,
    formatDate,
} from '../../pages/odontoArcadeHelpers';
import { formatPhone } from '../../utils/formatPhone';
import styles from './OdontoPrintView.module.css';

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
};

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
};

export default function OdontoPrintView({
    plan,
    items,
    clientName,
    paymentCondition,
    installmentsCount,
    installmentValue,
    firstDueDate,
    planTotal,
    professionalVersion = 0,
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
        'Consultório Odontológico';
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
    const printDate = new Intl.DateTimeFormat('pt-BR').format(new Date());

    return (
        // data-print-card opts into the app-wide print visibility hack (src/index.css @media print).
        <div className={styles.printSheet} data-print-card>
            {/* A) Header — clinic identity, address and contact details */}
            <header className={styles.printHeader}>
                <div>
                    <p className={styles.profName}>{clinicName}</p>
                    {prof.specialty && (
                        <p className={styles.profDetail}>{prof.specialty}</p>
                    )}
                    {businessAddress !== 'Endereço comercial não informado' && (
                        <p className={styles.profAddress}>{businessAddress}</p>
                    )}
                </div>
                <div className={styles.printHeaderRight}>
                    {prof.cnpj && (
                        <p className={styles.profDetail}>CNPJ {prof.cnpj}</p>
                    )}
                    {prof.register_number && (
                        <p className={styles.profDetail}>
                            CRO {prof.register_number}
                        </p>
                    )}
                    {formattedPhone && (
                        <p className={styles.profDetail}>{formattedPhone}</p>
                    )}
                </div>
            </header>

            <hr className={styles.printDivider} />

            {/* B) Title */}
            <h1 className={styles.printTitle}>
                ORÇAMENTO DE TRATAMENTO ODONTOLÓGICO
            </h1>

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

            {/* C) Serviços Prestados */}
            <section className={styles.printSection}>
                <h2 className={styles.printSubtitle}>Serviços</h2>
                {services.length === 0 ? (
                    <p className={styles.printEmpty}>Nenhum serviço lançado.</p>
                ) : (
                    <table className={styles.printTable}>
                        <tbody>
                            {services.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        {item.service_name || item.custom_name}
                                    </td>
                                    <td className={styles.colValue}>
                                        {formatMoney(item.patient_price)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* D) Materiais e Produtos */}
            <section className={styles.printSection}>
                <h2 className={styles.printSubtitle}>Materiais e Produtos</h2>
                {products.length === 0 ? (
                    <p className={styles.printEmpty}>Nenhum produto lançado.</p>
                ) : (
                    <table className={styles.printTable}>
                        <tbody>
                            {products.map(item => (
                                <tr key={item.id}>
                                    <td>{item.custom_name}</td>
                                    <td className={styles.colValue}>
                                        {formatMoney(item.patient_price)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* E) Condições de Pagamento */}
            <section className={styles.printSection}>
                <hr className={styles.printDivider} />
                <div className={styles.printTotalRow}>
                    <span>Valor Total</span>
                    <strong>{formatMoney(planTotal)}</strong>
                </div>
                <p className={styles.printPaymentLine}>
                    {paymentCondition === 'avista'
                        ? 'Forma de pagamento: À Vista'
                        : `Forma de pagamento: ${installmentsCount} parcelas de ${formatMoney(
                              installmentValue,
                          )} com vencimento inicial em ${formatDate(firstDueDate)}`}
                </p>
            </section>

            <section
                className={`${styles.printSection} ${styles.clinicalNotes}`}
            >
                <h2 className={styles.printSubtitle}>Observações</h2>
                {plan.notes?.trim() ? (
                    <p className={styles.printNotesText}>{plan.notes}</p>
                ) : (
                    <div className={styles.observationLines} aria-hidden='true'>
                        <div />
                    </div>
                )}
            </section>

            {/* F) Footer line */}
            <footer className={styles.printFooter}>
                <hr className={styles.printDivider} />
            </footer>
        </div>
    );
}
