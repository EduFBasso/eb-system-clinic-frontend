import React from 'react';
import { defaultPlanName } from '../../../utils/TreatmentHelpers';
import { apiFetch } from '../../../utils/apiFetch';
import { formatCnpj } from '../../../utils/formatCpf';
import { formatPhone } from '../../../utils/formatPhone';
import styles from '../../../pages/TreatmentWorkspacePage.module.css';

type Props = {
    open: boolean;
    saving: boolean;
    onClose: () => void;
    onSave: (data: { name: string; notes: string; started_at: string }) => void;
    onProfileSaved: () => void;
    profileOnly?: boolean;
};

type ProfessionalProfile = Record<string, string | undefined>;

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
    const today = React.useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    React.useEffect(() => {
        if (open) {
            setName(defaultPlanName());
            try {
                const stored = localStorage.getItem('loggedProfessional');
                setProfile(
                    stored ? (JSON.parse(stored) as ProfessionalProfile) : {},
                );
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
            const profilePayload = {
                ...profile,
                phone: (() => {
                    const digits = profile.phone?.replace(/\D/g, '') ?? '';
                    if (!digits) return '';
                    return digits.startsWith('55')
                        ? `+${digits}`
                        : `+55${digits}`;
                })(),
            };
            const updated = (await apiFetch('/register/professionals/me/', {
                method: 'PATCH',
                body: profilePayload,
            })) as ProfessionalProfile;
            localStorage.setItem('loggedProfessional', JSON.stringify(updated));
            setProfile(updated);
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
                        ? 'Dados da clínica e da profissional'
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
                                ['address', 'Endereço'],
                                ['number', 'Número'],
                                ['neighborhood', 'Bairro'],
                                ['zip_code', 'CEP'],
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
                                        onChange={event =>
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
                                                          : event.target.value,
                                            }))
                                        }
                                        disabled={saving || savingProfile}
                                    />
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
