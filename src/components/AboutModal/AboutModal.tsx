import React from 'react';
import { AppModal } from '../Modal/Modal';
import { coalesceVersion, fetchServerVersion } from '../../hooks/useAppVersion';
import { useTheme, type AppTheme } from '../../contexts/ThemeContext';
import { emit } from '../../events/bus';

const THEME_OPTIONS: Array<{
    value: AppTheme;
    label: string;
    swatch: string;
}> = [
    { value: 'blue', label: 'Azul', swatch: '#155eef' },
    { value: 'green', label: 'Verde', swatch: '#15803d' },
    { value: 'pink', label: 'Rosa', swatch: '#be185d' },
];

interface AboutModalProps {
    open: boolean;
    onClose: () => void;
    buildCommit?: string;
    buildTime?: string;
    backendVersion?: string;
}

function formatIso(iso: string) {
    try {
        const d = new Date(iso);
        return d.toLocaleString('pt-BR', { hour12: false });
    } catch {
        return iso;
    }
}

export const AboutModal: React.FC<AboutModalProps> = ({
    open,
    onClose,
    buildCommit,
    buildTime,
    backendVersion,
}) => {
    const { theme, setTheme } = useTheme();
    const [showArchivedPlans, setShowArchivedPlans] = React.useState(false);
    const [lockAfterPrint, setLockAfterPrint] = React.useState(true);
    const [resolvedBackendVersion, setResolvedBackendVersion] = React.useState<
        string | null
    >(backendVersion ?? null);

    React.useEffect(() => {
        if (!open) return;
        if (backendVersion) {
            setResolvedBackendVersion(backendVersion);
            return;
        }

        let cancelled = false;

        void (async () => {
            const serverVersion = coalesceVersion(await fetchServerVersion());
            if (!cancelled) {
                setResolvedBackendVersion(serverVersion);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [open, backendVersion]);

    return (
        <AppModal open={open} onClose={onClose}>
            <div style={{ padding: 8, maxWidth: 420 }}>
                <h3 style={{ marginTop: 0 }}>Configurações</h3>
                <section style={{ marginBottom: 12 }}>
                    <strong>Versão / Build</strong>
                    <div style={{ fontSize: 13 }}>
                        Frontend commit: {buildCommit || 'N/D'}
                    </div>
                    <div style={{ fontSize: 13 }}>
                        Build time: {buildTime ? formatIso(buildTime) : 'N/D'}
                    </div>
                    <div style={{ fontSize: 13 }}>
                        Backend: {resolvedBackendVersion || 'N/D'}
                    </div>
                </section>
                <section style={{ marginBottom: 16 }}>
                    <strong>Tema da Interface</strong>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: 8,
                            marginTop: 10,
                        }}
                    >
                        {THEME_OPTIONS.map(option => {
                            const selected = option.value === theme;
                            return (
                                <button
                                    key={option.value}
                                    type='button'
                                    className={
                                        selected
                                            ? 'ui-btn ui-btn--theme'
                                            : 'ui-btn ui-btn--neutral'
                                    }
                                    onClick={() => setTheme(option.value)}
                                    aria-pressed={selected}
                                    aria-label={`Aplicar tema ${option.label}`}
                                    style={{
                                        justifyContent: 'flex-start',
                                        width: '100%',
                                    }}
                                >
                                    <span
                                        aria-hidden='true'
                                        style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 999,
                                            background: option.swatch,
                                            border: '1px solid rgba(0,0,0,0.12)',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <span>{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>
                <section style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                    <label
                        style={{
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                        }}
                    >
                        <input
                            type='checkbox'
                            checked={showArchivedPlans}
                            onChange={event => {
                                const value = event.target.checked;
                                setShowArchivedPlans(value);
                                emit('treatmentSettingsUpdated', {
                                    showArchivedPlans: value,
                                });
                            }}
                        />
                        <span>
                            <strong>Mostrar planos arquivados</strong>
                            <small style={{ display: 'block', marginTop: 4 }}>
                                Exibe planos removidos com tratamentos para
                                preservar o histórico.
                            </small>
                        </span>
                    </label>
                    <label
                        style={{
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                        }}
                    >
                        <input
                            type='checkbox'
                            checked={lockAfterPrint}
                            onChange={event => {
                                const value = event.target.checked;
                                setLockAfterPrint(value);
                                emit('treatmentSettingsUpdated', {
                                    lockAfterPrint: value,
                                });
                            }}
                        />
                        <span>
                            <strong>Bloquear edição após imprimir?</strong>
                            <small style={{ display: 'block', marginTop: 4 }}>
                                A impressão trava o plano contra novas
                                alterações.
                            </small>
                        </span>
                    </label>
                </section>
                <div style={{ textAlign: 'right' }}>
                    <button
                        type='button'
                        className='ui-btn ui-btn--neutral'
                        onClick={onClose}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </AppModal>
    );
};
