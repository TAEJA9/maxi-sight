import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { SectionHeader } from './shared.jsx';
import { formatKRW } from '../modules/moduleA.js';

const COLORS = {
  'EQ': '#3b82f6',
  'EQ-F': '#6366f1',
  'ET': '#10b981',
  'ET-F': '#059669',
  'BD': '#f59e0b',
  'CS': '#6b7280',
  'CM': '#d97706',
  'CR': '#a855f7',
  'SV': '#0ea5e9',
  'AL': '#f43f5e',
  'UN': '#374151',
};

const CustomContent = (props) => {
  const { root, depth, x, y, width, height, index, payload, name, value, ticker, asset_class } = props;
  
  // Skip rendering if too small
  if (width < 2 && height < 2) return null;
  
  const bgColor = COLORS[asset_class] || '#555';
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: bgColor,
          stroke: 'var(--bg-card)',
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
        rx={6}
        ry={6}
      />
      {width > 60 && height > 40 && (
        <>
          <text 
            x={x + 8} 
            y={y + 20} 
            fill="#ffffff" 
            fontSize={13} 
            fontWeight="bold"
            className="drop-shadow-md"
          >
            {name}
          </text>
          {height > 55 && (
            <text 
              x={x + 8} 
              y={y + 36} 
              fill="rgba(255,255,255,0.85)" 
              fontSize={11}
              className="drop-shadow-sm"
            >
              {formatKRW(value)}
            </text>
          )}
        </>
      )}
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{data.name}</p>
        {data.ticker && <p className="text-[11px] text-[var(--text-muted)] mb-1">{data.ticker}</p>}
        <p className="text-sm text-emerald-400 font-bold mt-1">{formatKRW(data.value)}</p>
      </div>
    );
  }
  return null;
};

export function V6Treemap({ metrics }) {
  const data = metrics.ticker_allocation || [];
  
  if (data.length === 0) {
    return (
      <div className="glass-card p-4 flex items-center justify-center h-64">
        <p className="text-[var(--text-muted)] text-sm">종목 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 animate-fade-in-up">
      <SectionHeader 
        title="종목별 비중 (집중도)" 
        subtitle="개별 자산 합산 및 면적 분석" 
      />
      
      <div className="w-full h-[320px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="value"
            ratio={4 / 3}
            stroke="#fff"
            fill="#8884d8"
            content={<CustomContent />}
            isAnimationActive={true}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
