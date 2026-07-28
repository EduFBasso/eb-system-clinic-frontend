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
import styles from './ClientForm.module.css';
import useUnsavedChangesGuard from '../../hooks/useUnsavedChangesGuard';
import { useClientDelete } from '../../hooks/useClientDelete';
import { parseApiError } from '../../utils/parseApiError';
import InfoModal from '../shared/InfoModal';
import DeleteConfirmModal from '../shared/DeleteConfirmModal';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { getAccessToken } from '../../utils/auth/session';
import { SmartSection } from '../SmartSection/SmartSection';

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
          ? clinicalHistoryRaw.trim()
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

function buildDefaultAnamnesePodologia(
    cliente?: Partial<ClientData>,
): AnamnesePodologiaData {
    const legacy = (cliente ?? {}) as Partial<ClientData> &
        Partial<AnamnesePodologiaData>;
    const nested = cliente?.anamnese_podologia ?? {};

    return {
        footwear_used: nested.footwear_used ?? legacy.footwear_used ?? '',
        sock_used: nested.sock_used ?? legacy.sock_used ?? '',
        plantar_view_left:
            nested.plantar_view_left ?? legacy.plantar_view_left ?? '',
        plantar_view_right:
            nested.plantar_view_right ?? legacy.plantar_view_right ?? '',
        dermatological_pathologies_left:
            nested.dermatological_pathologies_left ??
            legacy.dermatological_pathologies_left ??
            '',
        dermatological_pathologies_right:
            nested.dermatological_pathologies_right ??
            legacy.dermatological_pathologies_right ??
            '',
        nail_changes_left:
            nested.nail_changes_left ?? legacy.nail_changes_left ?? '',
        nail_changes_right:
            nested.nail_changes_right ?? legacy.nail_changes_right ?? '',
        deformities_left:
            nested.deformities_left ?? legacy.deformities_left ?? '',
        deformities_right:
            nested.deformities_right ?? legacy.deformities_right ?? '',
        sensitivity_test:
            nested.sensitivity_test ??
            legacy.sensitivity_test ??
            'Não avaliado',
        other_procedures:
            nested.other_procedures ?? legacy.other_procedures ?? '',
    };
}

export function ClientForm({ cliente }: { cliente?: Partial<ClientData> }) {
    const { theme } = useTheme();
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
        useState<AnamnesePodologiaData>(() =>
            buildDefaultAnamnesePodologia(cliente),
        );

    const initialSnapshot = useMemo(
        () =>
            JSON.stringify({
                formData,
                anamneseBase,
                anamnesePodologia,
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
        });
        setDirty(next !== initialRef.current);
    }, [formData, anamneseBase, anamnesePodologia]);

    useUnsavedChangesGuard(dirty, 'Há alterações não salvas. Deseja sair?');

    useEffect(() => {
        const nextClient = buildDefaultClientData(cliente);
        const nextBase = buildDefaultAnamneseBase(cliente);
        const nextPodo = buildDefaultAnamnesePodologia(cliente);

        setFormData(nextClient);
        setAnamneseBase(nextBase);
        setAnamnesePodologia(nextPodo);

        const snapshot = JSON.stringify({
            formData: nextClient,
            anamneseBase: nextBase,
            anamnesePodologia: nextPodo,
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

    const [openSection, setOpenSection] = useState<string | null>('personal');
    const toggleSection = (sectionId: string) => {
        setOpenSection(prev => (prev === sectionId ? null : sectionId));
    };

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

    function handlePodologiaChange<K extends keyof AnamnesePodologiaData>(
        key: K,
        value: AnamnesePodologiaData[K],
    ) {
        setAnamnesePodologia(prev => ({ ...prev, [key]: value }));
    }

    function normalizeClinicalHistoryForSubmit(value: unknown): string {
        if (Array.isArray(value)) {
            return value.filter(Boolean).join(', ');
        }
        if (typeof value === 'string') {
            return value.trim();
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
            anamnese_podologia: {
                ...anamnesePodologia,
            },
        };
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

            if (!isEdit && quickModeRef.current) {
                quickModeRef.current = false;

                const nextClient = buildDefaultClientData();
                const nextBase = buildDefaultAnamneseBase();
                const nextPodo = buildDefaultAnamnesePodologia();

                setFormData(nextClient);
                setAnamneseBase(nextBase);
                setAnamnesePodologia(nextPodo);
                const snapshot = JSON.stringify({
                    formData: nextClient,
                    anamneseBase: nextBase,
                    anamnesePodologia: nextPodo,
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
            <form ref={formRef} onSubmit={handleSubmit} data-theme={theme}>
                <SmartSection
                    title='Dados pessoais'
                    stickyWhenOpen
                    isOpen={openSection === 'personal'}
                    onToggle={() => toggleSection('personal')}
                >
                    <ClientPersonalDataForm
                        formData={formData}
                        handleChange={handleChange}
                        feedback={feedback}
                        isEdit={isEdit}
                    />
                </SmartSection>

                <SmartSection
                    title='Endereço'
                    stickyWhenOpen
                    isOpen={openSection === 'address'}
                    onToggle={() => toggleSection('address')}
                >
                    <ClientAddressForm
                        formData={formData}
                        handleChange={handleChange}
                        isEdit={isEdit}
                    />
                </SmartSection>

                <SmartSection
                    title='Anamnese geral'
                    stickyWhenOpen
                    isOpen={openSection === 'anamnesis'}
                    onToggle={() => toggleSection('anamnesis')}
                >
                    <ClientAnamnesisForm
                        anamneseBase={anamneseBase}
                        onBaseChange={handleBaseChange}
                        isEdit={isEdit}
                    />
                </SmartSection>

                <SmartSection
                    title='Anamnese Podologia'
                    stickyWhenOpen
                    isOpen={openSection === 'podologia'}
                    onToggle={() => toggleSection('podologia')}
                >
                    <ClientPodologiaSection
                        anamnesePodologia={anamnesePodologia}
                        onPodologiaChange={handlePodologiaChange}
                    />
                </SmartSection>

                <div className={styles.footer}>
                    {!isEdit && (
                        <button
                            type='submit'
                            className={styles.btnSecondary}
                            onClick={() => onQuickSubmit()}
                        >
                            Salvar e novo
                        </button>
                    )}
                    {isEdit && (
                        <button
                            type='button'
                            className={styles.btnDanger}
                            onClick={handleDelete}
                        >
                            Apagar
                        </button>
                    )}
                    <button
                        type='button'
                        className={styles.btnSecondary}
                        onClick={handleCancel}
                    >
                        Cancelar
                    </button>
                    <button type='submit' className={styles.btnPrimary}>
                        Salvar
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
            {deleteModalOpen && (
                <DeleteConfirmModal
                    title={deleteModalTitle}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </>
    );
}
