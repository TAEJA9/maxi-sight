import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { ASSET_CLASSES, formatKRW } from '../modules/moduleA.js';
import { SectionHeader } from './shared.jsx';
import { AlertTriangle } from 'lucide-react';

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

// ── 페르소나 스타일별 기본 목표 배분 (Skills-D §2·D-02) ──────────────────
const STYLE_TARGET_ALLOCATION = {
  'aggressive': { 'EQ-F': 40, 'ET-F': 25, 'CR': 20, 'ET': 10, 'CS': 5 },
  'stable':     { 'EQ': 25, 'ET-F': 20, 'BD': 25, 'CS': 20, 'AL': 10 },
  'us-stock':   { 'EQ-F': 70, 'ET-F': 20, 'CS': 10 },
};

function detectStyle(styleStr = '') {
  if (styleStr.includes('공격')) return 'aggressive';
  if (styleStr.includes('안정')) return 'stable';
  if (styleStr.includes('미국')) return 'us-stock';
  return 'us-stock';
}

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
 * V3 목표 배분 비교 섹션 (Skills-C §V3)
 * 현재 비중 vs 목표 비중, ±5%p 초과 항목 강조
 */
function TargetAllocationCompare({ allocation, style }) {
  const styleKey = detectStyle(style);
  const target = STYLE_TARGET_ALLOCATION[styleKey];
  if (!target) return null;

  const allClasses = [...new Set([...Object.keys(target), ...Object.keys(allocation).filter(k => (allocation[k] ?? 0) > 0)])];

  const rows = allClasses.map(cls => {
    const current = allocation[cls] ?? 0;
    const tgt = target[cls] ?? 0;
    const diff = current - tgt;
    const isDeviated = Math.abs(diff) > 5;
    return { cls, current, tgt, diff, isDeviated };
  }).filter(r => r.current > 0 || r.tgt > 0);

  return (
    <div className="mt-5 pt-4 border-t border-[var(--border)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-[var(--text-primary)]">목표 배분 비교</span>
        <span className="text-[10px] text-[var(--text-muted)]">±5%p 초과 시 강조</span>
      </div>
      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin">
        {rows.map(({ cls, current, tgt, diff, isDeviated }) => {
          const color = ASSET_CLASS_COLORS[cls] ?? '#888';
          const label = ASSET_CLASSES[cls]?.label ?? cls;
          return (
            <div
              key={cls}
              className={`rounded-lg px-3 py-2 transition-all ${
                isDeviated
                  ? 'border border-amber-500/40 bg-amber-500/5'
                  : 'border border-transparent bg-[var(--bg-secondary)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
                  {isDeviated && (
                    <AlertTriangle size={10} className="text-amber-400" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--text-muted)]">목표 {tgt}%</span>
                  <span className={`font-bold ${
                    diff > 0 ? 'text-red-400' : diff < 0 ? 'text-blue-400' : 'text-[var(--text-muted)]'
                  }`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}%p
                  </span>
                </div>
              </div>
              {/* 이중 바: 목표(배경) / 현재(전경) */}
              <div className="relative h-1.5 w-full rounded-full bg-[var(--border)]">
                {/* 목표 마커 */}
                <div
                  className="absolute top-0 h-full w-0.5 rounded-full bg-white/30"
                  style={{ left: `${Math.min(tgt, 100)}%` }}
                />
                {/* 현재 바 */}
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(current, 100)}%`,
                    background: isDeviated
                      ? `linear-gradient(90deg, ${color}99, ${color})`
                      : color,
                    boxShadow: isDeviated ? `0 0 6px ${color}55` : 'none',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-[var(--text-muted)]">현재 {current.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SuperAllocationBar({ superAlloc }) {
  const { domestic_pct, overseas_pct } = superAlloc;
  if (domestic_pct === 0 && overseas_pct === 0) return null;

  return (
    <div className="mt-6 pt-5 border-t border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[var(--text-primary)]">지역별 비중</span>
        <div className="flex gap-3 text-[11px] font-medium text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> 국내 {domestic_pct}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> 해외 {overseas_pct}%
          </span>
        </div>
      </div>
      <div className="flex w-full h-2 rounded-full overflow-hidden bg-[var(--bg-secondary)]">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${domestic_pct}%` }}
        />
        <div
          className="h-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${overseas_pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * V3 — 포트폴리오 배분 차트 (Skills-C §V3)
 * Donut chart — hover info shown in center, no floating tooltip
 * + 목표 배분 비교 (Skills-C §V3 요구사항)
 */
export function V3AllocationChart({ metrics, portfolioStyle }) {
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
      <div className="glass-card p-4 flex items-center justify-center h-64">
        <p className="text-[var(--text-muted)] text-sm">자산 배분 데이터가 없어요</p>
      </div>
    );
  }

  const [activeIdx, setActiveIdx] = useState(null);
  const activeItem = activeIdx !== null ? data[activeIdx] : null;

  return (
    <div className="glass-card p-4 animate-fade-in-up h-[440px] flex flex-col">
      <SectionHeader
        title="자산 배분"
        subtitle="포트폴리오 구성 비율"
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 mt-1 pb-4">
        <div className="relative" onMouseLeave={() => setActiveIdx(null)}>
          <ResponsiveContainer width="100%" height={200}>
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

      {/* 목표 배분 비교 (Skills-C §V3) */}
      {portfolioStyle && (
        <TargetAllocationCompare allocation={allocation} style={portfolioStyle} />
      )}

      {metrics.super_allocation && (
        <SuperAllocationBar superAlloc={metrics.super_allocation} />
      )}
      </div>
    </div>
  );
}
