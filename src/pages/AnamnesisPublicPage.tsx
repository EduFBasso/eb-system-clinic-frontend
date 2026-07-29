import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '../config/api';
import { ClientForm } from '../components/ClientForm/ClientForm';
import type { AnamneseBaseData, ClientData } from '../types/ClientData';

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

export default function AnamnesisPublicPage() {
    const [searchParams] = useSearchParams();
    const token = (searchParams.get('token') || '').trim();

    const [loading, setLoading] = React.useState(true);
    const [expired, setExpired] = React.useState(false);
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
                const response = await fetch(
                    `${API_BASE}/register/clients/validate-anamnesis-token/`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ token }),
                    },
                );

                if (!response.ok) {
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
            <div
                style={{
                    minHeight: '100vh',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--color-bg)',
                    padding: '1.25rem',
                }}
            >
                <p style={{ margin: 0 }}>Validando link da ficha...</p>
            </div>
        );
    }

    if (expired || !cliente || !token) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--color-bg)',
                    padding: '1.25rem',
                }}
            >
                <div
                    style={{
                        width: 'min(560px, 96vw)',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 14,
                        padding: '1.25rem 1rem',
                        textAlign: 'center',
                        lineHeight: 1.5,
                    }}
                >
                    <p style={{ margin: 0 }}>{EXPIRED_MESSAGE}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                maxWidth: 900,
                padding: '2rem',
                margin: '0 auto',
                background: 'var(--color-bg)',
                minHeight: '100vh',
                boxSizing: 'border-box',
            }}
        >
            <ClientForm cliente={cliente} isPublicMode token={token} />
        </div>
    );
}
