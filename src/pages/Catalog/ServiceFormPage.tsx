import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { API_BASE } from '../../config/api';
import { apiFetch, ApiError } from '../../utils/apiFetch';
import InputField from '../../components/FormElements/InputField';
import FormPage from '../../components/FormKit/FormPage';
import FormSection from '../../components/FormKit/FormSection';
import FormActions from '../../components/FormKit/FormActions';
import TextAreaField from '../../components/FormKit/TextAreaField';
import {
    getCatalogFlashScope,
    queueFlashMessage,
} from '../../utils/flashMessage';
import type { ServiceFlowType } from '../../components/Odonto/OdontoAnatomyHelpers';

type Service = {
    id: number;
    name: string;
    description?: string;
    base_price: number;
    is_active?: boolean;
    treatment_scopes?: ServiceFlowType[];
};

const TREATMENT_SCOPE_OPTIONS: Array<{
    value: ServiceFlowType;
    label: string;
}> = [
    { value: 'tooth', label: 'Por dente' },
    { value: 'arch', label: 'Arcada' },
    { value: 'other', label: 'Outros' },
];

function format2DecimalsBR(value: number | string): string {
    return Number(value || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function parseBRToNumber(str: string): number {
    if (!str) return 0;
    const normalized = str.replace(/\./g, '').replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
}

export default function ServiceFormPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const returnTo: string =
        (location.state as { returnTo?: string } | null)?.returnTo ??
        '/catalog/services';
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [basePriceStr, setBasePriceStr] = useState<string>('');
    const [treatmentScopes, setTreatmentScopes] = useState<ServiceFlowType[]>(
        [],
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const raw = await apiFetch(
                    `${API_BASE}/inventory/services/${id}/`,
                );
                const data = (raw || {}) as Partial<Service>;
                if (!mounted) return;
                setName(String(data.name || ''));
                setDescription(String(data.description || ''));
                setBasePriceStr(
                    format2DecimalsBR(Number(data.base_price || 0)),
                );
                setTreatmentScopes(data.treatment_scopes ?? []);
            } catch (err) {
                const msg = err instanceof ApiError ? err.message : String(err);
                setError(msg || 'Erro ao carregar serviço');
            } finally {
                setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [id]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!name.trim()) {
            setError('Informe o nome do serviço.');
            return;
        }
        if (treatmentScopes.length === 0) {
            setError('Selecione ao menos uma subcategoria de tratamento.');
            return;
        }
        setSaving(true);
        try {
            const body = {
                name: name.trim(),
                description: description.trim() || undefined,
                base_price: parseBRToNumber(basePriceStr) || 0,
                is_active: true,
                treatment_scopes: treatmentScopes,
            };
            if (id) {
                await apiFetch(`${API_BASE}/inventory/services/${id}/`, {
                    method: 'PUT',
                    body,
                });
            } else {
                await apiFetch(`${API_BASE}/inventory/services/`, {
                    method: 'POST',
                    body,
                });
            }
            const flashScope = getCatalogFlashScope(returnTo);
            if (flashScope) {
                queueFlashMessage(flashScope, {
                    text: id
                        ? 'Serviço atualizado com sucesso.'
                        : 'Serviço salvo com sucesso.',
                    type: 'success',
                    autoCloseMs: 6000,
                });
            }
            if (returnTo === '/consulta') {
                navigate(-1);
            } else {
                navigate(returnTo);
            }
        } catch (err) {
            const msg = err instanceof ApiError ? err.message : String(err);
            setError(msg || 'Erro ao salvar');
        } finally {
            setSaving(false);
        }
    }

    return (
        <FormPage
            title={id ? 'Editar Serviço' : 'Novo Serviço'}
            onSubmit={onSubmit}
        >
            <FormSection title='Dados do serviço'>
                {loading && <div style={{ marginBottom: 8 }}>Carregando…</div>}
                <InputField
                    label='Nome'
                    value={name}
                    onChange={e =>
                        setName((e.target as HTMLInputElement).value)
                    }
                    required
                />
                <TextAreaField
                    label='Descrição / Observações'
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                />
                <InputField
                    label='Preço base (R$)'
                    type='text'
                    inputMode='decimal'
                    value={basePriceStr}
                    onChange={e => {
                        const v = (e.target as HTMLInputElement).value;
                        const cleaned = v.replace(/[^0-9.,]/g, '');
                        setBasePriceStr(cleaned);
                    }}
                    onFocus={e => e.target.select()}
                    onBlur={e => {
                        const n = parseBRToNumber(
                            (e.target as HTMLInputElement).value,
                        );
                        setBasePriceStr(format2DecimalsBR(n));
                    }}
                    placeholder='0,00'
                />
                <fieldset
                    aria-label='Subcategorias do tratamento'
                    style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 8,
                        padding: 12,
                        margin: 0,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 16,
                        }}
                    >
                        {TREATMENT_SCOPE_OPTIONS.map(option => (
                            <label
                                key={option.value}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 7,
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type='checkbox'
                                    checked={treatmentScopes.includes(
                                        option.value,
                                    )}
                                    onChange={event =>
                                        setTreatmentScopes(current =>
                                            event.target.checked
                                                ? [...current, option.value]
                                                : current.filter(
                                                      scope =>
                                                          scope !==
                                                          option.value,
                                                  ),
                                        )
                                    }
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </fieldset>
                {error && (
                    <div style={{ color: 'crimson', fontSize: 13 }}>
                        {error}
                    </div>
                )}
                <FormActions saving={saving} onCancel={() => navigate(-1)} />
            </FormSection>
        </FormPage>
    );
}
