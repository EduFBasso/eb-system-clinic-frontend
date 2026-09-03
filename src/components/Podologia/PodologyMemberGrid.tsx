import React from 'react';
import type { PodologyScope } from './PodologyAnatomyHelpers';
import { REGIONS, PLANTAR_LABELS } from './PodologyAnatomyHelpers';
import styles from './PodologyMemberGrid.module.css';
import useIsMobile from '../../hooks/useIsMobile';

interface PodologyMemberGridProps {
    /** Controlled selection. Falls back to internal state when omitted. */
    selectedIds?: number[];
    onToggleRegion?: (id: number, scope: PodologyScope) => void;
    /** Disables clicks — used for the read-only summary shown in the workspace. */
    readOnly?: boolean;
}

export function PodologyMemberGrid({
    selectedIds: controlledSelectedIds,
    onToggleRegion,
    readOnly = false,
}: PodologyMemberGridProps = {}) {
    const isMobile = useIsMobile(480); // Foca em mobiles estritos/smartphones
    const [activeTab, setActiveTab] = React.useState<
        'all' | 'pe_esquerdo' | 'pe_direito' | 'mao_esquerda' | 'mao_direita'
    >('all');
    const [internalSelectedIds, setInternalSelectedIds] = React.useState<
        number[]
    >([]);
    const selectedIds = controlledSelectedIds ?? internalSelectedIds;

    function toggleRegion(id: number, scope: PodologyScope) {
        if (readOnly) return;
        if (onToggleRegion) {
            onToggleRegion(id, scope);
            return;
        }
        setInternalSelectedIds(previous =>
            previous.includes(id)
                ? previous.filter(existing => existing !== id)
                : [...previous, id],
        );
    }

    // Coordenadas dinâmicas viewBox (zoom inteligente na Solução A)
    const getViewBox = () => {
        if (!isMobile || activeTab === 'all') {
            return '0 0 500 550';
        }
        switch (activeTab) {
            case 'pe_esquerdo':
                return '70 30 180 230'; // Zoom focado no Pé Esquerdo
            case 'pe_direito':
                return '250 30 180 230'; // Zoom focado no Pé Direito
            case 'mao_esquerda':
                return '70 290 180 230'; // Zoom focado na Mão Esquerda
            case 'mao_direita':
                return '250 290 180 230'; // Zoom focado na Mão Direita
            default:
                return '0 0 500 550';
        }
    };

    return (
        <div
            className={`${styles.wrapper} ${readOnly ? styles.wrapperReadOnly : ''}`}
        >
            {/* Abas de navegação somente para mobile / telas estreitas */}
            {isMobile && !readOnly && (
                <div className={styles.mobileTabs}>
                    <button
                        type='button'
                        className={`${styles.tabButton} ${activeTab === 'all' ? styles.tabButtonActive : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        Ver Geral
                    </button>
                    <button
                        type='button'
                        className={`${styles.tabButton} ${activeTab === 'pe_esquerdo' ? styles.tabButtonActive : ''}`}
                        onClick={() => setActiveTab('pe_esquerdo')}
                    >
                        Pé Esq.
                    </button>
                    <button
                        type='button'
                        className={`${styles.tabButton} ${activeTab === 'pe_direito' ? styles.tabButtonActive : ''}`}
                        onClick={() => setActiveTab('pe_direito')}
                    >
                        Pé Dir.
                    </button>
                    <button
                        type='button'
                        className={`${styles.tabButton} ${activeTab === 'mao_esquerda' ? styles.tabButtonActive : ''}`}
                        onClick={() => setActiveTab('mao_esquerda')}
                    >
                        Mão Esq.
                    </button>
                    <button
                        type='button'
                        className={`${styles.tabButton} ${activeTab === 'mao_direita' ? styles.tabButtonActive : ''}`}
                        onClick={() => setActiveTab('mao_direita')}
                    >
                        Mão Dir.
                    </button>
                </div>
            )}

            <svg
                className={styles.svg}
                viewBox={getViewBox()}
                role='img'
                aria-label='Podograma e quiropodograma interativo'
            >
                {/* Cabeçalhos e divisores dos Pés (Parte Superior) */}
                <text x={125} y={25} className={styles.quadrantLabel}>
                    Pé Esquerdo
                </text>
                <text x={375} y={25} className={styles.quadrantLabel}>
                    Pé Direito
                </text>
                <line
                    x1={250}
                    y1={30}
                    x2={250}
                    y2={260}
                    className={styles.quadrantDivider}
                />

                {/* Linhas de contorno pontilhadas anatômicas dos Pés */}
                <path
                    className={styles.contour}
                    d='M 125,250 C 112,250 110,235 110,215 C 110,180 94,155 96,115 C 98,98 152,98 154,115 C 152,145 133,180 133,215 C 133,235 138,250 125,250 Z'
                />
                <path
                    className={styles.contour}
                    d='M 375,250 C 388,250 390,235 390,215 C 390,180 406,155 404,115 C 402,98 348,98 346,115 C 348,145 367,180 367,215 C 367,235 362,250 375,250 Z'
                />

                {/* Divisor horizontal entre Pés e Mãos */}
                <line
                    x1={20}
                    y1={270}
                    x2={480}
                    y2={270}
                    className={styles.quadrantDivider}
                />

                {/* Cabeçalhos e divisores das Mãos (Parte Inferior) */}
                <text x={125} y={290} className={styles.quadrantLabel}>
                    Mão Esquerda
                </text>
                <text x={375} y={290} className={styles.quadrantLabel}>
                    Mão Direita
                </text>
                <line
                    x1={250}
                    y1={300}
                    x2={250}
                    y2={530}
                    className={styles.quadrantDivider}
                />

                {/* Linhas de contorno pontilhadas anatômicas das Mãos */}
                <path
                    className={styles.contour}
                    d='M 112,510 C 100,510 81,460 83,415 C 83,390 91,390 91,415 C 91,425 96,400 97,365 C 97,340 108,340 108,365 C 108,375 113,380 115,345 C 115,320 126,320 126,345 C 126,380 131,375 133,365 C 133,340 144,340 144,365 C 144,400 140,410 145,425 C 150,430 164,410 163,430 C 162,450 142,475 140,510 C 135,510 124,510 112,510 Z'
                />
                <path
                    className={styles.contour}
                    d='M 388,510 C 400,510 419,460 417,415 C 417,390 409,390 409,415 C 409,425 404,400 403,365 C 403,340 392,340 392,365 C 392,375 387,380 385,345 C 385,320 374,320 374,345 C 374,380 369,375 367,365 C 367,340 356,340 356,365 C 356,400 360,410 355,425 C 350,430 336,410 337,430 C 338,450 358,475 360,510 C 365,510 376,510 388,510 Z'
                />

                {REGIONS.map(region => {
                    const selected = selectedIds.includes(region.id);
                    const className = `${styles.region} ${
                        selected ? styles.regionSelected : ''
                    }`;
                    const isPlantar = region.id in PLANTAR_LABELS;

                    return (
                        <g
                            key={region.id}
                            className={className}
                            role='button'
                            tabIndex={readOnly ? -1 : 0}
                            aria-pressed={selected}
                            aria-disabled={readOnly}
                            aria-label={`${region.label} — ${region.scope}`}
                            onClick={() =>
                                toggleRegion(region.id, region.scope)
                            }
                            onKeyDown={event => {
                                if (
                                    event.key === 'Enter' ||
                                    event.key === ' '
                                ) {
                                    event.preventDefault();
                                    toggleRegion(region.id, region.scope);
                                }
                            }}
                        >
                            {region.shape.kind === 'circle' ? (
                                <circle
                                    cx={region.shape.cx}
                                    cy={region.shape.cy}
                                    r={region.shape.r}
                                />
                            ) : (
                                <rect
                                    x={region.shape.x}
                                    y={region.shape.y}
                                    width={region.shape.width}
                                    height={region.shape.height}
                                    rx={4}
                                />
                            )}
                            <text
                                x={
                                    region.shape.kind === 'circle'
                                        ? region.shape.cx
                                        : region.shape.x +
                                          region.shape.width / 2
                                }
                                y={
                                    region.shape.kind === 'circle'
                                        ? region.shape.cy + 4
                                        : region.shape.y +
                                          region.shape.height / 2 +
                                          4
                                }
                                className={styles.regionLabel}
                            >
                                {isPlantar
                                    ? PLANTAR_LABELS[region.id]
                                    : region.label.replace(/\D/g, '')}
                            </text>
                        </g>
                    );
                })}
            </svg>
            {!readOnly && (
                <p className={styles.caption}>
                    Toque nas unhas, dedos ou blocos de pés e mãos para
                    selecionar a região do procedimento.
                </p>
            )}
        </div>
    );
}
