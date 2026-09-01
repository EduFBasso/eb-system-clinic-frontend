import React, { useState } from 'react';
import styles from './PodologyMemberGrid.module.css';

interface PodologyMemberGridProps {
    planId?: number;
    onRegionToggle?: (
        scope: string,
        locationNumber: number,
        isSelected: boolean,
    ) => void;
}

export function PodologyMemberGrid({
    planId,
    onRegionToggle,
}: PodologyMemberGridProps) {
    // Estado mockado para teste visual ao toque
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const handleToggle = (
        id: number,
        scope: string,
        locationNumber: number,
    ) => {
        const isSelected = selectedIds.includes(id);
        if (isSelected) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }

        // Dispara o gatilho para o componente pai salvar no backend futuramente
        if (onRegionToggle) {
            onRegionToggle(scope, locationNumber, !isSelected);
        }
    };

    const getStyle = (id: number) => {
        const isActive = selectedIds.includes(id);
        return {
            fill: isActive ? 'var(--color-primary)' : 'none',
            stroke: isActive ? 'var(--color-primary)' : 'var(--color-border)',
            strokeWidth: '2',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        };
    };

    return (
        <div className={styles.container}>
            <svg viewBox='0 0 600 650' className={styles.svg}>
                {/* ================================================================= */}
                {/* SEÇÃO SUPERIOR: MEMBROS INFERIORES (PÉS)                          */}
                {/* ================================================================= */}
                <text
                    x='300'
                    y='30'
                    textAnchor='middle'
                    className={styles.sectionTitle}
                >
                    MEMBROS INFERIORES (PÉS)
                </text>

                {/* 🦶 PÉ ESQUERDO */}
                <g id='left-foot'>
                    <text
                        x='150'
                        y='60'
                        textAnchor='middle'
                        className={styles.subTitle}
                    >
                        Pé Esquerdo
                    </text>
                    {/* Silhueta Guia do Pé Esquerdo (Linha Pontilhada) */}
                    <path
                        d='M 110,260 C 100,200 110,140 120,110 C 130,105 170,105 180,110 C 190,140 200,200 190,260 C 185,290 175,310 150,310 C 125,310 115,290 110,260 Z'
                        fill='none'
                        stroke='var(--color-border)'
                        strokeDasharray='4,4'
                        strokeWidth='1'
                    />
                    {/* Dedos do Pé Esquerdo (Curva Natural Decrescente do Dedão ao Dedinho) */}
                    <circle
                        cx='125'
                        cy='95'
                        r='9'
                        style={getStyle(13)}
                        onClick={() => handleToggle(13, 'pe_esquerdo', 13)}
                    />{' '}
                    {/* Dedão */}
                    <circle
                        cx='142'
                        cy='90'
                        r='7.5'
                        style={getStyle(12)}
                        onClick={() => handleToggle(12, 'pe_esquerdo', 12)}
                    />
                    <circle
                        cx='158'
                        cy='91'
                        r='7'
                        style={getStyle(11)}
                        onClick={() => handleToggle(11, 'pe_esquerdo', 11)}
                    />
                    <circle
                        cx='173'
                        cy='95'
                        r='6.5'
                        style={getStyle(10)}
                        onClick={() => handleToggle(10, 'pe_esquerdo', 10)}
                    />
                    <circle
                        cx='186'
                        cy='102'
                        r='6'
                        style={getStyle(9)}
                        onClick={() => handleToggle(9, 'pe_esquerdo', 9)}
                    />{' '}
                    {/* Dedinho */}
                    {/* Vista Plantar (Blocos Anatômicos) */}
                    <path
                        d='M 122,120 Q 150,115 178,120 L 183,165 Q 150,170 117,165 Z'
                        style={getStyle(14)}
                        onClick={() => handleToggle(14, 'pe_esquerdo', 14)}
                    />{' '}
                    {/* Antepé */}
                    <text
                        x='150'
                        y='148'
                        textAnchor='middle'
                        className={styles.labelInside}
                    >
                        Antepé
                    </text>
                    <path
                        d='M 119,175 Q 150,180 181,175 L 175,235 Q 145,230 125,235 Z'
                        style={getStyle(15)}
                        onClick={() => handleToggle(15, 'pe_esquerdo', 15)}
                    />{' '}
                    {/* Planta Média */}
                    <text
                        x='150'
                        y='210'
                        textAnchor='middle'
                        className={styles.labelInside}
                    >
                        Planta Média
                    </text>
                    <path
                        d='M 127,245 Q 145,242 173,245 L 168,295 Q 150,302 132,295 Z'
                        style={getStyle(16)}
                        onClick={() => handleToggle(16, 'pe_esquerdo', 16)}
                    />{' '}
                    {/* Calcanhar */}
                    <text
                        x='150'
                        y='275'
                        textAnchor='middle'
                        className={styles.labelInside}
                    >
                        Calcanhar
                    </text>
                </g>

                {/* 🦶 PÉ DIREITO */}
                <g id='right-foot'>
                    <text
                        x='450'
                        y='60'
                        textAnchor='middle'
                        className={styles.subTitle}
                    >
                        Pé Direito
                    </text>
                    {/* Silhueta Guia do Pé Direito (Linha Pontilhada) */}
                    <path
                        d='M 490,260 C 500,200 490,140 480,110 C 470,105 430,105 420,110 C 410,140 400,200 410,260 C 415,290 425,310 450,310 C 475,310 485,290 490,260 Z'
                        fill='none'
                        stroke='var(--color-border)'
                        strokeDasharray='4,4'
                        strokeWidth='1'
                    />
                    {/* Dedos do Pé Direito (Espelhados) */}
                    <circle
                        cx='414'
                        cy='102'
                        r='6'
                        style={getStyle(1)}
                        onClick={() => handleToggle(1, 'pe_direito', 1)}
                    />{' '}
                    {/* Dedinho */}
                    <circle
                        cx='427'
                        cy='95'
                        r='6.5'
                        style={getStyle(2)}
                        onClick={() => handleToggle(2, 'pe_direito', 2)}
                    />
                    <circle
                        cx='442'
                        cy='91'
                        r='7'
                        style={getStyle(3)}
                        onClick={() => handleToggle(3, 'pe_direito', 3)}
                    />
                    <circle
                        cx='458'
                        cy='90'
                        r='7.5'
                        style={getStyle(4)}
                        onClick={() => handleToggle(4, 'pe_direito', 4)}
                    />
                    <circle
                        cx='475'
                        cy='95'
                        r='9'
                        style={getStyle(5)}
                        onClick={() => handleToggle(5, 'pe_direito', 5)}
                    />{' '}
                    {/* Dedão */}
                    {/* Vista Plantar (Blocos Anatômicos) */}
                    <path
                        d='M 422,120 Q 450,115 478,120 L 483,165 Q 450,170 417,165 Z'
                        style={getStyle(6)}
                        onClick={() => handleToggle(6, 'pe_direito', 6)}
                    />{' '}
                    {/* Antepé */}
                    <text
                        x='450'
                        y='148'
                        textAnchor='middle'
                        className={styles.labelInside}
                    >
                        Antepé
                    </text>
                    <path
                        d='M 419,175 Q 450,180 481,175 L 475,235 Q 445,230 425,235 Z'
                        style={getStyle(7)}
                        onClick={() => handleToggle(7, 'pe_direito', 7)}
                    />{' '}
                    {/* Planta Média */}
                    <text
                        x='450'
                        y='210'
                        textAnchor='middle'
                        className={styles.labelInside}
                    >
                        Planta Média
                    </text>
                    <path
                        d='M 427,245 Q 445,242 473,245 L 468,295 Q 450,302 432,295 Z'
                        style={getStyle(8)}
                        onClick={() => handleToggle(8, 'pe_direito', 8)}
                    />{' '}
                    {/* Calcanhar */}
                    <text
                        x='450'
                        y='275'
                        textAnchor='middle'
                        className={styles.labelInside}
                    >
                        Calcanhar
                    </text>
                </g>

                {/* ================================================================= */}
                {/* SEÇÃO INFERIOR: MEMBROS SUPERIORES (MÃOS / UNHAS)                 */}
                {/* ================================================================= */}
                <line
                    x1='50'
                    y1='340'
                    x2='550'
                    y2='340'
                    stroke='var(--color-border)'
                    strokeWidth='1'
                    strokeDasharray='2,2'
                />
                <text
                    x='300'
                    y='375'
                    textAnchor='middle'
                    className={styles.sectionTitle}
                >
                    MEMBROS SUPERIORES (FOCO UNGUEAL)
                </text>

                {/* ✋ MÃO ESQUERDA */}
                <g id='left-hand'>
                    <text
                        x='150'
                        y='405'
                        textAnchor='middle'
                        className={styles.subTitle}
                    >
                        Mão Esquerda
                    </text>
                    {/* Contorno Anatômico da Mão Esquerda */}
                    <path
                        d='M 60,560 C 60,490 75,440 100,430 C 105,400 115,400 120,435 C 130,390 142,390 148,435 C 158,395 168,395 172,440 C 182,410 192,415 194,460 C 205,480 200,520 185,560'
                        fill='none'
                        stroke='var(--color-border)'
                        strokeDasharray='4,4'
                        strokeWidth='1'
                    />
                    {/* Unhas / Falanges da Mão Esquerda (Ovais Anatômicas nas pontas) */}
                    <ellipse
                        cx='190'
                        cy='455'
                        rx='5'
                        ry='7'
                        transform='rotate(15 190 455)'
                        style={getStyle(26)}
                        onClick={() => handleToggle(26, 'mao_esquerda', 26)}
                    />{' '}
                    {/* Mínimo */}
                    <ellipse
                        cx='170'
                        cy='435'
                        rx='5.5'
                        ry='8'
                        style={getStyle(25)}
                        onClick={() => handleToggle(25, 'mao_esquerda', 25)}
                    />
                    <ellipse
                        cx='145'
                        cy='428'
                        rx='6'
                        ry='8.5'
                        style={getStyle(24)}
                        onClick={() => handleToggle(24, 'mao_esquerda', 24)}
                    />
                    <ellipse
                        cx='116'
                        cy='433'
                        rx='5.5'
                        ry='8'
                        style={getStyle(23)}
                        onClick={() => handleToggle(23, 'mao_esquerda', 23)}
                    />
                    <ellipse
                        cx='80'
                        cy='455'
                        rx='7'
                        ry='5.5'
                        transform='rotate(-25 80 455)'
                        style={getStyle(22)}
                        onClick={() => handleToggle(22, 'mao_esquerda', 22)}
                    />{' '}
                    {/* Polegar */}
                </g>

                {/* ✋ MÃO DIREITA */}
                <g id='right-hand'>
                    <text
                        x='450'
                        y='405'
                        textAnchor='middle'
                        className={styles.subTitle}
                    >
                        Mão Direita
                    </text>
                    {/* Contorno Anatômico da Mão Direita (Espelhada) */}
                    <path
                        d='M 540,560 C 540,490 525,440 500,430 C 495,400 485,400 480,435 C 470,390 458,390 452,435 C 442,395 432,395 428,440 C 418,410 408,415 406,460 C 395,480 400,520 415,560'
                        fill='none'
                        stroke='var(--color-border)'
                        strokeDasharray='4,4'
                        strokeWidth='1'
                    />
                    {/* Unhas / Falanges da Mão Direita */}
                    <ellipse
                        cx='520'
                        cy='455'
                        rx='7'
                        ry='5.5'
                        transform='rotate(25 520 455)'
                        style={getStyle(17)}
                        onClick={() => handleToggle(17, 'mao_direita', 17)}
                    />{' '}
                    {/* Polegar */}
                    <ellipse
                        cx='484'
                        cy='433'
                        rx='5.5'
                        ry='8'
                        style={getStyle(18)}
                        onClick={() => handleToggle(18, 'mao_direita', 18)}
                    />
                    <ellipse
                        cx='455'
                        cy='428'
                        rx='6'
                        ry='8.5'
                        style={getStyle(19)}
                        onClick={() => handleToggle(19, 'mao_direita', 19)}
                    />
                    <ellipse
                        cx='430'
                        cy='435'
                        rx='5.5'
                        ry='8'
                        style={getStyle(20)}
                        onClick={() => handleToggle(20, 'mao_direita', 20)}
                    />
                    <ellipse
                        cx='410'
                        cy='455'
                        rx='5'
                        ry='7'
                        transform='rotate(-15 410 455)'
                        style={getStyle(21)}
                        onClick={() => handleToggle(21, 'mao_direita', 21)}
                    />{' '}
                    {/* Mínimo */}
                </g>
            </svg>
            <p className={styles.caption}>
                Componente Anatômico — Toque nas regiões para selecionar
            </p>
        </div>
    );
}
