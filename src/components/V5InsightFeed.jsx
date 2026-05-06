import React, { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import { INSIGHT_COLORS, formatInsightTime } from '../modules/moduleE.js';
import { SectionHeader, EasyGuide } from './shared.jsx';
import { Zap, Brain } from 'lucide-react';

const PRIORITY_LABEL = {
  HIGH:   { label: '긴급', cls: 'text-red-400 bg-red-500/10' },
  MEDIUM: { label: '주의', cls: 'text-yellow-400 bg-yellow-500/10' },
  LOW:    { label: '참고', cls: 'text-gray-400 bg-gray-600/10' },
};

const FILTER_TABS = [
  { id: 'all',    label: '전체',        types: null },
  { id: 'danger', label: '⚠️ 위험',     types: ['위험 알림', '변동성 경보'] },
  { id: 'rebal',  label: '🔄 리밸런싱', types: ['리밸런싱 알림', '집중 위험'] },
  { id: 'oppo',   label: '✅ 기회',     types: ['기회 신호'] },
  { id: 'info',   label: '💡 정보',     types: ['정보 알림', '뉴스 감성 경보'] },
];

// ─── 건강도 점수 계산 ────────────────────────────────────────
function calcHealthScores(metrics) {
  const { cagr_pct, sharpe_ratio, mdd_pct, volatility_annualized_pct, allocation } = metrics;

  const profitability   = cagr_pct     == null ? 50 : Math.min(100, Math.max(0, (cagr_pct / 15) * 100));
  const efficiency      = sharpe_ratio == null ? 50 : Math.min(100, Math.max(0, (sharpe_ratio / 2) * 100));
  const riskControl     = mdd_pct      == null ? 50 : Math.min(100, Math.max(0, 100 - (mdd_pct / 30) * 100));
  const stability       = volatility_annualized_pct == null ? 50
    : Math.min(100, Math.max(0, 100 - (volatility_annualized_pct / 35) * 100));

  const allocVals       = Object.values(allocation ?? {}).filter(v => v > 0);
  const hhi             = allocVals.reduce((s, v) => s + (v / 100) ** 2, 0);
  const diversification = Math.min(100, Math.max(0, (1 - hhi) * 115));

  const dims = [
    Math.round(profitability),
    Math.round(efficiency),
    Math.round(riskControl),
    Math.round(stability),
    Math.round(diversification),
  ];

  return {
    overall: Math.round(dims.reduce((a, b) => a + b, 0) / dims.length),
    radar: [
      { subject: '수익성', value: dims[0], fullMark: 100 },
      { subject: '효율성', value: dims[1], fullMark: 100 },
      { subject: '리스크', value: dims[2], fullMark: 100 },
      { subject: '안정성', value: dims[3], fullMark: 100 },
      { subject: '분산도', value: dims[4], fullMark: 100 },
    ],
  };
}

// ─── 반원 건강도 게이지 ──────────────────────────────────────
function HealthGauge({ score }) {
  const pct   = Math.min(100, Math.max(0, score));
  const r     = 48;
  const half  = Math.PI * r;
  const drawn = (pct / 100) * half;
  const color = pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171';
  const grade = pct >= 70 ? '양호' : pct >= 40 ? '보통' : '주의';

  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <svg width="124" height="72" viewBox="0 0 124 72">
        {/* 배경 트랙 */}
        <path d="M 14 64 A 48 48 0 0 1 110 64"
              fill="none" stroke="#232338" strokeWidth="8" strokeLinecap="round" />
        {/* 진행 아크 */}
        <path d="M 14 64 A 48 48 0 0 1 110 64"
              fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${drawn} ${half}`}
              style={{ filter: `drop-shadow(0 0 6px ${color}88)` }} />
        {/* 점수 */}
        <text x="62" y="54" textAnchor="middle" fontSize="24" fontWeight="900" fill="white"
              style={{ fontFamily: 'inherit' }}>{pct}</text>
      </svg>
      <p className="text-xs font-bold -mt-1" style={{ color }}>{grade}</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 tracking-wide">건강도 점수</p>
    </div>
  );
}

// ─── V5A: AI 포트폴리오 건강도 카드 (별도 glass-card) ────────
/**
 * V5AIHealth — 건강도 게이지 + 차원 바 + 레이더 차트
 * App.jsx 에서 V5InsightFeed 위에 별도 카드로 배치
 */
export function V5AIHealth({ metrics, isLoading }) {
  const health = useMemo(() => metrics ? calcHealthScores(metrics) : null, [metrics]);
  const dimColor = v => v >= 70 ? '#34d399' : v >= 40 ? '#fbbf24' : '#f87171';

  if (!health) return null;

  return (
    <div className="glass-card p-5 animate-fade-in-up">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Brain size={14} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">AI 포트폴리오 분석</p>
            <p className="text-[10px] text-[var(--text-muted)]">5개 지표 종합 평가</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isLoading ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-yellow-400">분석 중...</span>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400">완료</span>
            </>
          )}
        </div>
      </div>

      {/* 게이지 (좌) + 차원 바 (우) */}
      <div className="flex items-center gap-4 mb-3">
        <HealthGauge score={health.overall} />
        <div className="flex-1 flex flex-col gap-2.5">
          {health.radar.map(d => {
            const c = dimColor(d.value);
            return (
              <div key={d.subject} className="flex items-center gap-2">
                <div className="flex items-center justify-end gap-0.5 w-14 flex-shrink-0">
                  <span className="text-[11px] text-[var(--text-secondary)]">{d.subject}</span>
                  <EasyGuide term={d.subject} />
                </div>
                {/* 트랙 */}
                <div className="flex-1 rounded-full overflow-hidden"
                     style={{ height: 6, background: '#22223a' }}>
                  <div className="h-full rounded-full"
                       style={{
                         width: `${d.value}%`,
                         background: `linear-gradient(90deg, ${c}bb, ${c})`,
                         boxShadow: `0 0 6px ${c}55`,
                         transition: 'width 0.9s ease',
                       }} />
                </div>
                <span className="text-[11px] font-bold w-6 text-right flex-shrink-0" style={{ color: c }}>
                  {d.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 레이더 차트 — emerald→indigo 그라디언트 배경으로 검정으로 보이지 않게 */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(52,211,153,0.10) 0%, rgba(99,102,241,0.10) 100%)',
          border: '1px solid rgba(52,211,153,0.18)',
        }}
      >
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart
            data={health.radar}
            margin={{ top: 22, right: 52, bottom: 18, left: 52 }}
          >
            <PolarGrid stroke="rgba(160,155,210,0.45)" strokeWidth={1} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#686888', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}
              tickLine={false}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="value"
              stroke="#34d399"
              strokeWidth={2.5}
              fill="#10b981"
              fillOpacity={0.22}
              dot={{ r: 4, fill: '#34d399', strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 개별 인사이트 카드 ──────────────────────────────────────
function InsightCard({ insight, delay = 0 }) {
  const colors   = INSIGHT_COLORS[insight.color] ?? INSIGHT_COLORS.info;
  const priority = PRIORITY_LABEL[insight.priority] ?? PRIORITY_LABEL.LOW;

  return (
    <div
      className={`rounded-xl border border-white/[0.06] border-l-4 p-4 ${colors.accent} ${colors.bg} animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3 mb-2">
        <span className="text-xl leading-none mt-0.5 flex-shrink-0">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-bold text-[var(--text-primary)]">{insight.title}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${priority.cls}`}>
              {priority.label}
            </span>
            {insight.ai_generated && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-emerald-400 bg-emerald-500/15">
                ✦ AI
              </span>
            )}
          </div>
          <span className={`text-xs ${colors.label} font-medium`}>{insight.type}</span>
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-9">{insight.body}</p>
      <div className="flex items-center gap-1.5 mt-2.5 pl-9">
        <Zap size={10} className="text-[var(--text-muted)]" />
        <span className="text-[11px] text-[var(--text-muted)]">
          {formatInsightTime(insight.generated_at)} · {insight.source}
        </span>
      </div>
    </div>
  );
}

// ─── V5B: 인사이트 카드 피드 (별도 glass-card) ───────────────
/**
 * V5InsightFeed — 필터 탭 + 스크롤 인사이트 카드 목록
 */
export function V5InsightFeed({ insights, isLoading }) {
  const [filterTab, setFilterTab] = useState('all');

  const filtered = !insights ? [] : filterTab === 'all'
    ? insights
    : insights.filter(c => {
        const tab = FILTER_TABS.find(t => t.id === filterTab);
        return tab?.types?.includes(c.type);
      });

  return (
    <div className="glass-card p-5 animate-fade-in-up">
      <SectionHeader
        title="인사이트 피드"
        subtitle={`${insights?.length ?? 0}개`}
      >
        <div className="flex items-center gap-1.5 text-xs">
          {isLoading
            ? <><div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /><span className="text-yellow-400">AI 분석 중...</span></>
            : <><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-emerald-400">실시간 분석</span></>
          }
        </div>
      </SectionHeader>

      {/* 필터 탭 */}
      <div className="flex gap-0.5 mb-4 border-b border-[var(--border)] -mx-1 overflow-x-auto">
        {FILTER_TABS.map(tab => {
          const count = tab.id === 'all'
            ? insights?.length ?? 0
            : insights?.filter(c => tab.types?.includes(c.type)).length ?? 0;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-2.5 py-2 text-xs font-semibold rounded-t border-b-2 -mb-px transition-all whitespace-nowrap flex-shrink-0 ${
                filterTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1 text-[10px] px-1 py-0.5 rounded-full ${
                  filterTab === tab.id ? 'bg-emerald-500/20' : 'bg-[var(--border)]'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 카드 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">👍</div>
          <p className="text-[var(--text-muted)] text-sm">
            {filterTab === 'all' ? '현재 특이 신호가 없어요' : '이 카테고리의 인사이트가 없어요'}
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
            {filtered.map((insight, idx) => (
              <InsightCard key={insight.trigger_id} insight={insight} delay={idx * 50} />
            ))}
          </div>
          {filtered.length > 4 && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10
                            bg-gradient-to-t from-[var(--bg-card)] to-transparent rounded-b-2xl" />
          )}
        </div>
      )}
    </div>
  );
}
