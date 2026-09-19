import React from 'react';
import type { ToothItem } from '../OdontoAnatomyHelpers';
import styles from './OdontoToothGrid.module.css';

interface OdontoToothGridProps {
    orderedTeeth: ToothItem[];
    /** FDI number of the currently selected tooth, or null for none. */
    selectedToothNumber: number | null;
    suppressDateHighlights: boolean;
    /** Set of FDI numbers that have at least one active treatment. */
    activeDateToothNumbers: Set<number>;
    onToothClick?: (toothNumber: number) => void;
    readOnly?: boolean;
}

export const OdontoToothGrid = React.memo(function OdontoToothGrid({
    orderedTeeth,
    selectedToothNumber,
    suppressDateHighlights,
    activeDateToothNumbers,
    onToothClick,
    readOnly = false,
}: OdontoToothGridProps) {
    return (
        <svg
            className={styles.arcadeSvg}
            viewBox='0 0 760 390'
            role='img'
            aria-label='Mapa da arcada com 32 dentes'
        >
            <text x='24' y='24' className={styles.quadrantLabel}>
                Q1 - SUPERIOR DIREITO
            </text>
            <text x='386' y='24' className={styles.quadrantLabel}>
                Q2 - SUPERIOR ESQUERDO
            </text>
            <text x='24' y='220' className={styles.quadrantLabel}>
                Q4 - INFERIOR DIREITO
            </text>
            <text x='386' y='220' className={styles.quadrantLabel}>
                Q3 - INFERIOR ESQUERDO
            </text>
            <line
                x1='371'
                y1='34'
                x2='371'
                y2='376'
                className={styles.quadrantDivider}
            />
            {orderedTeeth.map((tooth, index) => {
                const row = Math.floor(index / 8);
                const col = index % 8;
                const x = 20 + col * 90;
                const lowerOffset = row >= 2 ? 32 : 0;
                const y = 40 + row * 82 + lowerOffset;
                const fdi = tooth.international_number;
                const selected = selectedToothNumber === fdi;
                const inDateEvent =
                    !suppressDateHighlights && activeDateToothNumbers.has(fdi);
                const interactive =
                    !readOnly && typeof onToothClick === 'function';

                return (
                    <g
                        key={fdi}
                        className={`${styles.toothGroup} ${
                            interactive ? '' : styles.toothGroupStatic
                        }`}
                        onClick={
                            interactive
                                ? () => {
                                      onToothClick(fdi);
                                  }
                                : undefined
                        }
                        onKeyDown={
                            interactive
                                ? event => {
                                      if (
                                          event.key === 'Enter' ||
                                          event.key === ' '
                                      ) {
                                          event.preventDefault();
                                          onToothClick(fdi);
                                      }
                                  }
                                : undefined
                        }
                        role={interactive ? 'button' : undefined}
                        tabIndex={interactive ? 0 : undefined}
                        aria-pressed={interactive ? selected : undefined}
                        aria-label={`Dente ${fdi}`}
                    >
                        <rect
                            x={x}
                            y={y}
                            width='72'
                            height='62'
                            rx='10'
                            className={`${styles.toothRect} ${
                                selected
                                    ? styles.toothSelected
                                    : inDateEvent
                                      ? styles.toothInDateEvent
                                      : styles.toothEmpty
                            }`}
                        />
                        <text
                            x={x + 36}
                            y={y + 31}
                            className={`${styles.toothNumber} ${
                                selected || inDateEvent
                                    ? styles.toothNumberActive
                                    : ''
                            }`}
                        >
                            {fdi}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
});
