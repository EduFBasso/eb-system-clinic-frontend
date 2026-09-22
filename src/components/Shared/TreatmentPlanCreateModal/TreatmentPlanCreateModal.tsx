import React from 'react';
import { defaultPlanName } from '../../../utils/TreatmentHelpers';
import { apiFetch } from '../../../utils/apiFetch';
import { formatCep, formatCnpj } from '../../../utils/formatCpf';
import { formatPhone } from '../../../utils/formatPhone';
import { useViaCep } from '../../../hooks/useViaCep';
import styles from '../TreatmentWorkspacePage/TreatmentWorkspacePage.module.css';

type Props = {
    open: boolean;
    saving: boolean;
    onClose: () => void;
    onSave: (data: { name: string; notes: string; started_at: string }) => void;
    onProfileSaved: () => void;
    profileOnly?: boolean;
};

type ProfessionalProfile = Record<string, string | undefined>;

// Dados do profissional — PATCH em /register/professionals/me/.
const PERSONAL_FIELDS = new Set([
    'display_name',
    'specialty',
    'register_number',
    'phone',
    'cnpj',
    'address',
    'number',
    'neighborhood',
    'zip_code',
    'city',
    'state',
    'odonto_quote_validity_days',
]);

export default function TreatmentPlanCreateModal({
    open,
    saving,
    onClose,
    onSave,
    onProfileSaved,
    profileOnly = false,
}: Props) {
    const [name, setName] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [profile, setProfile] = React.useState<ProfessionalProfile>({});
    const [savingProfile, setSavingProfile] = React.useState(false);
    const [profileError, setProfileError] = React.useState('');
    const [profileSuccess, setProfileSuccess] = React.useState('');
    const onCepFound = React.useCallback(
        (data: {
            address: string;
            neighborhood: string;
            city: string;
            state: string;
        }) => {
            setProfile(current => ({
                ...current,
                address: data.address,
                neighborhood: data.neighborhood,
                city: data.city,
                state: data.state,
            }));
        },
        [],
    );
    const { status: cepStatus, lookup: lookupCep } = useViaCep(onCepFound);
    const today = React.useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    React.useEffect(() => {
        if (open) {
            setName(defaultPlanName());
            try {
                const stored = localStorage.getItem('loggedProfessional');
                const parsed = stored
                    ? (JSON.parse(stored) as ProfessionalProfile & {
                          tenant?: ProfessionalProfile;
                      })
                    : {};
                const { tenant, ...personal } = parsed;
                setProfile({
                    ...personal,
                    address: personal.address || tenant?.street,
                    number: personal.number || tenant?.number,
                    neighborhood: personal.neighborhood || tenant?.neighborhood,
                    zip_code: personal.zip_code || tenant?.zip_code,
                    city: personal.city || tenant?.city,
                    state: personal.state || tenant?.state,
                });
            } catch {
                setProfile({});
            }
        }
    }, [open]);

    async function saveProfile() {
        setSavingProfile(true);
        setProfileError('');
        setProfileSuccess('');
        try {
            const personalPayload: ProfessionalProfile = {};
            for (const [field, value] of Object.entries(profile)) {
                if (PERSONAL_FIELDS.has(field)) personalPayload[field] = value;
            }
            personalPayload.phone = (() => {
                const digits = profile.phone?.replace(/\D/g, '') ?? '';
                if (!digits) return '';
                return digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
            })();

            const updatedPersonal = (await apiFetch(
                '/register/professionals/me/',
                {
                    method: 'PATCH',
                    body: personalPayload,
                },
            )) as ProfessionalProfile;
            const mergedProfile = {
                ...profile,
                ...updatedPersonal,
            };
            const stored = localStorage.getItem('loggedProfessional');
            const previous = stored ? JSON.parse(stored) : {};
            localStorage.setItem(
                'loggedProfessional',
                JSON.stringify({
                    ...previous,
                    ...updatedPersonal,
                }),
            );
            setProfile(mergedProfile);
            setProfileSuccess('Dados profissionais salvos com sucesso.');
            onProfileSaved();
        } catch (error) {
            setProfileError(
                error instanceof Error
                    ? error.message
                    : 'Não foi possível salvar os dados.',
            );
        } finally {
            setSavingProfile(false);
        }
    }

    if (!open) return null;

    function handleSave() {
        onSave({
            name: name.trim() || defaultPlanName(),
            notes: notes.trim(),
            started_at: today,
        });
    }

    return (
        <div
            className={styles.modalOverlay}
            role='presentation'
            onClick={onClose}
        >
            <div
                className={styles.modalCard}
                style={{ maxWidth: 480 }}
                role='dialog'
                aria-modal='true'
                aria-label='Novo plano de tratamento'
                onClick={e => e.stopPropagation()}
            >
                <h3 className={styles.sectionTitle}>
                    {profileOnly
                        ? 'Dados profissionais'
                        : 'Novo plano de tratamento'}
                </h3>

                <div className={styles.formGrid}>
                    {!profileOnly && (
                        <label className={styles.labelWide}>
                            Nome do plano
                            <input
                                className={styles.input}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                disabled={saving}
                                autoFocus
                            />
                        </label>
                    )}

                    {!profileOnly && (
                        <label className={styles.labelWide}>
                            Anotações iniciais (opcional)
                            <textarea
                                className={styles.textarea}
                                rows={3}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                disabled={saving}
                                placeholder='Queixa principal, objetivos do tratamento…'
                            />
                        </label>
                    )}

                    <details className={styles.labelWide} open={profileOnly}>
                        <summary>
                            Dados profissionais exibidos no orçamento
                        </summary>
                        <div className={styles.formGrid}>
                            {[
                                [
                                    'display_name',
                                    'Nome da clínica/profissional',
                                ],
                                ['specialty', 'Especialidade'],
                                ['register_number', 'Registro profissional'],
                                ['cnpj', 'CNPJ'],
                                [
                                    'odonto_quote_validity_days',
                                    'Validade do orçamento (dias)',
                                ],
                                ['phone', 'Telefone'],
                                ['zip_code', 'CEP'],
                                ['address', 'Endereço'],
                                ['number', 'Número'],
                                ['neighborhood', 'Bairro'],
                                ['city', 'Cidade'],
                                ['state', 'UF'],
                            ].map(([field, label]) => (
                                <label key={field} className={styles.label}>
                                    {label}
                                    <input
                                        className={styles.input}
                                        value={
                                            field === 'phone'
                                                ? formatPhone(profile[field])
                                                : field === 'cnpj'
                                                  ? formatCnpj(
                                                        profile[field] || '',
                                                    )
                                                  : field === 'zip_code'
                                                    ? formatCep(
                                                          profile[field] || '',
                                                      )
                                                    : profile[field] || ''
                                        }
                                        type={
                                            field ===
                                            'odonto_quote_validity_days'
                                                ? 'number'
                                                : 'text'
                                        }
                                        min={
                                            field ===
                                            'odonto_quote_validity_days'
                                                ? 1
                                                : undefined
                                        }
                                        max={
                                            field ===
                                            'odonto_quote_validity_days'
                                                ? 365
                                                : undefined
                                        }
                                        placeholder={
                                            field === 'phone'
                                                ? '+5511999990000'
                                                : undefined
                                        }
                                        onChange={event => {
                                            setProfile(current => ({
                                                ...current,
                                                [field]:
                                                    field === 'phone'
                                                        ? formatPhone(
                                                              event.target
                                                                  .value,
                                                          )
                                                        : field === 'cnpj'
                                                          ? formatCnpj(
                                                                event.target
                                                                    .value,
                                                            )
                                                          : field === 'zip_code'
                                                            ? formatCep(
                                                                  event.target
                                                                      .value,
                                                              )
                                                            : event.target
                                                                  .value,
                                            }));
                                            if (field === 'zip_code') {
                                                lookupCep(event.target.value);
                                            }
                                        }}
                                        disabled={saving || savingProfile}
                                        autoComplete={
                                            field === 'zip_code'
                                                ? 'postal-code'
                                                : field === 'phone'
                                                  ? 'tel'
                                                  : undefined
                                        }
                                        inputMode={
                                            field === 'zip_code' ||
                                            field === 'phone'
                                                ? 'tel'
                                                : undefined
                                        }
                                    />
                                    {field === 'zip_code' &&
                                        cepStatus === 'loading' && (
                                            <span className={styles.cepStatus}>
                                                Buscando CEP...
                                            </span>
                                        )}
                                    {field === 'zip_code' &&
                                        cepStatus === 'not_found' && (
                                            <span
                                                className={
                                                    styles.cepStatusError
                                                }
                                            >
                                                CEP não encontrado
                                            </span>
                                        )}
                                    {field === 'zip_code' &&
                                        cepStatus === 'error' && (
                                            <span
                                                className={
                                                    styles.cepStatusError
                                                }
                                            >
                                                Sem conexão — preencha
                                                manualmente
                                            </span>
                                        )}
                                </label>
                            ))}
                        </div>
                        {profileError && (
                            <p className={styles.errorCard}>{profileError}</p>
                        )}
                        {profileSuccess && (
                            <p className={styles.profileSuccess} role='status'>
                                {profileSuccess}
                            </p>
                        )}
                        <button
                            type='button'
                            className={`${styles.btn} ${styles.profileSaveButton}`}
                            onClick={() => void saveProfile()}
                            disabled={saving || savingProfile}
                        >
                            {savingProfile
                                ? 'Salvando dados…'
                                : 'Salvar dados profissionais'}
                        </button>
                    </details>
                </div>

                {!profileOnly && (
                    <div className={styles.modalActions}>
                        <button
                            type='button'
                            className={styles.btn}
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button
                            type='button'
                            className={styles.btnPrimary}
                            onClick={handleSave}
                            disabled={saving}
                            aria-busy={saving}
                        >
                            {saving ? 'Criando…' : 'Criar plano'}
                        </button>
                    </div>
                )}
                {profileOnly && (
                    <div className={styles.modalActions}>
                        <button
                            type='button'
                            className={styles.btn}
                            onClick={onClose}
                        >
                            Fechar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
