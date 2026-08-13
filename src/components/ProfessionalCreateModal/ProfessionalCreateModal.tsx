import React, { useState, useEffect } from 'react';
import { AppModal } from '../Modal/Modal';
import { API_BASE } from '../../config/api';
import '../../styles/modal-message.css';
import { getAccessToken } from '../../utils/auth/session';

interface Props {
    open: boolean;
    onClose: () => void;
}

type Step = 'form' | 'qr';

interface FormData {
    email: string;
    first_name: string;
    last_name: string;
    display_name: string;
    password: string;
    specialty: string;
    register_number: string;
    phone: string;
    city: string;
    state: string;
}

const SPECIALTY_OPTIONS = [
    { value: '', label: 'Sem especialidade' },
    { value: 'Odontologia', label: 'Odontologia' },
    { value: 'Podologia', label: 'Podologia' },
    { value: 'Outro', label: 'Outro' },
];

const EMPTY_FORM: FormData = {
    email: '',
    first_name: '',
    last_name: '',
    display_name: '',
    password: '',
    specialty: '',
    register_number: '',
    phone: '',
    city: '',
    state: '',
};

export const ProfessionalCreateModal: React.FC<Props> = ({ open, onClose }) => {
    const [step, setStep] = useState<Step>('form');
    const [form, setForm] = useState<FormData>(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createdName, setCreatedName] = useState('');

    // Reset when modal opens
    useEffect(() => {
        if (open) {
            setStep('form');
            setForm(EMPTY_FORM);
            setError('');
        }
    }, [open]);

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (
            !form.email ||
            !form.first_name ||
            !form.last_name ||
            !form.password
        ) {
            setError('E-mail, nome, sobrenome e senha são obrigatórios.');
            return;
        }
        setLoading(true);
        try {
            const token = getAccessToken();
            const res = await fetch(
                `${API_BASE}/register/auth/professional-create/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(form),
                },
            );
            const data = await res.json();
            if (!res.ok) {
                setError(data.message || 'Erro ao criar profissional.');
                return;
            }
            setCreatedName(
                `${data.professional.first_name} ${data.professional.last_name}`,
            );
            setStep('qr');
        } catch {
            setError('Erro de conexão. Verifique o servidor.');
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        onClose();
    }

    return (
        <AppModal open={open} onClose={handleClose} unmountOnClose>
            <div
                className='modal-message'
                style={{ minWidth: 300, maxWidth: 400 }}
            >
                {step === 'form' ? (
                    <>
                        <h3>Novo Profissional</h3>
                        {error && (
                            <p
                                style={{
                                    color: 'crimson',
                                    marginBottom: 8,
                                    fontSize: 13,
                                }}
                            >
                                {error}
                            </p>
                        )}
                        <form
                            onSubmit={handleSubmit}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                            }}
                        >
                            <input
                                name='first_name'
                                placeholder='Nome *'
                                value={form.first_name}
                                onChange={handleChange}
                                autoComplete='off'
                                required
                            />
                            <input
                                name='last_name'
                                placeholder='Sobrenome *'
                                value={form.last_name}
                                onChange={handleChange}
                                autoComplete='off'
                                required
                            />
                            <input
                                name='email'
                                type='email'
                                placeholder='E-mail *'
                                value={form.email}
                                onChange={handleChange}
                                autoComplete='off'
                                required
                            />
                            <input
                                name='password'
                                type='password'
                                placeholder='Senha temporária *'
                                value={form.password}
                                onChange={handleChange}
                                autoComplete='new-password'
                                required
                            />
                            <input
                                name='display_name'
                                placeholder='Nome de exibição para clientes (ex: Podóloga Regiane)'
                                value={form.display_name}
                                onChange={handleChange}
                                autoComplete='off'
                            />
                            <select
                                name='specialty'
                                value={form.specialty}
                                onChange={handleChange}
                            >
                                {SPECIALTY_OPTIONS.map(option => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                name='register_number'
                                placeholder='Registro profissional'
                                value={form.register_number}
                                onChange={handleChange}
                                autoComplete='off'
                            />
                            <input
                                name='phone'
                                placeholder='Telefone'
                                value={form.phone}
                                onChange={handleChange}
                                autoComplete='off'
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    name='city'
                                    placeholder='Cidade'
                                    value={form.city}
                                    onChange={handleChange}
                                    autoComplete='off'
                                    style={{ flex: 1 }}
                                />
                                <input
                                    name='state'
                                    placeholder='UF'
                                    value={form.state}
                                    onChange={handleChange}
                                    autoComplete='off'
                                    maxLength={2}
                                    style={{ width: 56 }}
                                />
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    marginTop: 4,
                                }}
                            >
                                <button
                                    type='button'
                                    onClick={handleClose}
                                    style={{ flex: 1 }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type='submit'
                                    disabled={loading}
                                    style={{ flex: 1 }}
                                >
                                    {loading ? 'Criando...' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <h3>Profissional criado!</h3>
                        <p style={{ marginBottom: 12 }}>
                            <strong>{createdName}</strong> foi cadastrado com
                            sucesso.
                        </p>
                        <button onClick={handleClose} style={{ width: '100%' }}>
                            Concluir
                        </button>
                    </>
                )}
            </div>
        </AppModal>
    );
};
