import React from 'react';
import { EasyGuide, SectionHeader } from './shared.jsx';
import {
  translateCAGR, translateSharpe, translateMDD,
  cagrColorClass, sharpeColorClass, mddColorClass,
} from '../modules/moduleE.js';

/**
 * Single KPI card (V2)
 */
function KPICard({ title, value, unit, colorClass, translation, guideKey, subtitle }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-1.5 hover:border-white/15 transition-all animate-fade-in-up">
      {/* Title + EasyGuide */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        <EasyGuide term={guideKey} />
      </div>
      
      {subtitle && (
        <span className="text-xs text-gray-600">{subtitle}</span>
      )}
      
      {/* Main value */}
      <div className="flex items-baseline gap-1 my-1">
        <span className={`text-2xl font-bold tracking-tight ${colorClass}`}>
          {value ?? '—'}
        </span>
        {unit && value != null && (
          <span className={`text-base font-medium ${colorClass} opacity-70`}>{unit}</span>
        )}
      </div>
      
      {/* Translation line (Skills-E §1) */}
      <p className="text-xs text-gray-500 leading-snug">{translation}</p>
    </div>
  );
}

/**
 * V2 — 3대 핵심 지표 카드 (Skills-C §V2)
 * CAGR · Sharpe · MDD displayed as 3 horizontal cards
 */
export function V2KPICards({ metrics }) {
  const { cagr_pct, cagr_is_simple, sharpe_ratio, mdd_pct, sortino_ratio, portfolio_beta, volatility_annualized_pct } = metrics;
  
  const kpis = [
    {
      id: 'cagr',
      title: 'CAGR',
      guideKey: 'CAGR',
      subtitle: cagr_is_simple ? '단순 수익률*' : '연평균 성장률',
      value: cagr_pct != null ? (cagr_is_simple ? cagr_pct.toFixed(2) : cagr_pct.toFixed(2)) : null,
      unit: '%',
      colorClass: cagrColorClass(cagr_pct),
      translation: translateCAGR(cagr_pct, cagr_is_simple),
    },
    {
      id: 'sharpe',
      title: 'Sharpe',
      guideKey: 'Sharpe',
      subtitle: '투자 가성비',
      value: sharpe_ratio != null ? sharpe_ratio.toFixed(2) : null,
      unit: '',
      colorClass: sharpeColorClass(sharpe_ratio),
      translation: translateSharpe(sharpe_ratio),
    },
    {
      id: 'mdd',
      title: 'MDD',
      guideKey: 'MDD',
      subtitle: '최대 낙폭',
      value: mdd_pct != null ? mdd_pct.toFixed(1) : null,
      unit: '%',
      colorClass: mddColorClass(mdd_pct),
      translation: translateMDD(mdd_pct),
    },
  ];
  
  return (
    <div className="space-y-4">
      {/* Main 3 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpis.map(kpi => (
          <KPICard key={kpi.id} {...kpi} />
        ))}
      </div>
      
      {/* Secondary metrics row */}
      <div className="grid grid-cols-3 gap-3">
        <SecondaryKPI
          label="Sortino"
          guideKey="Sortino"
          value={sortino_ratio != null ? sortino_ratio.toFixed(2) : '—'}
          sub="하락장 맷집"
        />
        <SecondaryKPI
          label="베타"
          guideKey="베타"
          value={portfolio_beta != null ? portfolio_beta.toFixed(2) : '—'}
          sub="시장 민감도"
        />
        <SecondaryKPI
          label="변동성"
          guideKey="변동성"
          value={volatility_annualized_pct != null ? `${volatility_annualized_pct.toFixed(1)}%` : '—'}
          sub="연환산 스트레스 지수"
        />
      </div>
    </div>
  );
}

function SecondaryKPI({ label, guideKey, value, sub }) {
  return (
    <div className="glass-card p-3.5 flex flex-col gap-0.5 justify-center">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <EasyGuide term={guideKey} />
      </div>
      <p className="text-lg font-bold text-[var(--text-primary)] leading-none">{value}</p>
      <p className="text-[11px] text-[var(--text-muted)] mt-1">{sub}</p>
    </div>
  );
}
