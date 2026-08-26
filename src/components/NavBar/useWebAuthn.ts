import { useState, useEffect } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';

// Tipagem básica para garantir que o TypeScript não reclame dos dados
interface WebAuthnLoginProps {
    loginEmail: string;
    API_BASE: string;
    biometricStorageKey: (email: string) => string;
    getOrCreateDeviceId: (key: string) => string;
    onSuccess: (data: any) => void;
    onError: (message: string, isCancellation: boolean) => void;
}

export function useWebAuthn() {
    const [biometricLoading, setBiometricLoading] = useState(false);
    const [platformAuthenticatorAvailable, setPlatformAuthenticatorAvailable] =
        useState(false);

    // Verifica suporte a biometria no navegador/dispositivo
    useEffect(() => {
        if (window.PublicKeyCredential) {
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                .then(result => {
                    setPlatformAuthenticatorAvailable(result);
                })
                .catch(() => {
                    setPlatformAuthenticatorAvailable(false);
                });
        }
    }, []);

    const handleBiometricLogin = async ({
        loginEmail,
        API_BASE,
        biometricStorageKey,
        getOrCreateDeviceId,
        onSuccess,
        onError,
    }: WebAuthnLoginProps) => {
        setBiometricLoading(true);
        try {
            const beginRes = await fetch(
                `${API_BASE}/register/auth/webauthn/login-begin/`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loginEmail }),
                },
            );
            if (!beginRes.ok) throw new Error('Erro ao iniciar autenticação.');

            const options = await beginRes.json();
            const assertion = await startAuthentication({
                optionsJSON: options,
            });

            const deviceIdKey = 'device_id';
            const deviceId = getOrCreateDeviceId(deviceIdKey);

            const completeRes = await fetch(
                `${API_BASE}/register/auth/webauthn/login-complete/`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: loginEmail,
                        assertion,
                        device_id: deviceId,
                    }),
                },
            );

            let data: any = {};
            try {
                data = await completeRes.json();
            } catch {
                data = { message: 'Falha ao interpretar resposta do servidor' };
            }

            if (completeRes.ok && data.access) {
                // Salva as chaves de armazenamento que pertencem estritamente à biometria
                localStorage.setItem(biometricStorageKey(loginEmail), '1');
                if (data.device_id) {
                    localStorage.setItem(deviceIdKey, String(data.device_id));
                }
                // Dispara a função de sucesso que vai rodar na NavBar
                onSuccess(data);
            } else {
                onError(
                    String(data.message || 'Autenticação biométrica falhou.'),
                    false,
                );
            }
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Erro na autenticação biométrica.';
            const isCancellation =
                msg.toLowerCase().includes('cancel') ||
                msg.toLowerCase().includes('not allowed');
            onError(msg, isCancellation);
        } finally {
            setBiometricLoading(false);
        }
    };

    return {
        biometricLoading,
        platformAuthenticatorAvailable,
        handleBiometricLogin,
    };
}
