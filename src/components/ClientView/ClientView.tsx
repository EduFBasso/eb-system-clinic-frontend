import React, { useEffect } from 'react';
import type {
    AnamneseBaseData,
    AnamneseOdontologiaData,
    AnamnesePodologiaData,
    ClientData,
} from '../../types/ClientData';
import styles from './ClientView.module.css';
import { formatPhone } from '../../utils/formatPhone';
import { formatDOBWithAge } from '../../utils/dateOfBirth';
import { formatCpf, formatCnpj, formatCep } from '../../utils/formatCpf';
import { useTheme } from '../../contexts/ThemeContext';
import {
    readLoggedProfessionalCapabilities,
    resolveClinicSpecialty,
} from '../../utils/tenantCapabilities';
import { ODONTO_ANAMNESIS_FIELDS } from '../Odonto/DentalAnamnesisForm/dentalAnamnesisModel';
import { PODOLOGY_ANAMNESIS_FIELDS } from '../Podologia/ClientPodologiaSection/podologiaAnamnesisModel';

interface ClientViewProps {
    client: ClientData & {
        address_number?: string | null;
        date_of_birth?: string | null;
        anamnesis_base?: Partial<AnamneseBaseData> | null;
        anamnesis_podologia?: Partial<AnamnesePodologiaData> | null;
    };
    openToken?: number;
}

// ── label maps ──────────────────────────────────────────────────────────────

const SEX_LABELS: Record<string, string> = {
    masculino: 'Masculino',
    feminino: 'Feminino',
    outro: 'Outro',
    nao_informado: 'Prefiro não informar',
};

const MARITAL_LABELS: Record<string, string> = {
    solteiro: 'Solteiro(a)',
    casado: 'Casado(a)',
    divorciado: 'Divorciado(a)',
    viuvo: 'Viúvo(a)',
    uniao_estavel: 'União estável',
};

const DOC_TYPE_LABELS: Record<string, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
};

// ── helper: format a raw client field value ──────────────────────────────────

function formatField(
    k: keyof ClientData,
    raw: unknown,
    client: ClientData,
): string {
    if (k === 'date_of_birth') return formatDOBWithAge(raw as string) || '-';
    if (k === 'phone') return formatPhone(String(raw));
    if (k === 'sex') return SEX_LABELS[raw as string] ?? String(raw);
    if (k === 'marital_status')
        return MARITAL_LABELS[raw as string] ?? String(raw);
    if (k === 'document_type')
        return DOC_TYPE_LABELS[raw as string] ?? String(raw);
    if (k === 'document_number') {
        return client.document_type === 'cnpj'
            ? formatCnpj(String(raw))
            : formatCpf(String(raw));
    }
    if (k === 'postal_code') return formatCep(String(raw));
    return String(raw);
}

function getAnamneseBase(client: ClientViewProps['client']) {
    const alt = client as ClientData & {
        anamnesis_base?: Partial<AnamneseBaseData> | null;
    };
    return (client.anamnese_base ??
        alt.anamnesis_base ??
        null) as Partial<AnamneseBaseData> | null;
}

function getAnamnesePodologia(client: ClientViewProps['client']) {
    const alt = client as ClientData & {
        anamnesis_podologia?: Partial<AnamnesePodologiaData> | null;
    };
    return (client.anamnese_podologia ??
        alt.anamnesis_podologia ??
        null) as Partial<AnamnesePodologiaData> | null;
}

function getAnamneseOdontologia(client: ClientViewProps['client']) {
    return (client.anamnese_odontologia ??
        null) as Partial<AnamneseOdontologiaData> | null;
}

function hasValue(value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
}

// ── sub-component: a read-only section panel ─────────────────────────────────

function ViewSection({
    theme,
    eyebrow,
    title,
    rows,
    emptyMessage,
}: {
    theme: string;
    eyebrow: string;
    title: string;
    rows: { label: string; value: string }[];
    emptyMessage?: string;
}) {
    return (
        <section data-theme={theme} className={styles.section}>
            <div className={styles.sectionInner}>
                <header className={styles.sectionHeader}>
                    <span className={styles.eyebrow}>{eyebrow}</span>
                    <h2 className={styles.sectionTitle}>{title}</h2>
                </header>
                {rows.length === 0 ? (
                    <div className={styles.emptyState}>
                        {emptyMessage ?? 'Nenhum registro encontrado'}
                    </div>
                ) : (
                    <div className={styles.fieldGrid}>
                        {rows.map(({ label, value }) => (
                            <div className={styles.fieldRow} key={label}>
                                <span className={styles.fieldLabel}>
                                    {label}
                                </span>
                                <span className={styles.fieldValue}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

// ── main component ───────────────────────────────────────────────────────────

export const ClientView: React.FC<ClientViewProps> = ({
    client,
    openToken,
}) => {
    const { theme } = useTheme();
    const rootRef = React.useRef<HTMLDivElement | null>(null);

    const capabilities = React.useMemo(readLoggedProfessionalCapabilities, []);
    const specialty = resolveClinicSpecialty(capabilities);
    const hasOdonto = specialty === 'odonto';
    const hasPodologia = specialty === 'podologia';

    useEffect(() => {
        const node = rootRef.current;
        if (!node) return;
        node.scrollTop = 0;
        requestAnimationFrame(() => {
            node.scrollTop = 0;
        });
    }, [client.id, openToken]);

    const initials = React.useMemo(() => {
        const fn = String(client.first_name || '').trim();
        const ln = String(client.last_name || '').trim();
        return ((fn[0] ?? '') + (ln[0] ?? '') || 'C').toUpperCase();
    }, [client.first_name, client.last_name]);

    const anamneseBase = React.useMemo(() => getAnamneseBase(client), [client]);
    const anamnesePodologia = React.useMemo(
        () => getAnamnesePodologia(client),
        [client],
    );
    const anamneseOdontologia = React.useMemo(
        () => getAnamneseOdontologia(client),
        [client],
    );
    // ── Dados Pessoais rows ──────────────────────────────────────────────────
    const personalFields: Array<[keyof ClientData, string]> = [
        ['first_name', 'Nome'],
        ['last_name', 'Sobrenome'],
        ['sex', 'Sexo'],
        ['phone', 'Telefone'],
        ['email', 'E-mail'],
        ['date_of_birth', 'Data de Nascimento'],
        ['profession', 'Profissão'],
        ['document_type', 'Tipo de documento'],
        ['document_number', 'Número do documento'],
        ['marital_status', 'Estado civil'],
    ];

    const personalRows = personalFields
        .map(([k, label]) => {
            const raw = client[k];
            const hasValue = raw !== null && raw !== undefined && raw !== '';
            if (!hasValue) return null;
            return {
                label,
                value: formatField(k, raw, client as ClientData),
            };
        })
        .filter((row): row is { label: string; value: string } => !!row);

    // Add Código at the top
    if (client.id) {
        personalRows.unshift({ label: 'Código', value: String(client.id) });
    }

    // ── Endereço rows ────────────────────────────────────────────────────────
    const addressFields: Array<[keyof ClientData, string]> = [
        ['postal_code', 'CEP'],
        ['address', 'Rua'],
        ['address_number', 'Número'],
        ['neighborhood', 'Bairro'],
        ['city', 'Cidade'],
        ['state', 'Estado'],
    ];

    const addressRows = addressFields
        .map(([k, label]) => {
            const raw = client[k];
            const hasValue = raw !== null && raw !== undefined && raw !== '';
            if (!hasValue) return null;
            return {
                label,
                value: formatField(k, raw, client as ClientData),
            };
        })
        .filter((row): row is { label: string; value: string } => !!row);

    const baseRows: { label: string; value: string }[] = anamneseBase
        ? [
              {
                  label: 'Toma medicação',
                  value: anamneseBase.takes_medication || '-',
              },
              {
                  label: 'Já fez cirurgia',
                  value: anamneseBase.had_surgery || '-',
              },
              {
                  label: 'Gestação',
                  value: anamneseBase.is_pregnant === true ? 'Sim' : 'Não',
              },
              {
                  label: 'Sensibilidade à dor',
                  value: anamneseBase.pain_sensitivity || '-',
              },
              {
                  label: 'Histórico clínico',
                  value: anamneseBase.clinical_history || '-',
              },
              {
                  label: 'Atividade esportiva',
                  value: anamneseBase.sport_activity || '-',
              },
              {
                  label: 'Atividade acadêmica',
                  value: anamneseBase.academic_activity || '-',
              },
          ].filter(row => hasValue(row.value) && row.value !== '-')
        : [];

    const podologiaRows: { label: string; value: string }[] = anamnesePodologia
        ? PODOLOGY_ANAMNESIS_FIELDS.map(({ key, label }) => {
              const rawValue = (anamnesePodologia as Record<string, unknown>)[
                  key
              ];
              const value =
                  rawValue === null || rawValue === undefined
                      ? '-'
                      : String(rawValue);
              return { label, value };
          }).filter(row => hasValue(row.value) && row.value !== '-')
        : [];

    const odontoRows: { label: string; value: string }[] = anamneseOdontologia
        ? ODONTO_ANAMNESIS_FIELDS.map(({ key, label, isBool }) => {
              const rawValue = (anamneseOdontologia as Record<string, unknown>)[
                  key
              ];
              if (rawValue === null || rawValue === undefined) return null;

              const value = isBool
                  ? rawValue === true
                      ? 'Sim'
                      : 'Não'
                  : String(rawValue);

              if (!hasValue(value)) return null;
              return { label, value };
          }).filter((row): row is { label: string; value: string } => !!row)
        : [];

    return (
        <div ref={rootRef} className={styles.viewRoot}>
            {/* ── Header: avatar + nome ── */}
            <div data-theme={theme} className={styles.headerCard}>
                <div
                    className={styles.avatarFallback}
                    data-avatar-fallback
                    aria-hidden
                >
                    {initials}
                </div>
                <div className={styles.headerText}>
                    <div className={styles.clientName}>
                        {client.first_name} {client.last_name}
                    </div>
                    {client.phone && (
                        <div className={styles.clientSubtitle}>
                            {formatPhone(String(client.phone))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Dados Pessoais ── */}
            <ViewSection
                theme={theme}
                eyebrow='Visualização'
                title='Dados Pessoais'
                rows={personalRows}
                emptyMessage='Nenhum dado pessoal preenchido'
            />

            {/* ── Endereço ── */}
            <ViewSection
                theme={theme}
                eyebrow='Visualização'
                title='Endereço'
                rows={addressRows}
                emptyMessage='Nenhum endereço preenchido'
            />

            <ViewSection
                theme={theme}
                eyebrow='Visualização'
                title='Anamnese Geral'
                rows={baseRows}
                emptyMessage='Nenhum histórico registrado'
            />

            {hasOdonto && (
                <ViewSection
                    theme={theme}
                    eyebrow='Visualização'
                    title='Anamnese Odontologia'
                    rows={odontoRows}
                    emptyMessage='Nenhum histórico registrado'
                />
            )}
            {hasPodologia && (
                <ViewSection
                    theme={theme}
                    eyebrow='Visualização'
                    title='Anamnese Podologia'
                    rows={podologiaRows}
                    emptyMessage='Nenhum histórico registrado'
                />
            )}
        </div>
    );
};
