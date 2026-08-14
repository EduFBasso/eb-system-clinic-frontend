import React, { useEffect } from 'react';
import type {
    AnamneseBaseData,
    AnamnesePodologiaData,
    ClientData,
} from '../../types/ClientData';
import styles from './ClientView.module.css';
import { formatPhone } from '../../utils/formatPhone';
import { formatDOBWithAge } from '../../utils/dateOfBirth';
import { formatCpf, formatCnpj, formatCep } from '../../utils/formatCpf';
import { useTheme } from '../../contexts/ThemeContext';

interface ClientViewProps {
    client: ClientData & {
        address_number?: string | null;
        date_of_birth?: string | null;
        anamnesis_base?: Partial<AnamneseBaseData> | null;
        anamnesis_podologia?: Partial<AnamnesePodologiaData> | null;
        anamnesis_responses?: Array<{
            id?: number;
            field_id: number;
            field_code: string;
            sector: string;
            sector_order: number;
            label: string;
            field_type: 'radio' | 'text' | 'textarea';
            selection_mode: 'single' | 'multiple';
            value: string;
        }> | null;
    };
    openToken?: number;
}

type DentalAnamnesisData = {
    gum_bleeding?: boolean | null;
    floss_usage?: boolean | null;
    bruxism_clenching?: boolean | null;
    tooth_brushing_frequency?: string | null;
    chief_dental_complaint?: string | null;
};

const odontoFields: Array<{ key: string; label: string; isBool?: boolean }> = [
    { key: 'gum_bleeding', label: 'Gengiva sangra ao escovar', isBool: true },
    { key: 'floss_usage', label: 'Usa fio dental diariamente', isBool: true },
    {
        key: 'bruxism_clenching',
        label: 'Ranger/Apertar dentes (Bruxismo)',
        isBool: true,
    },
    { key: 'tooth_brushing_frequency', label: 'Frequência de escovação' },
    { key: 'chief_dental_complaint', label: 'Queixa principal bucal' },
];

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
    const alt = client as ClientData & {
        odontologia?: Partial<DentalAnamnesisData> | null;
        anamnese_odontologia?: Partial<DentalAnamnesisData> | null;
        anamnesis_odontologia?: Partial<DentalAnamnesisData> | null;
        dental_anamnesis?: Partial<DentalAnamnesisData> | null;
    };

    return (alt.odontologia ??
        alt.anamnese_odontologia ??
        alt.anamnesis_odontologia ??
        alt.dental_anamnesis ??
        null) as Partial<DentalAnamnesisData> | null;
}

function hasValue(value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
}

function normalizeSectorName(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function normalizeSpecialty(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function getPodologyResponses(client: ClientViewProps['client']) {
    const responses = client.anamnesis_responses ?? [];
    if (!responses.length) return [];

    const rows = responses
        .filter(
            response => normalizeSectorName(response.sector) !== 'historico',
        )
        .slice()
        .sort(
            (a, b) =>
                a.sector_order - b.sector_order || a.field_id - b.field_id,
        );

    const leftOther = rows.find(
        row => row.label === 'Outra alteração esquerda',
    );
    const rightOther = rows.find(
        row => row.label === 'Outra alteração direita',
    );

    const mergeOtherDetail = (label: string, detail: string | undefined) => {
        if (!detail || !detail.trim()) return;
        const row = rows.find(item => item.label === label);
        if (!row) return;

        const parts = row.value
            .split(',')
            .map(part => part.trim())
            .filter(Boolean);
        const existingDetailIndex = parts.findIndex(part =>
            part.startsWith('Outros:'),
        );

        if (existingDetailIndex >= 0) {
            parts[existingDetailIndex] = `Outros: ${detail.trim()}`;
        } else if (parts.includes('Outros')) {
            parts[parts.indexOf('Outros')] = `Outros: ${detail.trim()}`;
        } else {
            parts.push(`Outros: ${detail.trim()}`);
        }

        row.value = parts.join(', ');
    };

    mergeOtherDetail('Alterações ungueais esquerda', leftOther?.value);
    mergeOtherDetail('Alterações ungueais direita', rightOther?.value);

    return rows.filter(
        row =>
            row.label !== 'Outra alteração esquerda' &&
            row.label !== 'Outra alteração direita',
    );
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

    const isDentalProfessional = React.useMemo(() => {
        try {
            const raw = localStorage.getItem('loggedProfessional');
            if (!raw) return false;
            const parsed = JSON.parse(raw) as { specialty?: string };
            const specialty = normalizeSpecialty(parsed?.specialty || '');
            return specialty.includes('odonto');
        } catch {
            return false;
        }
    }, []);

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
    const dynamicPodologyResponses = React.useMemo(
        () => getPodologyResponses(client),
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
          ].filter(row => hasValue(row.value) && row.value !== '-')
        : [];

    const podologiaRows: { label: string; value: string }[] =
        dynamicPodologyResponses.length > 0
            ? dynamicPodologyResponses.map(response => ({
                  label: response.label,
                  value: response.value,
              }))
            : anamnesePodologia
              ? [
                    {
                        label: 'Calçado usado',
                        value: anamnesePodologia.footwear_used || '-',
                    },
                    {
                        label: 'Meia usada',
                        value: anamnesePodologia.sock_used || '-',
                    },
                    {
                        label: 'Teste de sensibilidade',
                        value: anamnesePodologia.sensitivity_test || '-',
                    },
                    {
                        label: 'Alterações ungueais esquerda',
                        value: anamnesePodologia.nail_changes_left || '-',
                    },
                    {
                        label: 'Alterações ungueais direita',
                        value: anamnesePodologia.nail_changes_right || '-',
                    },
                    {
                        label: 'Outros procedimentos',
                        value: anamnesePodologia.other_procedures || '-',
                    },
                ].filter(row => hasValue(row.value) && row.value !== '-')
              : [];

    const odontoRows: { label: string; value: string }[] = anamneseOdontologia
        ? odontoFields
              .map(({ key, label, isBool }) => {
                  const rawValue = (
                      anamneseOdontologia as Record<string, unknown>
                  )[key];
                  if (rawValue === null || rawValue === undefined) return null;

                  const value = isBool
                      ? rawValue === true
                          ? 'Sim'
                          : 'Não'
                      : String(rawValue);

                  if (!hasValue(value)) return null;
                  return { label, value };
              })
              .filter((row): row is { label: string; value: string } => !!row)
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

            {isDentalProfessional ? (
                <ViewSection
                    theme={theme}
                    eyebrow='Visualização'
                    title='Anamnese Odontologia'
                    rows={odontoRows}
                    emptyMessage='Nenhum histórico registrado'
                />
            ) : (
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
