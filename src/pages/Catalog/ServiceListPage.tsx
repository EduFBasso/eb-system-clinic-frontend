import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../config/api';
import { apiFetch, ApiError } from '../../utils/apiFetch';
import FormPage from '../../components/FormKit/FormPage';
import FormSection from '../../components/FormKit/FormSection';
import CatalogPrintView from '../../components/catalog/CatalogPrintView';
import ActionPromptModal from '../../components/shared/ActionPromptModal';
import { emit } from '../../events/bus';
import { useLocation, useNavigate } from 'react-router-dom';
import formStyles from '../../styles/pages/Client.module.css';
import type { ServiceFlowType } from '../odontoArcadeHelpers';

type Service = {
    id: number;
    name: string;
    description?: string;
    default_notes?: string;
    base_price: number;
    treatment_scopes?: ServiceFlowType[];
};

const TREATMENT_SCOPE_LABELS: Record<ServiceFlowType, string> = {
    tooth: 'Por dente',
    arch: 'Arcada',
    other: 'Outros',
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
    const [search, setSearch] = useState('');
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
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

    const filteredItems = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('pt-BR');
        if (!term) return items;
        return items.filter(service =>
            service.name.toLocaleLowerCase('pt-BR').includes(term),
        );
    }, [items, search]);

    function toggleSelectionMode() {
        if (selectionMode) {
            setSelectedIds(new Set());
            setConfirmDeleteOpen(false);
        }
        setSelectionMode(current => !current);
    }

    function toggleSelected(serviceId: number) {
        setSelectedIds(current => {
            const next = new Set(current);
            if (next.has(serviceId)) next.delete(serviceId);
            else next.add(serviceId);
            return next;
        });
    }

    async function deleteSelectedServices() {
        const ids = Array.from(selectedIds);
        setConfirmDeleteOpen(false);
        setDeleting(true);
        const deletedIds: number[] = [];
        const failedIds: number[] = [];

        for (const serviceId of ids) {
            try {
                await apiFetch(`${API_BASE}/inventory/services/${serviceId}/`, {
                    method: 'DELETE',
                });
                deletedIds.push(serviceId);
            } catch {
                failedIds.push(serviceId);
            }
        }

        setItems(current =>
            current.filter(service => !deletedIds.includes(service.id)),
        );
        setSelectedIds(new Set(failedIds));
        setDeleting(false);

        if (failedIds.length === 0) {
            setSelectionMode(false);
            emit('systemMessage', {
                text: `${deletedIds.length} ${deletedIds.length === 1 ? 'serviço removido' : 'serviços removidos'} do catálogo.`,
                type: 'success',
            });
            return;
        }

        emit('systemMessage', {
            text: `Não foi possível remover ${failedIds.length} ${failedIds.length === 1 ? 'serviço' : 'serviços'}.`,
            type: 'error',
        });
    }

    return (
        <>
            <div data-screen-only style={{ display: 'contents' }}>
                <FormPage title='Serviços' onSubmit={e => e.preventDefault()}>
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
                                    navigate('/catalog/services/new', {
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
                                aria-label='Buscar serviço por nome'
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
                            {filteredItems.map(service => (
                                <article
                                    key={service.id}
                                    className={`${formStyles.catalogCard} flex w-full flex-col ${selectionMode ? formStyles.catalogCardSelectable : ''} ${selectedIds.has(service.id) ? formStyles.catalogCardSelected : ''}`}
                                    style={{
                                        minHeight: 156,
                                    }}
                                    onClick={
                                        selectionMode
                                            ? () => toggleSelected(service.id)
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
                                        <h2
                                            className='min-w-0 flex-1 break-words pr-1 font-bold'
                                            style={{
                                                color: 'var(--color-success-dark)',
                                                margin: 0,
                                            }}
                                        >
                                            {service.name}
                                        </h2>
                                        {!selectionMode && (
                                            <button
                                                type='button'
                                                className={
                                                    formStyles.catalogEditButton
                                                }
                                                onClick={() =>
                                                    navigate(
                                                        `/catalog/services/${service.id}`,
                                                        {
                                                            state: { returnTo },
                                                        },
                                                    )
                                                }
                                                aria-label={`Editar ${service.name}`}
                                            >
                                                Editar
                                            </button>
                                        )}
                                    </div>
                                    {(service.description?.trim() ||
                                        service.default_notes?.trim()) && (
                                        <p
                                            className='mt-2 flex-1 text-sm'
                                            style={{
                                                color: 'var(--color-text-light)',
                                            }}
                                        >
                                            {service.description?.trim() ||
                                                service.default_notes?.trim()}
                                        </p>
                                    )}
                                    <div
                                        className={formStyles.catalogScopeList}
                                    >
                                        {(service.treatment_scopes ?? [])
                                            .length > 0 ? (
                                            service.treatment_scopes?.map(
                                                scope => (
                                                    <span key={scope}>
                                                        {
                                                            TREATMENT_SCOPE_LABELS[
                                                                scope
                                                            ]
                                                        }
                                                    </span>
                                                ),
                                            )
                                        ) : (
                                            <span
                                                className={
                                                    formStyles.catalogScopeMissing
                                                }
                                            >
                                                Sem subcategoria
                                            </span>
                                        )}
                                    </div>
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
                                    {selectionMode && (
                                        <input
                                            type='checkbox'
                                            className={
                                                formStyles.catalogCheckbox
                                            }
                                            checked={selectedIds.has(
                                                service.id,
                                            )}
                                            onClick={event =>
                                                event.stopPropagation()
                                            }
                                            onChange={() =>
                                                toggleSelected(service.id)
                                            }
                                            aria-label={`Selecionar ${service.name}`}
                                        />
                                    )}
                                </article>
                            ))}
                        </div>
                        {!loading && filteredItems.length === 0 && (
                            <div style={{ padding: 12, color: '#666' }}>
                                {search
                                    ? 'Nenhum serviço encontrado.'
                                    : 'Nenhum serviço cadastrado.'}
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
                    title='Excluir serviços selecionados?'
                    message={
                        <p style={{ margin: 0 }}>
                            Esta ação removerá permanentemente{' '}
                            <strong>{selectedIds.size}</strong>{' '}
                            {selectedIds.size === 1 ? 'serviço' : 'serviços'} do
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
                            onClick: deleteSelectedServices,
                        },
                    ]}
                />
            </div>
            <CatalogPrintView
                title='Catálogo de Serviços'
                items={filteredItems.map(service => ({
                    id: service.id,
                    name: service.name,
                    description:
                        service.description?.trim() ||
                        service.default_notes?.trim(),
                    price: Number(service.base_price || 0),
                }))}
            />
        </>
    );
}
