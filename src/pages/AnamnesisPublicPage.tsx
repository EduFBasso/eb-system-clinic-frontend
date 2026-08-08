import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '../config/api';
import { ClientForm } from '../components/ClientForm/ClientForm';
import type { AnamneseBaseData, ClientData } from '../types/ClientData';
import styles from './AnamnesisPublicPage.module.css';
import type { AppTheme } from '../contexts/ThemeContext';

type ValidateResponse = {
    client?: {
        id?: number;
        first_name?: string;
        last_name?: string;
        email?: string | null;
        phone?: string | null;
        profession?: string | null;
        document_type?: 'cpf' | 'cnpj' | '' | null;
        document_number?: string | null;
        sex?: string | null;
        marital_status?: string | null;
        address?: string | null;
        neighborhood?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
        address_number?: string | null;
        address_complement?: string | null;
        date_of_birth?: string | null;
        anamnese_base?: Partial<AnamneseBaseData> | null;
    };
};

const EXPIRED_MESSAGE =
    'Este link expirou ou é inválido. Por favor, solicite uma nova ficha de saúde com o profissional.';

const FALLBACK_PUBLIC_THEME: AppTheme = 'blue';

function isAppTheme(value: string): value is AppTheme {
    return value === 'blue' || value === 'green' || value === 'pink';
}

export default function AnamnesisPublicPage() {
    const [searchParams] = useSearchParams();
    const token = (searchParams.get('token') || '').trim();
    const requestedTheme = (searchParams.get('theme') || '')
        .trim()
        .toLowerCase();
    const publicTheme: AppTheme = isAppTheme(requestedTheme)
        ? requestedTheme
        : FALLBACK_PUBLIC_THEME;

    const [loading, setLoading] = React.useState(true);
    const [expired, setExpired] = React.useState(false);
    const [submitted, setSubmitted] = React.useState(false);
    const [errorDetail, setErrorDetail] = React.useState<string>('');
    const [cliente, setCliente] = React.useState<Partial<ClientData> | null>(
        null,
    );

    React.useEffect(() => {
        let cancelled = false;

        async function validateToken() {
            if (!token) {
                if (!cancelled) {
                    setExpired(true);
                    setLoading(false);
                }
                return;
            }

            try {
                const validateUrl = `${API_BASE}/register/clients/validate-anamnesis-token/`;
                if (import.meta.env.DEV) {
                    console.info(
                        '[anamnesis-public] validate-url',
                        validateUrl,
                    );
                }

                const response = await fetch(validateUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                if (!response.ok) {
                    let detail = EXPIRED_MESSAGE;
                    try {
                        const data = (await response.json()) as {
                            detail?: unknown;
                        };
                        if (
                            typeof data.detail === 'string' &&
                            data.detail.trim()
                        ) {
                            detail = data.detail.trim();
                        }
                    } catch {
                        /* noop */
                    }

                    if (import.meta.env.DEV) {
                        console.warn('[anamnesis-public] validate-failed', {
                            status: response.status,
                            detail,
                            apiBase: API_BASE,
                            href: window.location.href,
                        });
                        setErrorDetail(
                            `status=${response.status} detail=${detail}`,
                        );
                    }

                    if (!cancelled) {
                        setExpired(true);
                        setLoading(false);
                    }
                    return;
                }

                const data = (await response.json()) as ValidateResponse;
                const firstName = data?.client?.first_name || '';
                const lastName = data?.client?.last_name || '';

                if (!firstName || !lastName) {
                    if (!cancelled) {
                        setExpired(true);
                        setLoading(false);
                    }
                    return;
                }

                if (!cancelled) {
                    const rawClient = data.client ?? {};
                    setCliente({
                        id: rawClient.id,
                        first_name: firstName,
                        last_name: lastName,
                        email: rawClient.email ?? '',
                        phone: rawClient.phone ?? '',
                        profession: rawClient.profession ?? '',
                        document_type: rawClient.document_type ?? '',
                        document_number: rawClient.document_number ?? '',
                        sex: rawClient.sex ?? '',
                        marital_status: rawClient.marital_status ?? '',
                        address: rawClient.address ?? '',
                        neighborhood: rawClient.neighborhood ?? '',
                        city: rawClient.city ?? 'Limeira',
                        state: rawClient.state ?? 'SP',
                        postal_code: rawClient.postal_code ?? '',
                        address_number: rawClient.address_number ?? '',
                        address_complement: rawClient.address_complement ?? '',
                        date_of_birth: rawClient.date_of_birth ?? '',
                        anamnese_base: rawClient.anamnese_base ?? null,
                    });
                    setExpired(false);
                    setLoading(false);
                }
            } catch {
                if (import.meta.env.DEV) {
                    console.warn('[anamnesis-public] validate-network-error', {
                        apiBase: API_BASE,
                        href: window.location.href,
                    });
                    setErrorDetail('network-error ao validar token');
                }
                if (!cancelled) {
                    setExpired(true);
                    setLoading(false);
                }
            }
        }

        void validateToken();

        return () => {
            cancelled = true;
        };
    }, [token]);

    if (loading) {
        return (
            <div className={styles.centeredState} data-theme={publicTheme}>
                <p className={styles.loadingMessage}>
                    Validando link da ficha...
                </p>
            </div>
        );
    }

    if (expired || !cliente || !token) {
        return (
            <div className={styles.centeredState} data-theme={publicTheme}>
                <div className={styles.expiredCard}>
                    <p className={styles.expiredText}>{EXPIRED_MESSAGE}</p>
                    {import.meta.env.DEV && !!errorDetail && (
                        <p className={styles.expiredText}>{errorDetail}</p>
                    )}
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className={styles.centeredState} data-theme={publicTheme}>
                <div className={styles.successToast}>
                    <p className={styles.successText}>
                        Obrigado! Seus dados foram atualizados com sucesso. Você
                        já pode fechar esta página.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer} data-theme={publicTheme}>
            <ClientForm
                cliente={cliente}
                isPublicMode
                token={token}
                themeOverride={publicTheme}
                onPublicSubmitSuccess={() => setSubmitted(true)}
            />
        </div>
    );
}
