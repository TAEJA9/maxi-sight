import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { SectionHeader, PeriodSelector } from './shared.jsx';
import { formatKRW, formatPct } from '../modules/moduleA.js';

const PERIODS = ['1M', '3M', '6M', '1Y', '전체'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-xs text-[var(--text-muted)] mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--text-muted)]">{p.name}</span>
          <span className="font-semibold ml-auto" style={{ color: p.color }}>
            {p.value >= 0 ? '+' : ''}{p.value?.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}



/**
 * V4 — 수익률 타임라인 (Skills-C §V4)
 * Line chart with portfolio vs KOSPI vs S&P 500
 * + Horizontal bar chart for holding contributions
 */
export function V4Timeline({ metrics }) {
  const [period, setPeriod] = useState('1Y');
  const { timeline, contributions } = metrics;
  
  // Filter timeline by period
  const filteredTimeline = useMemo(() => {
    if (!timeline?.length) return [];
    const periodDays = { '1M': 22, '3M': 66, '6M': 132, '1Y': 252, '전체': timeline.length };
    const days = periodDays[period] ?? timeline.length;
    return timeline.slice(Math.max(0, timeline.length - days));
  }, [timeline, period]);
  
  // Thin out data for performance (show max 60 points)
  const displayData = useMemo(() => {
    if (filteredTimeline.length <= 60) return filteredTimeline;
    const step = Math.ceil(filteredTimeline.length / 60);
    return filteredTimeline.filter((_, i) => i % step === 0 || i === filteredTimeline.length - 1);
  }, [filteredTimeline]);
  
  // Top holdings for contribution bar chart
  const topHoldings = useMemo(() => {
    return (contributions ?? []).slice(0, 6);
  }, [contributions]);
  
  const latestData = displayData[displayData.length - 1];
  
  return (
    <div className="space-y-4">
      {/* Timeline Chart */}
      <div className="glass-card p-4 animate-fade-in-up">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <SectionHeader 
              title="수익률 타임라인" 
              subtitle="현재일 기준 과거 1년 시뮬레이션"
            />
            <div className="flex items-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-emerald-400 inline-block rounded" />
                <span className="text-[var(--text-muted)]">내 포트폴리오</span>
                {latestData && (
                  <span className={`font-bold ${latestData.portfolio >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                    {latestData.portfolio >= 0 ? '+' : ''}{latestData.portfolio.toFixed(2)}%
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-px bg-gray-500 inline-block border-dashed border-t border-gray-500" />
                <span className="text-[var(--text-muted)]">KOSPI</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-px bg-blue-700 inline-block" />
                <span className="text-[var(--text-muted)]">S&P 500</span>
              </span>
            </div>
          </div>
          <PeriodSelector periods={PERIODS} active={period} onChange={setPeriod} />
        </div>
        
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={displayData} margin={{ top: 16, right: 8, bottom: 8, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#555', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.ceil(displayData.length / 5)}
            />
            <YAxis
              tick={{ fill: '#555', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
              width={48}
              padding={{ top: 12, bottom: 12 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
            <Line
              type="monotone"
              dataKey="portfolio"
              name="내 포트폴리오"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="kospi"
              name="KOSPI"
              stroke="#4b5563"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="sp500"
              name="S&P 500"
              stroke="#1e3a5f"
              strokeWidth={1}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Holdings Contribution List */}
      <div className="glass-card p-4 animate-fade-in-up">
        <SectionHeader
          title="종목별 수익 기여도"
          subtitle="취득단가 대비 수익률 순"
        />
        
        <div className="mt-3 flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin">
          {topHoldings.map((h, idx) => {
            const isPositive = h.return_pct >= 0;
            const colorClass = isPositive ? 'text-red-500' : 'text-blue-500';
            const sign = isPositive ? '+' : '';
            
            return (
              <div key={h.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors border border-transparent hover:border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{h.name}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{h.ticker}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-base font-bold ${colorClass} tracking-tight leading-tight`}>
                    {sign}{h.return_pct?.toFixed(2)}%
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {formatKRW(h.gain_krw)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
