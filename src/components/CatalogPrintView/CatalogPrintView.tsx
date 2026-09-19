import React from 'react';
import { formatCnpj } from '../../utils/formatCpf';
import styles from './CatalogPrintView.module.css';

type CatalogPrintItem = {
    id: number;
    name: string;
    description?: string;
    price: number;
};

type Professional = {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    specialty?: string;
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

type Props = {
    title: string;
    items: CatalogPrintItem[];
};

const ITEMS_PER_PAGE = 18;

function loadProfessional(): Professional {
    try {
        const raw = localStorage.getItem('loggedProfessional');
        return raw ? (JSON.parse(raw) as Professional) : {};
    } catch {
        return {};
    }
}

function formatMoney(value: number): string {
    return Number(value || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function paginateItems(items: CatalogPrintItem[]): CatalogPrintItem[][] {
    if (items.length === 0) return [[]];
    const pages: CatalogPrintItem[][] = [];
    for (let index = 0; index < items.length; index += ITEMS_PER_PAGE) {
        pages.push(items.slice(index, index + ITEMS_PER_PAGE));
    }
    return pages;
}

export function CatalogPrintView({ title, items }: Props) {
    const professional = React.useMemo(loadProfessional, []);
    const clinicName =
        professional.display_name ||
        [professional.first_name, professional.last_name]
            .filter(Boolean)
            .join(' ') ||
        'Consultório Odontológico';
    const addressLine = [
        professional.address || professional.street,
        professional.number,
    ]
        .filter(Boolean)
        .join(', ');
    const locationLine = [
        professional.neighborhood,
        professional.city,
        professional.state,
    ]
        .filter(Boolean)
        .join(' - ');
    const postalLine = professional.zip_code
        ? `CEP ${professional.zip_code}`
        : '';
    const businessAddress = [addressLine, locationLine, postalLine]
        .filter(Boolean)
        .join(' | ');
    const formattedCnpj = formatCnpj(professional.cnpj ?? '');
    const printDate = new Intl.DateTimeFormat('pt-BR').format(new Date());
    const pages = paginateItems(items);

    return (
        <div
            className={styles.printSheet}
            data-print-card
            data-print-layout='catalog'
        >
            {pages.map((pageItems, pageIndex) => (
                <article className={styles.printPage} key={pageIndex}>
                    <header className={styles.printHeader}>
                        <div>
                            <p className={styles.profName}>{clinicName}</p>
                            {professional.specialty && (
                                <p className={styles.profDetail}>
                                    {professional.specialty}
                                </p>
                            )}
                            {businessAddress && (
                                <p className={styles.profAddress}>
                                    {businessAddress}
                                </p>
                            )}
                        </div>
                        <div className={styles.printHeaderRight}>
                            {formattedCnpj && <p>CNPJ {formattedCnpj}</p>}
                            {professional.register_number && (
                                <p>CRO Reg. {professional.register_number}</p>
                            )}
                        </div>
                    </header>

                    <hr className={styles.divider} />

                    <div className={styles.documentMeta}>
                        <h1>{title}</h1>
                        <p>Emitido em {printDate}</p>
                    </div>

                    <table className={styles.catalogTable}>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Descrição</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className={styles.emptyRow}>
                                        Nenhum item cadastrado.
                                    </td>
                                </tr>
                            ) : (
                                pageItems.map(item => (
                                    <tr key={item.id}>
                                        <td className={styles.itemName}>
                                            {item.name}
                                        </td>
                                        <td>{item.description || '—'}</td>
                                        <td className={styles.itemPrice}>
                                            {formatMoney(item.price)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <footer className={styles.printFooter}>
                        <span>{items.length} itens</span>
                        <span>
                            Página {pageIndex + 1} de {pages.length}
                        </span>
                    </footer>
                </article>
            ))}
        </div>
    );
}
