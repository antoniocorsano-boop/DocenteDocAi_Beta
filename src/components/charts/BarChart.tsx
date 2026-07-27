// MD3 Compliant

import React, { useState } from 'react';

const LABEL_SPACE = 80; // Space reserved for labels in pixels

interface ChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartData[];
  color: string;
  horizontal?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ data, color, horizontal = false }) => {
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 250;
  const chartWidth = 500;
  const barMargin = 5;
  const barWidth = (chartWidth / data.length) - barMargin;

  const handleMouseOver = (e: React.MouseEvent, d: ChartData) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      content: `${d.label}: ${d.value}`,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseOut = () => {
    setTooltip(null);
  };
  
  const renderVertical = () => (
    <svg width="var(--md-sys-percent-100)" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        return (
          <g key={d.label}>
            <rect
              
              x={i * (barWidth + barMargin)}
              y={chartHeight - barHeight}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx={4}
              onMouseMove={(e) => handleMouseOver(e, d)}
              onMouseLeave={handleMouseOut}
            />
            <text
              x={i * (barWidth + barMargin) + barWidth / 2}
              y={chartHeight - 5}
              textAnchor="middle"
              fontSize="var(--md-sys-typescale-body-large-font-size)"
              fill="var(--md-sys-color-onSurface-variant)"
              
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );

  const renderHorizontal = () => {
    const rowHeight = (chartHeight / data.length);
    const barHeight = rowHeight * 0.7;
    return (
        <svg width="var(--md-sys-percent-100)" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
            {data.map((d, i) => {
                const yPos = i * rowHeight;
                const barLength = (d.value / maxValue) * (chartWidth - LABEL_SPACE); // LABEL_SPACE for labels
                return (
                    <g key={d.label}>
                         <text
                            x={0}
                            y={yPos + rowHeight / 2}
                            dominantBaseline="middle"
                            fontSize="var(--md-sys-typescale-body-large-font-size)"
                            fill="var(--md-sys-color-onSurface-variant)"
                            
                        >
                            {d.label}
                        </text>
                        <rect
                            
                            x={80}
                            y={yPos + (rowHeight - barHeight) / 2}
                            width={barLength}
                            height={barHeight}
                            fill={color}
                            onMouseMove={(e) => handleMouseOver(e, d)}
                            onMouseLeave={handleMouseOut}
                            rx={4}
                        />
                        <text
                             x={85 + barLength}
                             y={yPos + rowHeight / 2}
                             dominantBaseline="middle"
                             fontSize="var(--md-sys-typescale-body-large-font-size)"
                             fill="var(--md-sys-color-onSurface)"
                             fontWeight="bold"
                             
                        >
                            {d.value}
                        </text>
                    </g>
                );
            })}
        </svg>
    )
  };

  return (
    <div style={{ position: 'relative' }}>
      {horizontal ? renderHorizontal() : renderVertical()}
      {tooltip && (
        <div
          
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            opacity: 1,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default BarChart;

