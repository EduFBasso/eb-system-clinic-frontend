import React from 'react';

export type ClientCardStyleInput = {
    selected?: boolean;
    pressed: boolean;
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
}: ClientCardStyleInput): ClientCardStyle {
    // Paleta base (variáveis do CSS)
    const valueColor = 'var(--color-text)';
    const primaryColor = 'var(--color-primary)';
    const cardBg = 'var(--card-bg)';

    // Definição de cores de label/ícone por estado
    const labelColor = primaryColor;
    const iconColor = primaryColor;
    const borderWidth = selected ? 1 : 0;

    const containerStyle: React.CSSProperties = {
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        background: selected ? undefined : cardBg,
        border:
            borderWidth > 0
                ? `${borderWidth}px solid ${primaryColor}`
                : undefined,
        transform: pressed ? 'scale(0.995)' : 'scale(1)',
        transition:
            'background 0.3s ease, border 0.2s ease, box-shadow 0.35s ease, transform 0.07s ease, color 0.3s ease, fill 0.3s ease',
    };

    // Separador entre dados pessoais e agenda
    const separatorColor = labelColor;
    const separatorOpacity = 0.5;

    return {
        containerStyle,
        labelColor,
        iconColor,
        valueColor,
        separatorColor,
        separatorOpacity,
    };
}
