import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { ASSET_CLASSES, formatKRW } from '../modules/moduleA.js';
import { SectionHeader } from './shared.jsx';

// 글래스모피즘 테마에 어울리는 차분한 파스텔-네온 팔레트
const ASSET_CLASS_COLORS = {
  'EQ':   '#60a5fa',  // blue-400
  'EQ-F': '#a5b4fc',  // indigo-300
  'ET':   '#34d399',  // emerald-400
  'ET-F': '#6ee7b7',  // emerald-300
  'BD':   '#fcd34d',  // amber-300
  'CS':   '#94a3b8',  // slate-400
  'CM':   '#fdba74',  // orange-300
  'CR':   '#c084fc',  // purple-400
  'SV':   '#7dd3fc',  // sky-300
  'AL':   '#fda4af',  // rose-300
  'UN':   '#64748b',  // slate-500
};

function CustomLegend({ data }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-5 pt-4 border-t border-[var(--border)]">
      {data.map(item => (
        <div key={item.cls} className="flex items-center gap-2.5">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: item.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm text-[var(--text-secondary)] truncate">{item.label}</span>
              <span className="text-sm font-bold text-[var(--text-primary)] flex-shrink-0">{item.value.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{formatKRW(item.krw)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * V3 — 포트폴리오 배분 차트 (Skills-C §V3)
 * Donut chart — hover info shown in center, no floating tooltip
 */
export function V3AllocationChart({ metrics }) {
  const { allocation, total_value_krw } = metrics;

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
        <p className="text-[var(--text-muted)] text-sm">자산 배분 데이터가 없어요</p>
      </div>
    );
  }

  const [activeIdx, setActiveIdx] = useState(null);
  const activeItem = activeIdx !== null ? data[activeIdx] : null;

  return (
    <div className="glass-card p-6 animate-fade-in-up">
      <SectionHeader
        title="자산 배분"
        subtitle="포트폴리오 구성 비율"
      />

      <div className="relative" onMouseLeave={() => setActiveIdx(null)}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={68}
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
                  opacity={activeIdx === null || activeIdx === idx ? 1 : 0.35}
                  stroke="transparent"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* 중앙 정보 — 호버 시 해당 항목, 평소엔 총 자산 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {activeItem ? (
            <div className="text-center transition-all">
              <p
                className="text-xs font-semibold mb-0.5 truncate max-w-[110px]"
                style={{ color: activeItem.color }}
              >
                {activeItem.label}
              </p>
              <p className="text-2xl font-extrabold text-[var(--text-primary)] leading-none">
                {activeItem.value.toFixed(1)}%
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{formatKRW(activeItem.krw)}</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-[var(--text-muted)] mb-0.5">총 자산</p>
              <p className="text-base font-bold text-[var(--text-primary)] leading-tight">
                {formatKRW(total_value_krw)}
              </p>
            </div>
          )}
        </div>
      </div>

      <CustomLegend data={data} />
    </div>
  );
}
