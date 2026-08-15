import React from 'react';

export type ClientCardStyleInput = {
    selected?: boolean;
    pressed: boolean;
    isScheduled: boolean;
    isPending?: boolean; // novo: aplicar tema cinza discreto quando pendente
};

export type ClientCardStyle = {
    containerStyle: React.CSSProperties;
    labelColor: string;
    iconColor: string;
    valueColor: string;
    separatorColor: string;
    separatorOpacity: number;
};

export function useClientCardStyle({
    selected,
    pressed,
    isPending,
}: ClientCardStyleInput): ClientCardStyle {
    // Paleta base (variáveis do CSS)
    const valueColor = 'var(--color-text)';
    const primaryColor = 'var(--color-primary)';
    const cardBg = 'var(--card-bg)';

    // Definição de cores de label/ícone por estado
    const pendingColor = 'var(--color-pending)';
    const pendingBg = 'var(--color-pending-bg)';
    const labelColor = isPending ? pendingColor : primaryColor;
    const iconColor = isPending ? pendingColor : primaryColor;

    const baseStateColor = isPending ? pendingColor : primaryColor;
    const showStateBorder = isPending;
    const borderWidth = showStateBorder ? (selected ? 2 : 1) : selected ? 1 : 0;
    const borderColor = showStateBorder ? baseStateColor : primaryColor;

    const containerStyle: React.CSSProperties = {
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        background: isPending ? pendingBg : selected ? undefined : cardBg,
        border:
            borderWidth > 0
                ? `${borderWidth}px solid ${borderColor}`
                : undefined,
        boxShadow: selected && showStateBorder ? 'none' : undefined,
        transform: pressed ? 'scale(0.995)' : 'scale(1)',
        transition:
            'background 0.3s ease, border 0.2s ease, box-shadow 0.35s ease, transform 0.07s ease, color 0.3s ease, fill 0.3s ease',
    };

    // Separador entre dados pessoais e agenda
    const separatorColor = labelColor;
    const separatorOpacity = isPending ? 0.55 : 0.5;

    return {
        containerStyle,
        labelColor,
        iconColor,
        valueColor,
        separatorColor,
        separatorOpacity,
    };
}
