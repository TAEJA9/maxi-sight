import React from 'react';
import { EasyGuide } from './shared.jsx';
import { formatKRW } from '../modules/moduleA.js';
import {
  translateCAGR, translateSharpe, translateMDD,
  cagrColorClass, sharpeColorClass, mddColorClass,
} from '../modules/moduleE.js';

// 0-100 점수 변환
function cagrScore(v)   { return v == null ? 0 : Math.min(100, Math.max(0, (v / 15) * 100)); }
function sharpeScore(v) { return v == null ? 0 : Math.min(100, Math.max(0, (v / 2.5) * 100)); }
function mddScore(v)    { return v == null ? 0 : Math.min(100, Math.max(0, 100 - (v / 30) * 100)); }

// SVG 원형 점수 아크
function ScoreArc({ score, color }) {
  const r     = 26;
  const circ  = 2 * Math.PI * r;
  const pct   = Math.min(100, Math.max(0, Math.round(score)));
  const drawn = (pct / 100) * circ;

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="flex-shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx="32" cy="32" r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${drawn} ${circ - drawn}`}
        transform="rotate(-90 32 32)"
        style={{ transition: 'stroke-dasharray 0.9s ease' }}
      />
      <text
        x="32" y="37"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill={color}
        style={{ fontFamily: 'inherit' }}
      >
        {pct}
      </text>
    </svg>
  );
}

/** 그라디언트 메인 KPI 카드 */
function KPICard({ title, value, unit, colorClass, translation, guideKey, subtitle, accentColor, score }) {
  const isPositive = parseFloat(value) > 0;
  const isNegative = parseFloat(value) < 0;
  const arrow      = isPositive ? '▲' : isNegative ? '▼' : '';
  const arrowColor = isPositive ? 'text-red-500' : isNegative ? 'text-blue-500' : '';

  return (
    <div
      className="glass-card overflow-hidden flex flex-col animate-fade-in-up"
      style={{
        background: `linear-gradient(145deg, ${accentColor}1a 0%, ${accentColor}08 50%, var(--bg-card) 100%)`,
        borderColor: `${accentColor}28`,
      }}
    >
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* 타이틀 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{title}</span>
            <EasyGuide term={guideKey} />
          </div>
          <span className="text-xs text-[var(--text-muted)]">{subtitle}</span>
        </div>

        {/* 수치 + 아크 */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-end gap-1">
            {arrow && <span className={`text-sm font-bold mb-1 ${arrowColor}`}>{arrow}</span>}
            <span className={`text-3xl font-extrabold tracking-tight leading-none ${colorClass}`}>
              {value ?? '—'}
            </span>
            {unit && value != null && (
              <span className={`text-lg font-semibold mb-0.5 ml-0.5 ${colorClass} opacity-80`}>{unit}</span>
            )}
          </div>
          <ScoreArc score={score} color={accentColor} />
        </div>

        {/* 해설 */}
        <p className="text-xs text-[var(--text-muted)] leading-relaxed border-t pt-2 mt-1" style={{ borderColor: `${accentColor}20` }}>
          {translation}
        </p>
      </div>
    </div>
  );
}

/** 보조 지표 카드 */
function SecondaryKPI({ label, guideKey, value, sub }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">{label}</span>
        <EasyGuide term={guideKey} />
      </div>
      <p className="text-xl font-extrabold text-[var(--text-primary)] leading-none">{value}</p>
      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</p>
    </div>
  );
}

/**
 * V2 — 3대 핵심 지표 카드 (Skills-C §V2)
 * 그라디언트 배경 + SVG 점수 아크
 */
export function V2KPICards({ metrics }) {
  const {
    cagr_pct, cagr_is_simple, sharpe_ratio, mdd_pct,
    sortino_ratio, portfolio_beta, volatility_annualized_pct,
  } = metrics;

  const cagrAccent   = cagr_pct   >= 7   ? '#10b981' : cagr_pct   >= 3   ? '#f59e0b' : '#ef4444';
  const sharpeAccent = sharpe_ratio >= 1.0 ? '#6366f1' : sharpe_ratio >= 0.5 ? '#f59e0b' : '#ef4444';
  const mddAccent    = mdd_pct    <  5   ? '#10b981' : mdd_pct    <  15  ? '#f59e0b' : '#ef4444';

  const kpis = [
    {
      id: 'cagr',   title: 'CAGR',   guideKey: 'CAGR',
      subtitle: cagr_is_simple ? '단순 수익률*' : '연평균 성장률',
      value: cagr_pct   != null ? cagr_pct.toFixed(2)   : null, unit: '%',
      colorClass: cagrColorClass(cagr_pct),
      translation: translateCAGR(cagr_pct, cagr_is_simple),
      accentColor: cagrAccent, score: cagrScore(cagr_pct),
    },
    {
      id: 'sharpe', title: 'Sharpe', guideKey: 'Sharpe',
      subtitle: '투자 가성비',
      value: sharpe_ratio != null ? sharpe_ratio.toFixed(2) : null, unit: '',
      colorClass: sharpeColorClass(sharpe_ratio),
      translation: translateSharpe(sharpe_ratio),
      accentColor: sharpeAccent, score: sharpeScore(sharpe_ratio),
    },
    {
      id: 'mdd',    title: 'MDD',    guideKey: 'MDD',
      subtitle: '최대 낙폭',
      value: mdd_pct    != null ? mdd_pct.toFixed(1)    : null, unit: '%',
      colorClass: mddColorClass(mdd_pct),
      translation: translateMDD(mdd_pct),
      accentColor: mddAccent, score: mddScore(mdd_pct),
    },
  ];

  const { dividend } = metrics;
  const hasDividend = dividend && dividend.annual_dividend_krw > 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpis.map(kpi => <KPICard key={kpi.id} {...kpi} />)}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <SecondaryKPI label="Sortino"  guideKey="Sortino"
          value={sortino_ratio != null ? sortino_ratio.toFixed(2) : '—'}
          sub="하락장 맷집" />
        <SecondaryKPI label="베타"     guideKey="베타"
          value={portfolio_beta != null ? portfolio_beta.toFixed(2) : '—'}
          sub="시장 민감도" />
        <SecondaryKPI label="변동성"   guideKey="변동성"
          value={volatility_annualized_pct != null ? `${volatility_annualized_pct.toFixed(1)}%` : '—'}
          sub="연환산 스트레스" />
        <SecondaryKPI label="연 배당"
          value={hasDividend ? formatKRW(dividend.annual_dividend_krw) : '—'}
          sub="예상 연간 배당" />
        <SecondaryKPI label="월 배당"
          value={hasDividend ? formatKRW(dividend.monthly_dividend_krw) : '—'}
          sub="월평균 수령 예상" />
        <SecondaryKPI label="배당 종목"
          value={hasDividend ? `${dividend.dividend_items.length}개` : '—'}
          sub="배당 지급 종목 수" />
      </div>
    </div>
  );
}
