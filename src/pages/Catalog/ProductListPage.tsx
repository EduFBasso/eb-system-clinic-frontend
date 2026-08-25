import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../config/api';
import { apiFetch, ApiError } from '../../utils/apiFetch';
import FormPage from '../../components/FormKit/FormPage';
import FormSection from '../../components/FormKit/FormSection';
import CatalogPrintView from '../../components/Catalog/CatalogPrintView';
import ActionPromptModal from '../../components/Shared/ActionPromptModal';
import { emit } from '../../events/bus';
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
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
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

    function toggleSelectionMode() {
        if (selectionMode) {
            setSelectedIds(new Set());
            setConfirmDeleteOpen(false);
        }
        setSelectionMode(current => !current);
    }

    function toggleSelected(productId: number) {
        setSelectedIds(current => {
            const next = new Set(current);
            if (next.has(productId)) next.delete(productId);
            else next.add(productId);
            return next;
        });
    }

    async function deleteSelectedProducts() {
        const ids = Array.from(selectedIds);
        setConfirmDeleteOpen(false);
        setDeleting(true);
        const deletedIds: number[] = [];
        const failedIds: number[] = [];

        for (const productId of ids) {
            try {
                await apiFetch(`${API_BASE}/inventory/products/${productId}/`, {
                    method: 'DELETE',
                });
                deletedIds.push(productId);
            } catch {
                failedIds.push(productId);
            }
        }

        setItems(current =>
            current.filter(product => !deletedIds.includes(product.id)),
        );
        setSelectedIds(new Set(failedIds));
        setDeleting(false);

        if (failedIds.length === 0) {
            setSelectionMode(false);
            emit('systemMessage', {
                text: `${deletedIds.length} ${deletedIds.length === 1 ? 'produto removido' : 'produtos removidos'} do catálogo.`,
                type: 'success',
            });
            return;
        }

        emit('systemMessage', {
            text: `Não foi possível remover ${failedIds.length} ${failedIds.length === 1 ? 'produto' : 'produtos'}.`,
            type: 'error',
        });
    }

    return (
        <>
            <div data-screen-only style={{ display: 'contents' }}>
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
                            <button
                                type='button'
                                className={`${formStyles.catalogActionButton} ${formStyles.catalogCompactButton} ${formStyles.catalogThemeButton}`}
                                onClick={() =>
                                    navigate('/catalog/products/new', {
                                        state: { returnTo },
                                    })
                                }
                                disabled={selectionMode || deleting}
                            >
                                + Novo
                            </button>
                            <button
                                type='button'
                                className={`${formStyles.catalogActionButton} ${formStyles.catalogCompactButton} ${!selectionMode ? formStyles.catalogSelectButton : ''}`}
                                onClick={toggleSelectionMode}
                                disabled={deleting || items.length === 0}
                            >
                                {selectionMode ? 'Cancelar' : 'Apagar'}
                            </button>
                            {selectionMode && (
                                <button
                                    type='button'
                                    className={`${formStyles.catalogActionButton} ${formStyles.catalogCompactButton} ${formStyles.catalogDeleteButton}`}
                                    onClick={() => setConfirmDeleteOpen(true)}
                                    disabled={
                                        selectedIds.size === 0 || deleting
                                    }
                                >
                                    {deleting
                                        ? 'Excluindo...'
                                        : `Excluir selecionados (${selectedIds.size})`}
                                </button>
                            )}
                            <input
                                type='search'
                                value={search}
                                onChange={event =>
                                    setSearch(event.target.value)
                                }
                                placeholder='Pesquisar'
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
                                    className={`${formStyles.catalogCard} flex w-full flex-col ${selectionMode ? formStyles.catalogCardSelectable : ''} ${selectedIds.has(product.id) ? formStyles.catalogCardSelected : ''}`}
                                    style={{
                                        minHeight: 156,
                                    }}
                                    onClick={
                                        selectionMode
                                            ? () => toggleSelected(product.id)
                                            : undefined
                                    }
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
                                        {!selectionMode && (
                                            <button
                                                type='button'
                                                className={
                                                    formStyles.catalogEditButton
                                                }
                                                onClick={() =>
                                                    navigate(
                                                        `/catalog/products/${product.id}`,
                                                        {
                                                            state: { returnTo },
                                                        },
                                                    )
                                                }
                                                aria-label={`Editar ${product.name}`}
                                            >
                                                Editar
                                            </button>
                                        )}
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
                                    {selectionMode && (
                                        <input
                                            type='checkbox'
                                            className={
                                                formStyles.catalogCheckbox
                                            }
                                            checked={selectedIds.has(
                                                product.id,
                                            )}
                                            onClick={event =>
                                                event.stopPropagation()
                                            }
                                            onChange={() =>
                                                toggleSelected(product.id)
                                            }
                                            aria-label={`Selecionar ${product.name}`}
                                        />
                                    )}
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
                        {loading && (
                            <div style={{ padding: 12 }}>Carregando…</div>
                        )}
                        {error && (
                            <div style={{ padding: 12, color: 'crimson' }}>
                                {error}
                            </div>
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
                <ActionPromptModal
                    open={confirmDeleteOpen}
                    title='Excluir produtos selecionados?'
                    message={
                        <p style={{ margin: 0 }}>
                            Esta ação removerá permanentemente{' '}
                            <strong>{selectedIds.size}</strong>{' '}
                            {selectedIds.size === 1 ? 'produto' : 'produtos'} do
                            catálogo. Itens já usados em planos conservarão o
                            nome registrado.
                        </p>
                    }
                    onClose={() => setConfirmDeleteOpen(false)}
                    actions={[
                        {
                            label: 'Cancelar',
                            onClick: () => setConfirmDeleteOpen(false),
                        },
                        {
                            label: 'Excluir',
                            variant: 'danger',
                            onClick: deleteSelectedProducts,
                        },
                    ]}
                />
            </div>
            <CatalogPrintView
                title='Catálogo de Produtos'
                items={filteredItems.map(product => ({
                    id: product.id,
                    name: product.name,
                    description: product.description?.trim(),
                    price: Number(product.price || 0),
                }))}
            />
        </>
    );
}
