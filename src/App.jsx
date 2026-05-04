import React, { useState, useMemo, useCallback } from 'react';
import { Layers, RefreshCw, Activity } from 'lucide-react';

// Raw data
import portfolioData from '../portfolio.json';

// Modules
import { normalizePortfolio, groupByAccount } from './modules/moduleA.js';
import { calculateMetrics } from './modules/moduleB.js';
import { generateInsights } from './modules/moduleD.js';

// Components
import { V1BalanceHub } from './components/V1BalanceHub.jsx';
import { V2KPICards } from './components/V2KPICards.jsx';
import { V3AllocationChart } from './components/V3AllocationChart.jsx';
import { V4Timeline } from './components/V4Timeline.jsx';
import { V5InsightFeed } from './components/V5InsightFeed.jsx';

// Persona holding years (simulated)
const HOLDING_YEARS = {
  'MIO-USER-SYJ': 1.5,  // 송유진: 1.5 years aggressive
  'MIO-USER-KJY': 3.0,  // 김정연: 3 years stable
  'MIO-USER-HYJ': 2.0,  // 한예지: 2 years US stocks
};

// Persona avatar styles
const AVATAR_STYLES = {
  'MIO-USER-SYJ': 'from-orange-400 to-red-500',
  'MIO-USER-KJY': 'from-blue-400 to-indigo-600',
  'MIO-USER-HYJ': 'from-emerald-400 to-cyan-500',
};

// Persona style tags
const STYLE_TAGS = {
  'MIO-USER-SYJ': ['고위험', '공격형', '성장주 집중'],
  'MIO-USER-KJY': ['저위험', '안정형', '절세 전략가'],
  'MIO-USER-HYJ': ['중위험', '미국주식 매니아', 'FAANG 집중'],
};

/**
 * Persona Switcher Tab
 */
function PersonaTab({ persona, isActive, onClick }) {
  const avatarGrad = AVATAR_STYLES[persona.portfolio_id];
  const initial = persona.owner_name[0];
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-left
        ${isActive
          ? 'bg-white/10 border border-white/15 shadow-lg'
          : 'hover:bg-white/5 border border-transparent'
        }`}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGrad} flex items-center justify-center
        flex-shrink-0 text-white font-bold text-sm shadow-lg
        ${isActive ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#111118]' : ''}
      `}>
        {initial}
      </div>
      
      <div className="hidden sm:block">
        <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-white' : 'text-gray-400'}`}>
          {persona.owner_name}
        </p>
        <p className="text-xs text-gray-600">{persona.age_group}</p>
      </div>
      
      {isActive && (
        <div className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:block" />
      )}
    </button>
  );
}

/**
 * Header component
 */
function Header({ personas, activeId, onSelect, onRefresh }) {
  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-[1400px] mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <Activity size={16} className="text-white" />
            </div>
            <div className="hidden xs:block">
              <span className="text-base font-bold gradient-text">Maxi-Sight</span>
              <span className="text-xs text-gray-600 ml-1.5 hidden sm:inline">by MaxItOut</span>
            </div>
          </div>
          
          {/* Persona Switcher */}
          <nav className="flex items-center gap-1">
            {personas.map(p => (
              <PersonaTab
                key={p.portfolio_id}
                persona={p}
                isActive={p.portfolio_id === activeId}
                onClick={() => onSelect(p.portfolio_id)}
              />
            ))}
          </nav>
          
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl hover:bg-white/8 text-gray-500 hover:text-emerald-400 transition-all"
              title="데이터 새로고침"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Persona Info Bar
 */
function PersonaInfoBar({ portfolio, metrics }) {
  const avatarGrad = AVATAR_STYLES[portfolio.portfolio_id];
  const tags = STYLE_TAGS[portfolio.portfolio_id] ?? [];
  
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-bold text-lg shadow-xl`}>
        {portfolio.owner_name[0]}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">{portfolio.owner_name}</h1>
          <span className="text-sm text-gray-500">{portfolio.age_group}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {tags.map(tag => (
            <span key={tag} className="badge-emerald text-xs">{tag}</span>
          ))}
        </div>
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-500">총 수익률</p>
          <p className={`text-base font-bold ${metrics.total_return_pct >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
            {metrics.total_return_pct >= 0 ? '+' : ''}{metrics.total_return_pct.toFixed(2)}%
          </p>
        </div>
        
        {metrics.flags?.length > 0 && (
          <div className="badge-yellow text-xs">
            ⚠ {metrics.flags.length}개 경고
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main App
 */
export default function App() {
  const portfolios = portfolioData.portfolios;
  const [activeId, setActiveId] = useState(portfolios[0].portfolio_id);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Find active portfolio raw data
  const activeRaw = useMemo(
    () => portfolios.find(p => p.portfolio_id === activeId),
    [activeId]
  );
  
  // Module A: Normalize
  const normalized = useMemo(
    () => normalizePortfolio(activeRaw),
    [activeRaw, refreshKey]
  );
  
  // Account groups for V1
  const accountGroups = useMemo(
    () => groupByAccount(normalized),
    [normalized]
  );
  
  // Module B: Calculate metrics
  const metrics = useMemo(() => {
    const years = HOLDING_YEARS[activeId] ?? 1.5;
    return calculateMetrics(normalized, years);
  }, [normalized, activeId, refreshKey]);
  
  // Module D: Generate insights
  const insights = useMemo(
    () => generateInsights(metrics, normalized),
    [metrics, normalized]
  );
  
  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);
  
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header with persona switcher */}
      <Header
        personas={portfolios}
        activeId={activeId}
        onSelect={setActiveId}
        onRefresh={handleRefresh}
      />
      
      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Persona info bar */}
        <PersonaInfoBar portfolio={normalized} metrics={metrics} />
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
          {/* Left column: V1 Balance Hub */}
          <div className="space-y-5">
            <V1BalanceHub
              metrics={metrics}
              normalizedPortfolio={normalized}
              accountGroups={accountGroups}
            />
            
            {/* V3 on left below V1 on desktop */}
            <V3AllocationChart metrics={metrics} />
            
            {/* V5 Insight Feed on left on desktop */}
            <V5InsightFeed insights={insights} />
          </div>
          
          {/* Right column: V2 + V4 */}
          <div className="space-y-5">
            {/* V2 KPI Cards */}
            <V2KPICards metrics={metrics} />
            
            {/* V4 Timeline */}
            <V4Timeline metrics={metrics} />
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-12 pb-6 text-center">
          <p className="text-xs text-gray-700">
            Maxi-Sight · MaxItOut Team · 데이터 기준: {new Date(normalized.generated_at).toLocaleDateString('ko-KR')} ·
            환율 ₩{normalized.exchange_rate_usd_krw.toLocaleString()}/USD
          </p>
          <p className="text-xs text-gray-800 mt-1">
            본 서비스는 투자 정보 제공 목적이며, 투자 권유가 아닙니다.
          </p>
        </footer>
      </main>
    </div>
  );
}
