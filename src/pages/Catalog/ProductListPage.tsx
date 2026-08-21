import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../config/api';
import { apiFetch, ApiError } from '../../utils/apiFetch';
import FormPage from '../../components/FormKit/FormPage';
import FormSection from '../../components/FormKit/FormSection';
import { useLocation, useNavigate } from 'react-router-dom';
import { consumeFlashMessage } from '../../utils/flashMessage';
import formStyles from '../../styles/pages/Client.module.css';

type Product = {
    id: number;
    name: string;
    type: 'PRODUCT' | 'MEDICATION';
    description?: string;
    price: number;
};

function format2DecimalsBR(value: number): string {
    return Number(value || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function visibleDescription(description?: string): string {
    const value = String(description || '').trim();
    if (!value.startsWith('odonto_scope:')) return value;
    return value.replace(/^odonto_scope:(?:tooth|arch|all)\s*/i, '').trim();
}

export default function ProductListPage() {
    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo =
        (location.state as { returnTo?: string } | null)?.returnTo ??
        '/catalog/products';
    const cameFromConsulta = returnTo === '/consulta';

    const handleClose = useMemo(
        () => () => {
            if (cameFromConsulta) {
                navigate(-1);
                return;
            }
            navigate('/');
        },
        [cameFromConsulta, navigate],
    );

    const openProductForm = useMemo(
        () => (productId?: number) => {
            const path = productId
                ? `/catalog/products/${productId}`
                : '/catalog/products/new';
            navigate(path, { state: { returnTo } });
        },
        [navigate, returnTo],
    );

    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiFetch(`${API_BASE}/inventory/products/`);
                if (!mounted) return;
                const list = (Array.isArray(data) ? data : []) as Product[];
                setItems(list);
            } catch (err) {
                const msg = err instanceof ApiError ? err.message : String(err);
                setError(msg || 'Erro ao carregar produtos');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const message = consumeFlashMessage('catalog-products');
        if (!message?.text) return;
        setSuccessMsg(String(message.text));
        const ms =
            typeof message.autoCloseMs === 'number'
                ? message.autoCloseMs
                : 6000;
        setTimeout(() => setSuccessMsg(null), ms);
    }, []);

    if (loading) return <div style={{ padding: 16 }}>Carregando…</div>;
    if (error)
        return <div style={{ padding: 16, color: 'crimson' }}>{error}</div>;

    return (
        <FormPage title='Produtos' onSubmit={e => e.preventDefault()}>
            <FormSection
                title='Lista'
                onClose={handleClose}
                closeTitle='Fechar'
            >
                {successMsg && (
                    <div
                        style={{
                            marginBottom: 8,
                            padding: '10px 12px',
                            background: 'var(--color-success-bg)',
                            border: '1px solid var(--color-success-dark)',
                            borderRadius: 8,
                            color: 'var(--color-success-dark)',
                            fontWeight: 600,
                        }}
                    >
                        {successMsg}
                    </div>
                )}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                        gap: 8,
                    }}
                >
                    <button
                        className='btn'
                        onClick={handleClose}
                        style={{
                            background: 'transparent',
                            color: 'var(--color-text)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            padding: '8px 14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                        title='Voltar'
                    >
                        ← Voltar
                    </button>
                    <button
                        className='btn'
                        onClick={() => openProductForm()}
                        style={{
                            background: 'var(--color-primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        + Novo
                    </button>
                </div>
                <div className={formStyles.catalogGrid}>
                    {items.map(product => (
                        <article
                            key={product.id}
                            className={`${formStyles.catalogCard} flex w-full flex-col`}
                            style={{
                                minHeight: 156,
                            }}
                        >
                            <div
                                className='flex min-w-0 items-start justify-between gap-3'
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <div className='min-w-0 flex-1 pr-1'>
                                    <h2
                                        className='break-words font-bold'
                                        style={{
                                            color: 'var(--color-success-dark)',
                                            margin: 0,
                                        }}
                                    >
                                        {product.name}
                                    </h2>
                                    <span
                                        className='mt-1 inline-block text-xs'
                                        style={{
                                            color: 'var(--color-text-muted)',
                                        }}
                                    >
                                        {product.type === 'MEDICATION'
                                            ? 'Medicamento'
                                            : 'Produto'}
                                    </span>
                                </div>
                                <button
                                    aria-label={`Editar ${product.name}`}
                                    title='Editar produto'
                                    onClick={() => openProductForm(product.id)}
                                    className='flex h-11 w-11 shrink-0 items-center justify-center rounded-md border'
                                    style={{
                                        background: 'transparent',
                                        borderColor: 'var(--color-border)',
                                        cursor: 'pointer',
                                        fontSize: 17,
                                    }}
                                >
                                    ✏️
                                </button>
                            </div>
                            <p
                                className='mt-3 flex-1 text-sm'
                                style={{ color: 'var(--color-text-light)' }}
                            >
                                {visibleDescription(product.description) ||
                                    'Sem descrição.'}
                            </p>
                            <div
                                className='mt-4 self-start text-sm font-bold'
                                style={{
                                    color: 'var(--color-success-dark)',
                                    marginTop: 16,
                                }}
                            >
                                R$ {format2DecimalsBR(product.price)}
                            </div>
                        </article>
                    ))}
                </div>
            </FormSection>
        </FormPage>
    );
}
