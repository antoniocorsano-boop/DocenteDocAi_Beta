// MD3 Compliant

import React, { useState } from 'react';

interface DonutData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutData[];
}

const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const [hoveredSegment, setHoveredSegment] = useState<DonutData | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercentage = 0;

  const summary = hoveredSegment 
    ? { value: hoveredSegment.value, label: hoveredSegment.label } 
    : { value: total, label: 'Totale' };

  return (
    <div style={{ position: 'relative', width: 200, height: 200 }}>
      <svg width="200" height="200" viewBox="0 0 200 200">
        <g transform="rotate(-90 100 100)">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDashoffset = circumference - (accumulatedPercentage / 100) * circumference;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            
            // Map custom var strings to real CSS variables if needed, or trust the passed color
            const strokeColor = item.color.startsWith('var') ? item.color : item.color;

            accumulatedPercentage += percentage;

            return (
              <circle
                key={index}
                
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={strokeColor}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                onMouseEnter={() => setHoveredSegment(item)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            );
          })}
        </g>
         <text x="100" y="95" textAnchor="middle"  fill="var(--md-sys-color-onSurface)" fontWeight="bold" fontSize="24">
            {summary.value}
        </text>
        <text x="100" y="115" textAnchor="middle"  fill="var(--md-sys-color-onSurface-variant)" fontSize="12">
            {summary.label}
        </text>
      </svg>
    </div>
  );
};

export default DonutChart;

