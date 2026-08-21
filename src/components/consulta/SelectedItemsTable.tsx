import React from 'react';
import type { SelectedItem } from '../../types/consulta';
import { formatBRL } from '../../types/consulta';

interface SelectedItemsTableProps {
    items: SelectedItem[];
    total: number;
    onRemove: (key: string) => void;
}

export default function SelectedItemsTable({
    items,
    total,
    onRemove,
}: SelectedItemsTableProps) {
    if (items.length === 0) {
        return (
            <p
                style={{
                    color: 'var(--color-text-muted)',
                    fontSize: 16,
                    margin: '8px 0 16px',
                }}
            >
                Nenhum item adicionado ainda.
            </p>
        );
    }

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginBottom: 8,
                    width: '100%',
                }}
            >
                {items.map(item => (
                    <div
                        key={item.key}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '12px 10px',
                            borderBottom: '1px solid var(--color-border)',
                            minWidth: 0,
                        }}
                    >
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                                style={{
                                    color: 'var(--color-text)',
                                    fontSize: 16,
                                    lineHeight: 1.25,
                                    overflowWrap: 'anywhere',
                                }}
                            >
                                {item.kind === 'service' ? '📋' : '📦'}{' '}
                                {item.name}
                            </div>
                            <div
                                style={{
                                    marginTop: 4,
                                    color: 'var(--color-text-muted)',
                                    fontSize: 13,
                                }}
                            >
                                Valor: R$ {formatBRL(item.unit_price)}
                            </div>
                        </div>
                        <button
                            type='button'
                            onClick={() => onRemove(item.key)}
                            title={`Remover ${item.name}`}
                            aria-label={`Remover ${item.name}`}
                            style={{
                                flex: '0 0 44px',
                                width: 44,
                                height: 44,
                                border: '1px solid var(--color-danger)',
                                borderRadius: 8,
                                background: 'transparent',
                                cursor: 'pointer',
                                color: 'var(--color-danger)',
                                fontSize: 24,
                                lineHeight: 1,
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 4px',
                    fontWeight: 700,
                    fontSize: 18,
                    color: 'var(--color-text)',
                    borderTop: '2px solid var(--color-border)',
                    marginBottom: 4,
                }}
            >
                <span>Total:</span>
                <span>R$ {formatBRL(total)}</span>
            </div>
        </>
    );
}
