import { API_BASE } from '../../config/api';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { formatDOBToBR, normalizeDOBForApi } from '../../utils/dateOfBirth';
import type {
    AnamneseBaseData,
    AnamnesePodologiaData,
    ClientData,
} from '../../types/ClientData';
import ClientPersonalDataForm from '../ClientPersonalDataForm/ClientPersonalDataForm';
import ClientAddressForm from '../ClientAddressForm/ClientAddressForm';
import ClientAnamnesisForm from '../ClientAnamnesisForm/ClientAnamnesisForm';
import ClientPodologiaSection from './ClientPodologiaSection';
import DentalAnamnesisForm, {
    type DentalAnamnesisValues,
    type ToothBrushingFrequency,
} from '../DentalAnamnesisForm/DentalAnamnesisForm';
import styles from './ClientForm.module.css';
import useUnsavedChangesGuard from '../../hooks/useUnsavedChangesGuard';
import { useClientDelete } from '../../hooks/useClientDelete';
import { parseApiError } from '../../utils/parseApiError';
import InfoModal from '../shared/InfoModal';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import type { AppTheme } from '../../contexts/ThemeContext';
import { getAccessToken } from '../../utils/auth/session';
import { SmartSection } from '../SmartSection/SmartSection';
import {
    hasOdontoCapability,
    hasPodologiaCapability,
    readLoggedProfessionalCapabilities,
} from '../../utils/tenantCapabilities';

interface ClientFormProps {
    cliente?: Partial<ClientData>;
    isPublicMode?: boolean;
    token?: string;
    themeOverride?: AppTheme;
    onPublicSubmitSuccess?: () => void;
}

function buildDefaultClientData(cliente?: Partial<ClientData>): ClientData {
    return {
        first_name: cliente?.first_name ?? '',
        last_name: cliente?.last_name ?? '',
        email: cliente?.email ?? '',
        phone: cliente?.phone ?? '',
        profession: cliente?.profession ?? '',
        document_type: cliente?.document_type ?? '',
        document_number: cliente?.document_number ?? '',
        sex: cliente?.sex ?? '',
        marital_status: cliente?.marital_status ?? '',
        address: cliente?.address ?? '',
        neighborhood: cliente?.neighborhood ?? '',
        city: cliente?.city ?? 'Limeira',
        state: cliente?.state ?? 'SP',
        postal_code: cliente?.postal_code ?? '',
        address_number: cliente?.address_number ?? '',
        address_complement: cliente?.address_complement ?? '',
        date_of_birth:
            formatDOBToBR(cliente?.date_of_birth ?? '') ??
            cliente?.date_of_birth ??
            '',
    };
}

function buildDefaultAnamneseBase(
    cliente?: Partial<ClientData>,
): AnamneseBaseData {
    const legacy = (cliente ?? {}) as Partial<ClientData> &
        Partial<AnamneseBaseData>;
    const nested = cliente?.anamnese_base ?? {};

    const clinicalHistoryRaw =
        nested.clinical_history ?? legacy.clinical_history ?? '';
    const clinicalHistory = Array.isArray(clinicalHistoryRaw)
        ? clinicalHistoryRaw.filter(Boolean).join(', ')
        : typeof clinicalHistoryRaw === 'string'
          ? clinicalHistoryRaw
          : '';

    return {
        takes_medication:
            nested.takes_medication ?? legacy.takes_medication ?? 'Não',
        had_surgery: nested.had_surgery ?? legacy.had_surgery ?? 'Não',
        is_pregnant: nested.is_pregnant ?? legacy.is_pregnant ?? null,
        pain_sensitivity:
            nested.pain_sensitivity ?? legacy.pain_sensitivity ?? 'Moderada',
        clinical_history: clinicalHistory || 'Sem histórico relevante',
        sport_activity: nested.sport_activity ?? legacy.sport_activity ?? 'Não',
    };
}

function buildDefaultPodologia(
    cliente?: Partial<ClientData>,
): AnamnesePodologiaData {
    const podologia = cliente?.anamnese_podologia ?? {};
    return {
        footwear_used: podologia.footwear_used ?? '',
        sock_used: podologia.sock_used ?? '',
        plantar_view_left: podologia.plantar_view_left ?? '',
        plantar_view_right: podologia.plantar_view_right ?? '',
        dermatological_pathologies_left:
            podologia.dermatological_pathologies_left ?? '',
        dermatological_pathologies_right:
            podologia.dermatological_pathologies_right ?? '',
        nail_changes_left: podologia.nail_changes_left ?? '',
        nail_changes_right: podologia.nail_changes_right ?? '',
        deformities_left: podologia.deformities_left ?? '',
        deformities_right: podologia.deformities_right ?? '',
        sensitivity_test: podologia.sensitivity_test ?? '',
        other_procedures: podologia.other_procedures ?? '',
    };
}

function buildDefaultDentalAnamnesis(
    cliente?: Partial<ClientData>,
): DentalAnamnesisValues {
    const odontologia = cliente?.anamnese_odontologia ?? {};
    const frequency = odontologia.tooth_brushing_frequency ?? '';
    const toothBrushingFrequency: ToothBrushingFrequency = [
        '',
        '1 vez',
        '2 vezes',
        '3 ou mais vezes',
    ].includes(frequency)
        ? (frequency as ToothBrushingFrequency)
        : '';
    return {
        gum_bleeding: odontologia.gum_bleeding ?? false,
        floss_usage: odontologia.floss_usage ?? false,
        bruxism_clenching: odontologia.bruxism_clenching ?? false,
        tooth_brushing_frequency: toothBrushingFrequency,
        chief_dental_complaint: odontologia.chief_dental_complaint ?? '',
    };
}

export function ClientForm({
    cliente,
    isPublicMode = false,
    token: publicToken,
    themeOverride,
    onPublicSubmitSuccess,
}: ClientFormProps) {
    const { theme } = useTheme();
    const activeTheme = themeOverride ?? theme;
    const navigate = useNavigate();

    type HandledError = Error & { handled?: boolean };
    function isHandledError(e: unknown): e is HandledError {
        return typeof e === 'object' && e !== null && 'handled' in e;
    }

    const [formData, setFormData] = useState<ClientData>(() =>
        buildDefaultClientData(cliente),
    );
    const [anamneseBase, setAnamneseBase] = useState<AnamneseBaseData>(() =>
        buildDefaultAnamneseBase(cliente),
    );
    const [anamnesePodologia, setAnamnesePodologia] =
        useState<AnamnesePodologiaData>(() => buildDefaultPodologia(cliente));
    const [dentalAnamnesisValues, setDentalAnamnesisValues] =
        useState<DentalAnamnesisValues>(() =>
            buildDefaultDentalAnamnesis(cliente),
        );

    const capabilities = useMemo(readLoggedProfessionalCapabilities, []);
    const hasOdonto = hasOdontoCapability(capabilities);
    const hasPodologia = hasPodologiaCapability(capabilities);

    const initialSnapshot = useMemo(
        () =>
            JSON.stringify({
                formData,
                anamneseBase,
                anamnesePodologia,
                dentalAnamnesisValues,
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [cliente?.id],
    );

    const quickModeRef = useRef(false);
    const formRef = useRef<HTMLFormElement | null>(null);
    const onQuickSubmit = () => {
        quickModeRef.current = true;
    };

    const initialRef = useRef(initialSnapshot);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        const next = JSON.stringify({
            formData,
            anamneseBase,
            anamnesePodologia,
            dentalAnamnesisValues,
        });
        setDirty(next !== initialRef.current);
    }, [formData, anamneseBase, anamnesePodologia, dentalAnamnesisValues]);

    useUnsavedChangesGuard(dirty, 'Há alterações não salvas. Deseja sair?');

    useEffect(() => {
        const nextClient = buildDefaultClientData(cliente);
        const nextBase = buildDefaultAnamneseBase(cliente);
        const nextPodologia = buildDefaultPodologia(cliente);
        setFormData(nextClient);
        setAnamneseBase(nextBase);
        setAnamnesePodologia(nextPodologia);
        setDentalAnamnesisValues(buildDefaultDentalAnamnesis(cliente));

        const snapshot = JSON.stringify({
            formData: nextClient,
            anamneseBase: nextBase,
            anamnesePodologia: nextPodologia,
            dentalAnamnesisValues: buildDefaultDentalAnamnesis(cliente),
        });
        initialRef.current = snapshot;
        setDirty(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cliente?.id]);

    const [feedback, setFeedback] = useState<{
        type: 'error';
        message: string;
    } | null>(null);
    const [infoModal, setInfoModal] = useState<{
        title: string;
        message: string;
    } | null>(null);

    const { deleteModalOpen, handleDelete, confirmDelete, cancelDelete } =
        useClientDelete({ cliente, setFeedback });

    const [openSection, setOpenSection] = useState<string | null>(null);
    const toggleSection = (sectionId: string) => {
        setOpenSection(prev => (prev === sectionId ? null : sectionId));
    };
    const withPublicClientName = (baseTitle: string) => baseTitle;

    function handleChange(
        fieldOrEvent:
            | keyof ClientData
            | React.ChangeEvent<
                  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
              >,
        value?: ClientData[keyof ClientData],
    ) {
        if (typeof fieldOrEvent === 'string') {
            setFormData(prev => ({ ...prev, [fieldOrEvent]: value ?? '' }));
            return;
        }

        const { name, value: nextValue } = fieldOrEvent.target;
        setFormData(prev => ({ ...prev, [name]: nextValue ?? '' }));
    }

    function handleBaseChange<K extends keyof AnamneseBaseData>(
        key: K,
        value: AnamneseBaseData[K],
    ) {
        setAnamneseBase(prev => ({ ...prev, [key]: value }));
    }

    function handleDentalAnamnesisChange<K extends keyof DentalAnamnesisValues>(
        key: K,
        value: DentalAnamnesisValues[K],
    ) {
        setDentalAnamnesisValues(prev => ({ ...prev, [key]: value }));
    }

    function handlePodologiaChange<K extends keyof AnamnesePodologiaData>(
        key: K,
        value: AnamnesePodologiaData[K],
    ) {
        setAnamnesePodologia(prev => ({ ...prev, [key]: value }));
    }

    async function saveDentalAnamnesis(
        clientId: number,
        authToken: string,
    ): Promise<void> {
        const response = await fetch(
            `${API_BASE}/clinic/treatment/anamnesis/`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    client_id: clientId,
                    ...dentalAnamnesisValues,
                }),
            },
        );
        if (!response.ok) {
            let detail = 'Falha ao salvar anamnese odontológica.';
            try {
                const data = await response.json();
                if (typeof data?.detail === 'string') detail = data.detail;
            } catch {
                /* noop */
            }
            throw new Error(detail);
        }
    }

    function normalizeClinicalHistoryForSubmit(value: unknown): string {
        if (Array.isArray(value)) {
            return value.filter(Boolean).join(', ');
        }
        if (typeof value === 'string') {
            return value;
        }
        return '';
    }

    function buildNestedPayload() {
        const first = (formData.first_name || '').trim();
        const last = (formData.last_name || '').trim();
        const phoneDigits = (formData.phone || '').replace(/\D/g, '');
        const emailTrim = (formData.email || '').trim().toLowerCase();
        const professionTrim = (formData.profession || '').trim();
        const addressNumberDigits = (formData.address_number || '')
            .replace(/\D/g, '')
            .slice(0, 16);

        return {
            first_name: first,
            last_name: last,
            email: emailTrim || null,
            phone: phoneDigits,
            profession: professionTrim || null,
            document_type: formData.document_type || '',
            document_number: formData.document_number || '',
            sex: formData.sex || '',
            marital_status: formData.marital_status || '',
            address: (formData.address || '').trim(),
            neighborhood: (formData.neighborhood || '').trim(),
            city: (formData.city || '').trim(),
            state: (formData.state || '').trim(),
            postal_code: (formData.postal_code || '').trim(),
            address_number: addressNumberDigits || null,
            address_complement:
                (formData.address_complement || '').trim() || null,
            date_of_birth: normalizeDOBForApi(formData.date_of_birth || null),
            anamnese_base: {
                takes_medication: anamneseBase.takes_medication,
                had_surgery: anamneseBase.had_surgery,
                is_pregnant: anamneseBase.is_pregnant,
                pain_sensitivity: anamneseBase.pain_sensitivity,
                clinical_history:
                    normalizeClinicalHistoryForSubmit(
                        anamneseBase.clinical_history,
                    ) || 'Sem histórico relevante',
                sport_activity: anamneseBase.sport_activity,
            },
            ...(hasPodologia ? { anamnese_podologia: anamnesePodologia } : {}),
        };
    }

    function buildPublicPayload() {
        const nested = buildNestedPayload();
        const payload: Record<string, unknown> = {
            token: publicToken,
            anamnese_base: nested.anamnese_base,
        };

        const putIfMeaningful = (key: string, value: unknown) => {
            if (value === null || value === undefined) return;
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (!trimmed) return;
                payload[key] = trimmed;
                return;
            }
            payload[key] = value;
        };

        putIfMeaningful('first_name', nested.first_name);
        putIfMeaningful('last_name', nested.last_name);
        putIfMeaningful('email', nested.email);
        // In public mode, send phone only if user provided a non-empty value.
        // This avoids wiping an existing required phone in backend with an empty string.
        putIfMeaningful('phone', nested.phone);
        putIfMeaningful('profession', nested.profession);
        putIfMeaningful('document_type', nested.document_type);
        putIfMeaningful('document_number', nested.document_number);
        putIfMeaningful('sex', nested.sex);
        putIfMeaningful('marital_status', nested.marital_status);
        putIfMeaningful('address', nested.address);
        putIfMeaningful('neighborhood', nested.neighborhood);
        putIfMeaningful('city', nested.city);
        putIfMeaningful('state', nested.state);
        putIfMeaningful('postal_code', nested.postal_code);
        putIfMeaningful('address_number', nested.address_number);
        putIfMeaningful('address_complement', nested.address_complement);
        putIfMeaningful('date_of_birth', nested.date_of_birth);

        return payload;
    }

    const closeSuccessAndExit = () => {
        try {
            if (window.opener) {
                window.opener.dispatchEvent(new Event('updateClients'));
                window.opener.focus?.();
            } else {
                window.dispatchEvent(new Event('updateClients'));
            }
        } catch {
            /* noop */
        }

        if (window.opener) {
            try {
                window.close();
                return;
            } catch {
                /* noop */
            }
        }

        try {
            (document.activeElement as HTMLElement | null)?.blur?.();
            document.body.classList.remove('keyboardOpen');
        } catch {
            /* noop */
        }
        navigate('/');
    };

    function handleCancel() {
        closeSuccessAndExit();
    }

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                onQuickSubmit();
                formRef.current?.requestSubmit?.();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isPublicMode) {
            if (!publicToken) {
                setFeedback({
                    type: 'error',
                    message: 'Token público inválido. Solicite um novo link.',
                });
                return;
            }

            const payload = buildPublicPayload();
            if (!payload.first_name || !payload.last_name) {
                setFeedback({
                    type: 'error',
                    message: 'Nome e Sobrenome são obrigatórios.',
                });
                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE}/register/clients/submit-public-anamnesis/`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    },
                );

                if (!response.ok) {
                    let errorData: unknown = null;
                    try {
                        errorData = await response.json();
                    } catch {
                        try {
                            errorData = await response.text();
                        } catch {
                            errorData = null;
                        }
                    }
                    const errorMsg = parseApiError(errorData, response.status);
                    setFeedback({ type: 'error', message: errorMsg });
                    return;
                }

                initialRef.current = JSON.stringify({
                    formData,
                    anamneseBase,
                    anamnesePodologia,
                    dentalAnamnesisValues,
                });
                setDirty(false);
                if (onPublicSubmitSuccess) {
                    setFormData(buildDefaultClientData());
                    setAnamneseBase(buildDefaultAnamneseBase());
                    setAnamnesePodologia(buildDefaultPodologia());
                    setDentalAnamnesisValues(buildDefaultDentalAnamnesis());
                    onPublicSubmitSuccess();
                    return;
                }
                setInfoModal({
                    title: 'Obrigado!',
                    message:
                        'Sua ficha de saúde e endereço foram atualizados com sucesso.',
                });
            } catch (err) {
                setFeedback({
                    type: 'error',
                    message:
                        'Erro ao salvar: ' +
                        (err instanceof Error ? err.message : 'desconhecido'),
                });
            }
            return;
        }

        const token = getAccessToken();
        if (!token) {
            setFeedback({ type: 'error', message: 'Usuário não autenticado.' });
            return;
        }

        const payload = buildNestedPayload();

        if (!payload.first_name || !payload.last_name || !payload.phone) {
            setFeedback({
                type: 'error',
                message: 'Nome, Sobrenome e Telefone são obrigatórios.',
            });
            return;
        }

        const isEdit = !!cliente?.id;
        const endpoint = isEdit
            ? `${API_BASE}/register/clients/${cliente?.id}/`
            : `${API_BASE}/register/clients/`;

        try {
            const response = await fetch(endpoint, {
                method: isEdit ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let errorData: unknown = null;
                try {
                    errorData = await response.json();
                } catch {
                    try {
                        errorData = await response.text();
                    } catch {
                        errorData = null;
                    }
                }
                const errorMsg = parseApiError(errorData, response.status);
                if (
                    /telefone|phone/i.test(errorMsg) &&
                    /cadastr|existe|duplicad/i.test(errorMsg)
                ) {
                    setInfoModal({ title: 'Atenção', message: errorMsg });
                    const err = new Error(errorMsg) as HandledError;
                    err.handled = true;
                    throw err;
                }
                setFeedback({ type: 'error', message: errorMsg });
                const err = new Error(errorMsg) as HandledError;
                err.handled = true;
                throw err;
            }

            const result = await response.json();

            if (result?.id) {
                if (hasOdonto) {
                    try {
                        await saveDentalAnamnesis(Number(result.id), token);
                    } catch (anamnesisErr) {
                        setFeedback({
                            type: 'error',
                            message:
                                'Cliente salvo, mas houve um erro ao salvar a anamnese odontológica: ' +
                                (anamnesisErr instanceof Error
                                    ? anamnesisErr.message
                                    : 'erro desconhecido'),
                        });
                    }
                }
            }

            if (!isEdit && quickModeRef.current) {
                quickModeRef.current = false;

                const nextClient = buildDefaultClientData();
                const nextBase = buildDefaultAnamneseBase();
                const nextPodologia = buildDefaultPodologia();

                setFormData(nextClient);
                setAnamneseBase(nextBase);
                setAnamnesePodologia(nextPodologia);
                setDentalAnamnesisValues(buildDefaultDentalAnamnesis());
                const snapshot = JSON.stringify({
                    formData: nextClient,
                    anamneseBase: nextBase,
                    anamnesePodologia: nextPodologia,
                    dentalAnamnesisValues: buildDefaultDentalAnamnesis(),
                });
                initialRef.current = snapshot;
                setDirty(false);

                setTimeout(() => {
                    try {
                        const el = formRef.current?.querySelector(
                            'input[name="first_name"]',
                        ) as HTMLInputElement | null;
                        el?.focus();
                        el?.select?.();
                    } catch {
                        /* noop */
                    }
                }, 0);
                return;
            }

            if (!isEdit && result?.id) {
                localStorage.setItem('newClientId', String(result.id));
            }

            initialRef.current = JSON.stringify({
                formData,
                anamneseBase,
                anamnesePodologia,
                dentalAnamnesisValues,
            });
            setDirty(false);

            setInfoModal({
                title: 'Sucesso',
                message: isEdit
                    ? 'Cliente atualizado com sucesso!'
                    : 'Cliente cadastrado com sucesso!',
            });
        } catch (err) {
            if (isHandledError(err) && err.handled) return;
            setFeedback({
                type: 'error',
                message:
                    'Erro ao salvar: ' +
                    (err instanceof Error ? err.message : 'desconhecido'),
            });
        }
    };

    const isEdit = !!cliente?.id;
    const deleteModalTitle =
        [cliente?.first_name, cliente?.last_name]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Excluir cliente';

    return (
        <>
            <form
                ref={formRef}
                onSubmit={handleSubmit}
                data-theme={activeTheme}
            >
                <SmartSection
                    title={withPublicClientName('Dados pessoais')}
                    stickyWhenOpen
                    isOpen={openSection === 'personal'}
                    onToggle={() => toggleSection('personal')}
                >
                    <ClientPersonalDataForm
                        formData={formData}
                        handleChange={handleChange}
                        feedback={feedback}
                        isEdit={isEdit}
                        lockRequiredFields={isPublicMode}
                        themeOverride={themeOverride}
                    />
                </SmartSection>

                <SmartSection
                    title={withPublicClientName('Endereço')}
                    stickyWhenOpen
                    isOpen={openSection === 'address'}
                    onToggle={() => toggleSection('address')}
                >
                    <ClientAddressForm
                        formData={formData}
                        handleChange={handleChange}
                        isEdit={isEdit}
                        themeOverride={themeOverride}
                    />
                </SmartSection>

                <SmartSection
                    title={withPublicClientName('Anamnese geral')}
                    stickyWhenOpen
                    isOpen={openSection === 'anamnesis'}
                    onToggle={() => toggleSection('anamnesis')}
                >
                    <ClientAnamnesisForm
                        anamneseBase={anamneseBase}
                        onBaseChange={handleBaseChange}
                        isEdit={isEdit}
                        themeOverride={themeOverride}
                    />
                </SmartSection>

                {!isPublicMode && hasOdonto && (
                    <SmartSection
                        title='Anamnese Odontologia'
                        stickyWhenOpen
                        isOpen={openSection === 'odontologia'}
                        onToggle={() => toggleSection('odontologia')}
                    >
                        <DentalAnamnesisForm
                            values={dentalAnamnesisValues}
                            onChange={handleDentalAnamnesisChange}
                        />
                    </SmartSection>
                )}

                {!isPublicMode && hasPodologia && (
                    <SmartSection
                        title='Anamnese Podologia'
                        stickyWhenOpen
                        isOpen={openSection === 'podologia'}
                        onToggle={() => toggleSection('podologia')}
                    >
                        <ClientPodologiaSection
                            values={anamnesePodologia}
                            onChange={handlePodologiaChange}
                        />
                    </SmartSection>
                )}

                <div className={styles.footer}>
                    {!isEdit && !isPublicMode && (
                        <button
                            type='submit'
                            className={styles.btnSecondary}
                            onClick={() => onQuickSubmit()}
                        >
                            Salvar e novo
                        </button>
                    )}
                    {isEdit && !isPublicMode && (
                        <button
                            type='button'
                            className={styles.btnDanger}
                            onClick={handleDelete}
                        >
                            Apagar
                        </button>
                    )}
                    {!isPublicMode && (
                        <button
                            type='button'
                            className={styles.btnSecondary}
                            onClick={handleCancel}
                        >
                            Cancelar
                        </button>
                    )}
                    <button type='submit' className={styles.btnPrimary}>
                        {isPublicMode ? 'Enviar ficha' : 'Salvar'}
                    </button>
                </div>
            </form>
            {infoModal && (
                <InfoModal
                    title={infoModal.title}
                    message={infoModal.message}
                    onClose={() => {
                        setInfoModal(null);
                        closeSuccessAndExit();
                    }}
                />
            )}
            {!isPublicMode && deleteModalOpen && (
                <DeleteConfirmModal
                    title={deleteModalTitle}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </>
    );
}
