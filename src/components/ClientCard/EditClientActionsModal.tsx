import React from 'react';
import { AppModal } from '../Modal/Modal';
import styles from './ClientCard.module.css';

interface EditClientActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientName: string;
    onEditRecord: () => void;
    onRequestAnamnesis: () => void;
    loading: boolean;
}

export default function EditClientActionsModal({
    isOpen,
    onClose,
    clientName,
    onEditRecord,
    onRequestAnamnesis,
    loading,
}: EditClientActionsModalProps) {
    const safeName = clientName.trim();

    return (
        <AppModal
            open={isOpen}
            onClose={() => {
                if (loading) return;
                onClose();
            }}
            closeOnEnter={false}
            disableEscapeKeyDown={loading}
            disableBackdropClose={loading}
            unmountOnClose
        >
            <div className={styles.quickActionsModal}>
                <h3 className={styles.quickActionsTitle}>Editar cliente</h3>
                <p className={styles.quickActionsText}>
                    {safeName
                        ? `Escolha como deseja continuar o atendimento de ${safeName}.`
                        : 'Escolha como deseja continuar o atendimento.'}
                </p>
                <button
                    type='button'
                    className={`${styles.quickActionButton} ${styles.quickActionPrimary}`}
                    onClick={onEditRecord}
                >
                    Editar Prontuário do Cliente
                </button>
                <button
                    type='button'
                    className={`${styles.quickActionButton} ${styles.quickActionWhatsApp}`}
                    onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        onClose();
                        onRequestAnamnesis();
                    }}
                    disabled={loading}
                >
                    {loading
                        ? 'Gerando link...'
                        : 'Solicitar Preenchimento via WhatsApp'}
                </button>
                <button
                    type='button'
                    className={styles.quickActionCancel}
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancelar
                </button>
            </div>
        </AppModal>
    );
}
