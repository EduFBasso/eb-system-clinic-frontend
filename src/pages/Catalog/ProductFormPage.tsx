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
import { emit } from '../../events/bus';

export default function ProductFormPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const returnTo: string =
        (location.state as { returnTo?: string } | null)?.returnTo ??
        '/catalog/products';

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    // Exibição com 2 casas decimais em pt-BR
    const [priceStr, setPriceStr] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    function format2DecimalsBR(value: number | string): string {
        return Number(value || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    function parseBRToNumber(str: string): number {
        // remove milhares '.' e troca ',' por '.'
        if (!str) return 0;
        const normalized = str.replace(/\./g, '').replace(',', '.');
        const n = Number(normalized);
        return Number.isFinite(n) ? n : 0;
    }

    function parseIntOnlyDigits(str: string): number {
        if (!str) return 0;
        const digits = str.replace(/\D/g, '');
        const n = Number(digits);
        return Number.isFinite(n) ? n : 0;
    }

    // Carregar dados existentes no modo edição
    useEffect(() => {
        if (!id) return;
        let mounted = true;
        (async () => {
            try {
                const data = await apiFetch(
                    `${API_BASE}/inventory/products/${id}/`,
                );
                if (!mounted) return;
                const p = data as {
                    name: string;
                    description?: string;
                    price: number;
                };
                setName(p.name ?? '');
                setDescription(p.description ?? '');
                setPriceStr(format2DecimalsBR(p.price ?? 0));
            } catch (err) {
                if (!mounted) return;
                const msg = err instanceof ApiError ? err.message : String(err);
                setLoadError(msg || 'Erro ao carregar produto');
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
            setError('Informe o nome do produto.');
            return;
        }
        setSaving(true);
        try {
            const body = {
                name: name.trim(),
                description: description.trim() || undefined,
                price: parseBRToNumber(priceStr) || 0,
            };
            if (id) {
                await apiFetch(`${API_BASE}/inventory/products/${id}/`, {
                    method: 'PATCH',
                    body,
                });
            } else {
                await apiFetch(`${API_BASE}/inventory/products/`, {
                    method: 'POST',
                    body,
                });
            }
            const flashScope = getCatalogFlashScope(returnTo);
            if (flashScope) {
                queueFlashMessage(flashScope, {
                    text: id
                        ? 'Produto atualizado com sucesso.'
                        : 'Produto salvo com sucesso.',
                    type: 'success',
                    autoCloseMs: 6000,
                });
            } else {
                emit('systemMessage', {
                    text: id
                        ? 'Produto atualizado com sucesso.'
                        : 'Produto salvo com sucesso.',
                    type: 'success',
                    autoCloseMs: 4000,
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
            title={id ? 'Editar Produto' : 'Novo Produto'}
            onSubmit={onSubmit}
        >
            <FormSection title='Dados do produto'>
                {loadError && (
                    <div
                        style={{
                            color: 'crimson',
                            fontSize: 13,
                            marginBottom: 8,
                        }}
                    >
                        {loadError}
                    </div>
                )}
                <InputField
                    label='Nome'
                    value={name}
                    onChange={e =>
                        setName((e.target as HTMLInputElement).value)
                    }
                    required
                />
                <TextAreaField
                    label='Descrição'
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                />
                <InputField
                    label='Preço (R$)'
                    type='text'
                    inputMode='decimal'
                    value={priceStr}
                    onChange={e => {
                        const v = (e.target as HTMLInputElement).value;
                        const cleaned = v.replace(/[^0-9.,]/g, '');
                        setPriceStr(cleaned);
                    }}
                    onFocus={e => e.target.select()}
                    onBlur={e => {
                        const n = parseBRToNumber(
                            (e.target as HTMLInputElement).value,
                        );
                        setPriceStr(format2DecimalsBR(n));
                    }}
                    placeholder='0,00'
                />
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
