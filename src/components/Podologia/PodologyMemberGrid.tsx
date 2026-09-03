import React from 'react';
import type { PodologyScope } from './PodologyAnatomyHelpers';
import { PODOLOGY_SCOPE_OPTIONS } from './PodologyAnatomyHelpers';
import styles from './PodologyMemberGrid.module.css';

type RegionShape =
    | { kind: 'circle'; cx: number; cy: number; r: number }
    | { kind: 'rect'; x: number; y: number; width: number; height: number };

interface FootRegion {
    id: number;
    scope: PodologyScope;
    label: string;
    shape: RegionShape;
}

const REGIONS: FootRegion[] = [
    // --- PÉ DIREITO (Dedos 1-5, Plantar 6-8) ---
    {
        id: 1,
        scope: 'pe_direito',
        label: 'Dedo 1',
        shape: { kind: 'circle', cx: 352, cy: 82, r: 10 },
    },
    {
        id: 2,
        scope: 'pe_direito',
        label: 'Dedo 2',
        shape: { kind: 'circle', cx: 368, cy: 74, r: 7.2 },
    },
    {
        id: 3,
        scope: 'pe_direito',
        label: 'Dedo 3',
        shape: { kind: 'circle', cx: 383, cy: 71, r: 6.6 },
    },
    {
        id: 4,
        scope: 'pe_direito',
        label: 'Dedo 4',
        shape: { kind: 'circle', cx: 397, cy: 75, r: 5.8 },
    },
    {
        id: 5,
        scope: 'pe_direito',
        label: 'Dedo 5',
        shape: { kind: 'circle', cx: 410, cy: 84, r: 5.0 },
    },
    {
        id: 6,
        scope: 'pe_direito',
        label: 'Antepé',
        shape: { kind: 'rect', x: 350, y: 122, width: 50, height: 45 },
    },
    {
        id: 7,
        scope: 'pe_direito',
        label: 'Mediopé',
        shape: { kind: 'rect', x: 355, y: 175, width: 40, height: 34 },
    },
    {
        id: 8,
        scope: 'pe_direito',
        label: 'Retropé',
        shape: { kind: 'rect', x: 360, y: 215, width: 30, height: 26 },
    },

    // --- PÉ ESQUERDO (Dedos 9-13, Plantar 14-16) ---
    {
        id: 9,
        scope: 'pe_esquerdo',
        label: 'Dedo 1',
        shape: { kind: 'circle', cx: 148, cy: 82, r: 10 },
    },
    {
        id: 10,
        scope: 'pe_esquerdo',
        label: 'Dedo 2',
        shape: { kind: 'circle', cx: 132, cy: 74, r: 7.2 },
    },
    {
        id: 11,
        scope: 'pe_esquerdo',
        label: 'Dedo 3',
        shape: { kind: 'circle', cx: 117, cy: 71, r: 6.6 },
    },
    {
        id: 12,
        scope: 'pe_esquerdo',
        label: 'Dedo 4',
        shape: { kind: 'circle', cx: 103, cy: 75, r: 5.8 },
    },
    {
        id: 13,
        scope: 'pe_esquerdo',
        label: 'Dedo 5',
        shape: { kind: 'circle', cx: 90, cy: 84, r: 5.0 },
    },
    {
        id: 14,
        scope: 'pe_esquerdo',
        label: 'Antepé',
        shape: { kind: 'rect', x: 100, y: 122, width: 50, height: 45 },
    },
    {
        id: 15,
        scope: 'pe_esquerdo',
        label: 'Mediopé',
        shape: { kind: 'rect', x: 105, y: 175, width: 40, height: 34 },
    },
    {
        id: 16,
        scope: 'pe_esquerdo',
        label: 'Retropé',
        shape: { kind: 'rect', x: 110, y: 215, width: 30, height: 26 },
    },

    // --- MÃO DIREITA (Unhas 17-21) ---
    {
        id: 17,
        scope: 'mao_direita',
        label: 'Unha 1',
        shape: { kind: 'rect', x: 341, y: 421, width: 8, height: 11 },
    },
    {
        id: 18,
        scope: 'mao_direita',
        label: 'Unha 2',
        shape: { kind: 'rect', x: 358, y: 348, width: 7, height: 10 },
    },
    {
        id: 19,
        scope: 'mao_direita',
        label: 'Unha 3',
        shape: { kind: 'rect', x: 376, y: 328, width: 7, height: 10 },
    },
    {
        id: 20,
        scope: 'mao_direita',
        label: 'Unha 4',
        shape: { kind: 'rect', x: 394, y: 348, width: 7, height: 10 },
    },
    {
        id: 21,
        scope: 'mao_direita',
        label: 'Unha 5',
        shape: { kind: 'rect', x: 410, y: 398, width: 6, height: 9 },
    },

    // --- MÃO ESQUERDA (Unhas 22-26) ---
    {
        id: 22,
        scope: 'mao_esquerda',
        label: 'Unha 1',
        shape: { kind: 'rect', x: 151, y: 421, width: 8, height: 11 },
    },
    {
        id: 23,
        scope: 'mao_esquerda',
        label: 'Unha 2',
        shape: { kind: 'rect', x: 135, y: 348, width: 7, height: 10 },
    },
    {
        id: 24,
        scope: 'mao_esquerda',
        label: 'Unha 3',
        shape: { kind: 'rect', x: 117, y: 328, width: 7, height: 10 },
    },
    {
        id: 25,
        scope: 'mao_esquerda',
        label: 'Unha 4',
        shape: { kind: 'rect', x: 99, y: 348, width: 7, height: 10 },
    },
    {
        id: 26,
        scope: 'mao_esquerda',
        label: 'Unha 5',
        shape: { kind: 'rect', x: 84, y: 398, width: 6, height: 9 },
    },
];

const PLANTAR_LABELS: Record<number, string> = {
    6: 'Antepé',
    7: 'Mediopé',
    8: 'Retropé',
    14: 'Antepé',
    15: 'Mediopé',
    16: 'Retropé',
};

/** Lightweight id → scope/label lookup, reused by the item-flow hook and modals. */
export interface PodologyRegionMeta {
    id: number;
    scope: PodologyScope;
    label: string;
}
export const PODOLOGY_REGIONS: PodologyRegionMeta[] = REGIONS.map(
    ({ id, scope, label }) => ({
        id,
        scope,
        label: PLANTAR_LABELS[id] ?? label,
    }),
);

export function getPodologyRegionLabel(
    scope: PodologyScope,
    locationNumber: number | null,
): string {
    if (scope === 'geral' || locationNumber == null) {
        return 'Geral / Outros';
    }
    const meta = PODOLOGY_REGIONS.find(r => r.id === locationNumber);
    const scopeOption = PODOLOGY_SCOPE_OPTIONS.find(opt => opt.value === scope);
    const scopeLabel = scopeOption?.label ?? '';
    const regionName = meta?.label ?? `Região ${locationNumber}`;
    return scopeLabel ? `${scopeLabel} - ${regionName}` : regionName;
}

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

    return (
        <div
            className={`${styles.wrapper} ${readOnly ? styles.wrapperReadOnly : ''}`}
        >
            <svg
                className={styles.svg}
                viewBox='0 0 500 550'
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
