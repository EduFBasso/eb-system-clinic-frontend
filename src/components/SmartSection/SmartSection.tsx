import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './SmartSection.module.css';

interface SmartSectionProps {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
    stickyWhenOpen?: boolean;
    isOpen?: boolean;
    onToggle?: () => void;
}

export function SmartSection({
    title,
    children,
    defaultOpen = false,
    stickyWhenOpen = false,
    isOpen,
    onToggle,
}: SmartSectionProps) {
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const contentId = useId();
    const open = typeof isOpen === 'boolean' ? isOpen : internalOpen;

    const handleToggle = () => {
        if (onToggle) {
            onToggle();
            return;
        }
        setInternalOpen(prev => !prev);
    };

    return (
        <section
            className={`${styles.container} ${open ? styles.open : ''} ${
                stickyWhenOpen && open ? styles.stickyOpen : ''
            }`}
        >
            <div className={styles.header}>
                <h3>{title}</h3>
                <button
                    type='button'
                    className={styles.toggleButton}
                    onClick={handleToggle}
                    aria-expanded={open}
                    aria-controls={contentId}
                    aria-label={`${open ? 'Fechar' : 'Abrir'} seção ${title}`}
                >
                    <span className={styles.hamburger} aria-hidden='true'>
                        ☰
                    </span>
                </button>
            </div>

            <div
                className={`${styles.contentWrapper} ${open ? styles.contentWrapperOpen : ''}`}
                aria-hidden={!open}
            >
                <div id={contentId} className={styles.content}>
                    <div className={styles.contentInner}>{children}</div>
                </div>
            </div>
        </section>
    );
}
