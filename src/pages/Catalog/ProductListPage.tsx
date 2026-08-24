import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../config/api';
import { apiFetch, ApiError } from '../../utils/apiFetch';
import FormPage from '../../components/FormKit/FormPage';
import FormSection from '../../components/FormKit/FormSection';
import { useLocation, useNavigate } from 'react-router-dom';
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

export default function ProductListPage() {
    const [items, setItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
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

    const filteredItems = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('pt-BR');
        if (!term) return items;
        return items.filter(product =>
            product.name.toLocaleLowerCase('pt-BR').includes(term),
        );
    }, [items, search]);

    return (
        <FormPage title='Produtos' onSubmit={e => e.preventDefault()}>
            <FormSection
                title='Lista'
                onClose={handleClose}
                closeTitle='Fechar'
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        marginBottom: 12,
                        gap: 8,
                        flexWrap: 'wrap',
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
                    <input
                        type='search'
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        placeholder='Search'
                        aria-label='Buscar produto por nome'
                        style={{
                            flex: '1 1 240px',
                            minWidth: 180,
                            maxWidth: 420,
                            border: '1px solid var(--color-border)',
                            borderRadius: 8,
                            padding: '9px 12px',
                            color: 'var(--color-text)',
                            background: 'var(--color-bg)',
                        }}
                    />
                </div>
                <div className={formStyles.catalogGrid}>
                    {filteredItems.map(product => (
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
                                </div>
                            </div>
                            {product.description?.trim() && (
                                <p
                                    className='mt-3 flex-1 text-sm'
                                    style={{
                                        color: 'var(--color-text-light)',
                                    }}
                                >
                                    {product.description.trim()}
                                </p>
                            )}
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
                {!loading && filteredItems.length === 0 && (
                    <div style={{ padding: 12, color: '#666' }}>
                        {search
                            ? 'Nenhum produto encontrado.'
                            : 'Nenhum produto cadastrado.'}
                    </div>
                )}
                {loading && <div style={{ padding: 12 }}>Carregando…</div>}
                {error && (
                    <div style={{ padding: 12, color: 'crimson' }}>{error}</div>
                )}
                <button
                    type='button'
                    onClick={() => window.print()}
                    style={{
                        position: 'fixed',
                        right: 20,
                        bottom: 20,
                        zIndex: 20,
                        border: '1px solid var(--btn-theme-border)',
                        borderRadius: 8,
                        padding: '10px 16px',
                        background: 'var(--btn-theme-bg)',
                        color: 'var(--btn-theme-text)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.16)',
                    }}
                >
                    Imprimir
                </button>
            </FormSection>
        </FormPage>
    );
}
