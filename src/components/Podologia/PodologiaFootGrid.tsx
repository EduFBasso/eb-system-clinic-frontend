import { useState } from 'react';

interface SelectedRegions {
    [key: string]: boolean;
}

export function PodologiaFootGrid() {
    const [selectedRegions, setSelectedRegions] = useState<SelectedRegions>({});

    const handleRegionClick = (regionId: string) => {
        setSelectedRegions(prev => ({
            ...prev,
            [regionId]: !prev[regionId],
        }));
    };

    return (
        <div
            style={{
                padding: '20px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                maxWidth: '400px',
                margin: '20px auto',
                textAlign: 'center',
            }}
        >
            <h4
                style={{
                    margin: '0 0 15px 0',
                    color: '#333',
                    fontFamily: 'sans-serif',
                }}
            >
                Podograma Interativo (Hobby Test)
            </h4>

            {/* SVG representando a anatomia dos Pés */}
            <svg viewBox='0 0 300 200' width='100%' height='100%'>
                {/* Pé Esquerdo - Corpo/Planta */}
                <path
                    id='pe_esquerdo_corpo'
                    d='M 80,60 C 50,70 50,150 70,170 C 90,190 110,190 110,170 C 110,150 100,70 80,60 Z'
                    fill={
                        selectedRegions['pe_esquerdo_corpo']
                            ? '#00bcd4'
                            : '#e0e0e0'
                    }
                    onClick={() => handleRegionClick('pe_esquerdo_corpo')}
                    style={{
                        cursor: 'pointer',
                        transition: 'fill 0.2s',
                        stroke: '#fff',
                        strokeWidth: 2,
                    }}
                />
                {/* Dedos do Pé Esquerdo */}
                <circle
                    id='pe_esq_dedo_1'
                    cx='60'
                    cy='40'
                    r='10'
                    fill={
                        selectedRegions['pe_esq_dedo_1'] ? '#00bcd4' : '#b0bec5'
                    }
                    onClick={() => handleRegionClick('pe_esq_dedo_1')}
                    style={{ cursor: 'pointer' }}
                />
                <circle
                    id='pe_esq_dedo_2'
                    cx='78'
                    cy='35'
                    r='8'
                    fill={
                        selectedRegions['pe_esq_dedo_2'] ? '#00bcd4' : '#b0bec5'
                    }
                    onClick={() => handleRegionClick('pe_esq_dedo_2')}
                    style={{ cursor: 'pointer' }}
                />
                <circle
                    id='pe_esq_dedo_3'
                    cx='94'
                    cy='38'
                    r='7'
                    fill={
                        selectedRegions['pe_esq_dedo_3'] ? '#00bcd4' : '#b0bec5'
                    }
                    onClick={() => handleRegionClick('pe_esq_dedo_3')}
                    style={{ cursor: 'pointer' }}
                />
                <circle
                    id='pe_esq_dedo_4'
                    cx='108'
                    cy='45'
                    r='6'
                    fill={
                        selectedRegions['pe_esq_dedo_4'] ? '#00bcd4' : '#b0bec5'
                    }
                    onClick={() => handleRegionClick('pe_esq_dedo_4')}
                    style={{ cursor: 'pointer' }}
                />
                <circle
                    id='pe_esq_dedo_5'
                    cx='120'
                    cy='55'
                    r='5'
                    fill={
                        selectedRegions['pe_esq_dedo_5'] ? '#00bcd4' : '#b0bec5'
                    }
                    onClick={() => handleRegionClick('pe_esq_dedo_5')}
                    style={{ cursor: 'pointer' }}
                />

                {/* Pé Direito - Corpo/Planta */}
                <path
                    id='pe_direito_corpo'
                    d='M 220,60 C 250,70 250,150 230,170 C 210,190 190,190 190,170 C 190,150 200,70 220,60 Z'
                    fill={
                        selectedRegions['pe_direito_corpo']
                            ? '#00bcd4'
                            : '#e0e0e0'
                    }
                    onClick={() => handleRegionClick('pe_direito_corpo')}
                    style={{
                        cursor: 'pointer',
                        transition: 'fill 0.2s',
                        stroke: '#fff',
                        strokeWidth: 2,
                    }}
                />
                {/* Dedos do Pé Direito */}
                <circle
                    id='pe_dir_dedo_1'
                    cx='240'
                    cy='40'
                    r='10'
                    fill={
                        selectedRegions['pe_dir_dedo_1'] ? '#00bcd4' : '#b0bec5'
                    }
                    onClick={() => handleRegionClick('pe_dir_dedo_1')}
                    style={{ cursor: 'pointer' }}
                />
                <circle
                    id='pe_dir_dedo_2'
                    cx='222'
                    cy='35'
                    r='8'
                    fill={
                        selectedRegions['pe_dir_dedo_2'] ? '#00bcd4' : '#b0bec5'
                    }
                    onClick={() => handleRegionClick('pe_dir_dedo_2')}
                    style={{ cursor: 'pointer' }}
                />
                <circle
                    id='pe_dir_dedo_3'
                    cx='206'
                    cy='38'
                    r='7'
                    fill={
                        selectedRegions['pe_dir_dedo_3'] ? '#00bcd4' : '#b0bec5'
                    }
                    onClick={() => handleRegionClick('pe_dir_dedo_3')}
                    style={{ cursor: 'pointer' }}
                />
                <circle
                    id='pe_dir_dedo_4'
                    cx='192'
                    cy='45'
                    r='6'
                    fill={
                        selectedRegions['pe_dir_dedo_4'] ? '#00bcd4' : '#b0bec5'
                    }
                    onClick={() => handleRegionClick('pe_dir_dedo_4')}
                    style={{ cursor: 'pointer' }}
                />
                <circle
                    id='pe_dir_dedo_5'
                    cx='180'
                    cy='55'
                    r='5'
                    fill={
                        selectedRegions['pe_dir_dedo_5'] ? '#00bcd4' : '#b0bec5'
                    }
                    onClick={() => handleRegionClick('pe_dir_dedo_5')}
                    style={{ cursor: 'pointer' }}
                />
            </svg>

            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                Clique nos círculos (dedos) ou na planta para testar a ativação.
            </div>
        </div>
    );
}
