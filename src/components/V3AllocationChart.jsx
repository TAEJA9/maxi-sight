import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ASSET_CLASSES, formatKRW } from '../modules/moduleA.js';
import { SectionHeader } from './shared.jsx';

const ASSET_CLASS_COLORS = {
  'EQ':   '#3b82f6',
  'EQ-F': '#6366f1',
  'ET':   '#10b981',
  'ET-F': '#059669',
  'BD':   '#f59e0b',
  'CS':   '#6b7280',
  'CM':   '#d97706',
  'CR':   '#a855f7',
  'SV':   '#0ea5e9',
  'AL':   '#f43f5e',
  'UN':   '#374151',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="custom-tooltip">
      <p className="text-sm font-semibold text-white">{item.label}</p>
      <p className="text-sm text-emerald-400">{item.value.toFixed(1)}%</p>
      <p className="text-xs text-gray-500">{formatKRW(item.krw)}</p>
    </div>
  );
}

function CustomLegend({ data }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
      {data.map(item => (
        <div key={item.cls} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: item.color }}
          />
          <span className="text-xs text-gray-400 truncate">{item.label}</span>
          <span className="text-xs font-semibold text-white ml-auto">{item.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

/**
 * V3 — 포트폴리오 배분 차트 (Skills-C §V3)
 * Donut chart with total value in center, asset class legend
 */
export function V3AllocationChart({ metrics }) {
  const { allocation, total_value_krw } = metrics;
  
  // Build donut data
  const data = Object.entries(allocation)
    .filter(([, pct]) => pct > 0)
    .map(([cls, pct]) => ({
      cls,
      label: ASSET_CLASSES[cls]?.label ?? cls,
      value: pct,
      color: ASSET_CLASS_COLORS[cls] ?? '#666',
      krw: (pct / 100) * total_value_krw,
    }))
    .sort((a, b) => b.value - a.value);
  
  if (data.length === 0) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">자산 배분 데이터가 없어요</p>
      </div>
    );
  }
  
  const [activeIdx, setActiveIdx] = useState(null);
  
  return (
    <div className="glass-card p-6 animate-fade-in-up">
      <SectionHeader
        title="자산 배분"
        subtitle="포트폴리오 구성 비율"
      />
      
      <div className="relative">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, idx) => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={entry.cls}
                  fill={entry.color}
                  opacity={activeIdx === null || activeIdx === idx ? 1 : 0.4}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-xs text-gray-500 mb-0.5">총 자산</p>
          <p className="text-base font-bold text-white leading-tight">
            {formatKRW(total_value_krw)}
          </p>
        </div>
      </div>
      
      <CustomLegend data={data} />
    </div>
  );
}
