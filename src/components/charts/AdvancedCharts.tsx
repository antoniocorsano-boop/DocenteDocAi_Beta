// MD3 Compliant - Pure CSS tokens, no useTheme dependency

import React from 'react';

// --- LINE CHART ---
interface LineChartProps {
    data: { date: string; value: number; label: string }[];
    color: string;
    height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, color, height = 250 }) => {

    if (data.length === 0) {
        return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "var(--md-sys-percent-100)", opacity: "var(--md-sys-state-opacity-placeholder)", color: 'var(--md-sys-color-on-surface-variant)' }}>Nessun dato disponibile.</div>;
    }

    const padding = 30;
    const width = 600; // Internal SVG coordinate system
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Scales
    const minVal = 1; // Grades usually 1-10
    const maxVal = 10;
    
    // Handle single point case
    const getX = (index: number) => {
        if (data.length === 1) return width / 2; // Center if single point
        return padding + (index / (data.length - 1)) * chartWidth;
    };
    
    const getY = (value: number) => height - padding - ((value - minVal) / (maxVal - minVal)) * chartHeight;

    // Create Path
    let pathD = '';
    if (data.length > 1) {
        pathD = `M ${getX(0)} ${getY(data[0].value)}`;
        for (let i = 1; i < data.length; i++) {
            pathD += ` L ${getX(i)} ${getY(data[i].value)}`;
        }
    }

    // Area Path (for gradient fill)
    let areaPathD = '';
    if (data.length > 1) {
        areaPathD = `${pathD} L ${getX(data.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;
    }

    return (
        <div  style={{ width: "var(--md-sys-percent-100)", height }}>
            <svg viewBox={`0 0 ${width} ${height}`}  style={{ width: "var(--md-sys-percent-100)", height: "var(--md-sys-percent-100)" }}>
                {/* Grids */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke='var(--md-sys-color-outline-variant)' strokeWidth="1" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke='var(--md-sys-color-outline-variant)' strokeWidth="1" />
                
                {/* Area Fill (Only if > 1 point) */}
                {data.length > 1 && <path d={areaPathD} fill={color} fillOpacity="0.1" />}

                {/* Line (Only if > 1 point) */}
                {data.length > 1 && <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

                {/* Horizontal line for single point context */}
                {data.length === 1 && (
                     <line 
                        x1={padding} 
                        y1={getY(data[0].value)} 
                        x2={width - padding} 
                        y2={getY(data[0].value)} 
                        stroke={color} 
                        strokeWidth="1" 
                        strokeDasharray="4 4" 
                        opacity="0.5" 
                    />
                )}

                {/* Points */}
                {data.map((point, i) => (
                    <circle
                        key={i}
                        cx={getX(i)}
                        cy={getY(point.value)}
                        r="4"
                        fill={color}
                        stroke='var(--md-sys-color-surface)'
                        strokeWidth="2"
                    />
                ))}

                {/* Labels (X Axis) */}
                {data.map((point, i) => (
                    (data.length < 8 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 5) === 0) && (
                        <text key={i} x={getX(i)} y={height - 5} fontSize="var(--md-sys-typescale-label-large-font-size)" textAnchor="middle" fill='var(--md-sys-color-on-surface-variant)'>
                            {point.label}
                        </text>
                    )
                ))}
            </svg>
        </div>
    );
};

// --- RADAR CHART ---
interface RadarChartProps {
    data: { axis: string; value: number }[]; // value 1-4
    color: string;
    size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, color, size = 300 }) => {

    if (data.length === 0) {
        return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 'var(--md-sys-spacing-4)', opacity: "var(--md-sys-state-opacity-placeholder)", color: 'var(--md-sys-color-on-surface-variant)' }}>Dati competenze non disponibili.</div>;
    }

    const center = size / 2;
    const radius = (size / 2) - 40; // Padding
    const maxValue = 4; // Levels 1-4
    const angleSlice = (Math.PI * 2) / data.length;

    const getCoordinates = (value: number, index: number) => {
        const angle = index * angleSlice - Math.PI / 2; // Start from top
        const r = (value / maxValue) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    // Grid Levels (1, 2, 3, 4)
    const levels = [1, 2, 3, 4];
    
    // Create Polygon Points
    const polygonPoints = data.map((d, i) => {
        const { x, y } = getCoordinates(d.value, i);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} >
                {/* Background Grid */}
                {levels.map(level => (
                    <polygon
                        key={level}
                        points={data.map((_, i) => {
                            const { x, y } = getCoordinates(level, i);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke='var(--md-sys-color-outline-variant)'
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Axis Lines */}
                {data.map((_, i) => {
                    const { x, y } = getCoordinates(maxValue, i);
                    return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke='var(--md-sys-color-outline-variant)' strokeWidth="1" />;
                })}

                {/* Data Polygon */}
                <polygon
                    points={polygonPoints}
                    fill={color}
                    fillOpacity="0.3"
                    stroke={color}
                    strokeWidth="2"
                />

                {/* Data Points & Labels */}
                {data.map((d, i) => {
                    const { x, y } = getCoordinates(d.value, i);
                    const labelPos = getCoordinates(maxValue + 0.5, i); // Push label out
                    
                    return (
                        <g key={i}>
                            <circle cx={x} cy={y} r="4" fill={color} />
                            <text
                                x={labelPos.x}
                                y={labelPos.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="var(--md-sys-typescale-label-large-font-size)"
                                fill='var(--md-sys-color-on-surface)'
                                style={{ fontWeight: "var(--md-sys-typescale-label-large-font-weight)" }}
                            >
                                {d.axis}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

