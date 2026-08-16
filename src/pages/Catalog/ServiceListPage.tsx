import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../config/api';
import { apiFetch, ApiError } from '../../utils/apiFetch';
import FormPage from '../../components/FormKit/FormPage';
import FormSection from '../../components/FormKit/FormSection';
import { useLocation, useNavigate } from 'react-router-dom';
import { consumeFlashMessage } from '../../utils/flashMessage';

type Service = {
    id: number;
    name: string;
    description?: string;
    base_price: number;
};

function format2DecimalsBR(value: number): string {
    return Number(value || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export default function ServiceListPage() {
    const [items, setItems] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo =
        (location.state as { returnTo?: string } | null)?.returnTo ??
        '/catalog/services';
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

    const openServiceForm = useMemo(
        () => (serviceId?: number) => {
            const path = serviceId
                ? `/catalog/services/${serviceId}`
                : '/catalog/services/new';
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
                const raw = await apiFetch(`${API_BASE}/inventory/services/`);
                if (!mounted) return;
                const data = (Array.isArray(raw) ? raw : []) as Service[];
                setItems(data);
            } catch (err) {
                const msg = err instanceof ApiError ? err.message : String(err);
                setError(msg || 'Erro ao carregar serviços');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Exibe imediatamente a mensagem de sucesso ao retornar do formulário
    useEffect(() => {
        const message = consumeFlashMessage('catalog-services');
        if (!message?.text) return;
        setSuccessMsg(String(message.text));
        const ms =
            typeof message.autoCloseMs === 'number'
                ? message.autoCloseMs
                : 6000;
        setTimeout(() => setSuccessMsg(null), ms);
    }, []);

    return (
        <FormPage title='Serviços' onSubmit={e => e.preventDefault()}>
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
                        style={{
                            background: 'var(--color-primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '8px 14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                        title='Novo serviço'
                        onClick={() => openServiceForm()}
                    >
                        + Novo
                    </button>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'>
                    {items.map(service => (
                        <article
                            key={service.id}
                            className='flex flex-col w-full rounded-xl border p-4 shadow-sm'
                            style={{
                                background: 'var(--color-bg-section)',
                                borderColor: 'var(--color-border)',
                                borderBottom: '2px solid var(--color-border)',
                                minHeight: 156,
                                marginBottom: 4,
                                paddingBottom: 18,
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
                                <h2
                                    className='min-w-0 flex-1 break-words pr-1 font-bold'
                                    style={{
                                        color: 'var(--color-success-dark)',
                                        margin: 0,
                                    }}
                                >
                                    {service.name}
                                </h2>
                                <button
                                    aria-label={`Editar ${service.name}`}
                                    title='Editar serviço'
                                    onClick={() => openServiceForm(service.id)}
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
                                className='mt-2 flex-1 text-sm'
                                style={{
                                    color: 'var(--color-text-light)',
                                }}
                            >
                                {String(service.description || '').trim() ||
                                    'Sem descrição.'}
                            </p>
                            <div
                                className='mt-4 self-start text-sm font-bold'
                                style={{
                                    color: 'var(--color-success-dark)',
                                    marginTop: 16,
                                }}
                            >
                                R${' '}
                                {format2DecimalsBR(
                                    Number(service.base_price || 0),
                                )}
                            </div>
                        </article>
                    ))}
                </div>
                {!loading && items.length === 0 && (
                    <div style={{ padding: 12, color: '#666' }}>
                        Nenhum serviço cadastrado.
                    </div>
                )}
                {loading && <div style={{ padding: 12 }}>Carregando…</div>}
                {error && (
                    <div style={{ padding: 12, color: 'crimson' }}>{error}</div>
                )}
            </FormSection>
        </FormPage>
    );
}
