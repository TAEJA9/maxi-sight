import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
} from 'recharts';
import { SectionHeader, PeriodSelector } from './shared.jsx';
import { formatKRW, formatPct } from '../modules/moduleA.js';

const PERIODS = ['1M', '3M', '6M', '1Y', '전체'];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}</span>
          <span className="font-semibold ml-auto" style={{ color: p.color }}>
            {p.value >= 0 ? '+' : ''}{p.value?.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function ContributionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="custom-tooltip">
      <p className="text-sm font-semibold text-white">{d?.name}</p>
      <p className="text-xs text-gray-400">{d?.ticker}</p>
      <p className={`text-sm font-bold mt-1 ${d?.return_pct >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
        {d?.return_pct >= 0 ? '+' : ''}{d?.return_pct?.toFixed(2)}%
      </p>
      <p className="text-xs text-gray-500">{formatKRW(d?.gain_krw)}</p>
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
      <div className="glass-card p-6 animate-fade-in-up">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <SectionHeader title="수익률 타임라인" />
            <div className="flex items-center gap-4 text-xs mt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-emerald-400 inline-block rounded" />
                <span className="text-gray-400">내 포트폴리오</span>
                {latestData && (
                  <span className={`font-bold ${latestData.portfolio >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                    {latestData.portfolio >= 0 ? '+' : ''}{latestData.portfolio.toFixed(2)}%
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-px bg-gray-500 inline-block border-dashed border-t border-gray-500" />
                <span className="text-gray-600">KOSPI</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-px bg-blue-700 inline-block" />
                <span className="text-gray-600">S&P 500</span>
              </span>
            </div>
          </div>
          <PeriodSelector periods={PERIODS} active={period} onChange={setPeriod} />
        </div>
        
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={displayData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
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
              width={45}
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
      
      {/* Holdings Contribution Bar Chart */}
      <div className="glass-card p-6 animate-fade-in-up">
        <SectionHeader
          title="종목별 수익 기여도"
          subtitle="취득단가 대비 수익률 순"
        />
        
        <ResponsiveContainer width="100%" height={Math.max(160, topHoldings.length * 36)}>
          <BarChart
            data={topHoldings}
            layout="vertical"
            margin={{ top: 0, right: 60, bottom: 0, left: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: '#555', fontSize: 10 }}
              tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#aaa', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<ContributionTooltip />} />
            <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
            <Bar dataKey="return_pct" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {topHoldings.map((h, idx) => (
                <Cell
                  key={h.id}
                  fill={h.return_pct >= 0 ? '#ef4444' : '#3b82f6'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
