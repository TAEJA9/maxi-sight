import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Layers, RefreshCw, Activity, Sun, Moon, User } from 'lucide-react';

// Raw data
import portfolioData from '../portfolio.json';

// Modules
import { normalizePortfolio, groupByAccount, formatKRW } from './modules/moduleA.js';
import { calculateMetrics } from './modules/moduleB.js';
import { generateInsights, generateInsightsWithAI } from './modules/moduleD.js';

// Components
import { V1BalanceHub } from './components/V1BalanceHub.jsx';
import { V2KPICards } from './components/V2KPICards.jsx';
import { V3AllocationChart } from './components/V3AllocationChart.jsx';
import { V4Timeline } from './components/V4Timeline.jsx';
import { V5InsightFeed, V5AIHealth } from './components/V5InsightFeed.jsx';
import { V6Treemap } from './components/V6Treemap.jsx';

// Persona holding years (simulated)
const HOLDING_YEARS = {
  'MIO-USER-SYJ': 1.5,  // 송유진: 1.5 years aggressive
  'MIO-USER-KJY': 3.0,  // 김정연: 3 years stable
  'MIO-USER-HYJ': 2.0,  // 한예지: 2 years US stocks
  'MIO-USER-PMS': 1.0,  // 박민수: 1 year small-cap
};

// Persona avatar styles
const AVATAR_STYLES = {
  'MIO-USER-SYJ': 'from-orange-400 to-red-500',
  'MIO-USER-KJY': 'from-blue-400 to-indigo-600',
  'MIO-USER-HYJ': 'from-emerald-400 to-cyan-500',
  'MIO-USER-PMS': 'from-purple-400 to-pink-500',
};

// Persona style tags are no longer hardcoded, we use portfolio.style from portfolio.json directly.

/**
 * User Dropdown Menu
 */
function UserDropdown({ personas, activeId, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-emerald-400 transition-all flex items-center gap-2"
        title="계정 변경"
      >
        <User size={18} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden z-50">
          {personas.map(p => (
            <button
              key={p.portfolio_id}
              onClick={() => {
                onSelect(p.portfolio_id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-[var(--bg-card-hover)]
                ${activeId === p.portfolio_id ? 'text-emerald-500 font-bold bg-[var(--bg-secondary)]' : 'text-[var(--text-primary)]'}
              `}
            >
              {p.owner_name} ({p.age_group})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Header component
 */
function Header({ personas, activeId, onSelect, onRefresh, isDark, toggleDark, isRefreshing, activeTab, onTabChange }) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border)] transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Activity size={16} className="text-white" />
            </div>
            <div className="flex items-baseline gap-1.5 truncate">
              <span className="text-lg font-bold gradient-text tracking-tight truncate">Maxi-Sight</span>
              <span className="text-xs text-[var(--text-muted)] hidden lg:inline">by MaxItOut</span>
            </div>
          </div>
          
          {/* Center GNB Tabs */}
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl flex-shrink-0">
            <button
              className={`px-3 md:px-5 py-1.5 rounded-lg text-[13px] md:text-sm font-semibold transition-all ${
                activeTab === 'overview' 
                  ? 'bg-[var(--bg-card)] text-emerald-500 shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => onTabChange('overview')}
            >
              오버뷰
            </button>
            <button
              className={`px-3 md:px-5 py-1.5 rounded-lg text-[13px] md:text-sm font-semibold transition-all ${
                activeTab === 'portfolio' 
                  ? 'bg-[var(--bg-card)] text-emerald-500 shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => onTabChange('portfolio')}
            >
              포트폴리오
            </button>
            <button
              className={`px-3 md:px-5 py-1.5 rounded-lg text-[13px] md:text-sm font-semibold transition-all ${
                activeTab === 'insights' 
                  ? 'bg-[var(--bg-card)] text-emerald-500 shadow-sm' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => onTabChange('insights')}
            >
              인사이트
            </button>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-end gap-1.5 flex-1 min-w-0">
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-emerald-400 transition-all hidden sm:block"
              title="테마 변경"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-emerald-400 transition-all disabled:opacity-50"
              title="데이터 새로고침"
              disabled={isRefreshing}
            >
              <RefreshCw size={18} className={isRefreshing ? "animate-spin text-emerald-400" : ""} />
            </button>
            <div className="w-px h-4 bg-[var(--border)] mx-1 md:mx-2" />
            <UserDropdown personas={personas} activeId={activeId} onSelect={onSelect} />
          </div>
        </div>
      </div>
    </header>
  );
}

// 아바타 글로우 클래스 매핑
const AVATAR_GLOW = {
  'MIO-USER-SYJ': 'avatar-glow-orange',
  'MIO-USER-KJY': 'avatar-glow-blue',
  'MIO-USER-HYJ': 'avatar-glow-emerald',
  'MIO-USER-PMS': 'avatar-glow-purple',
};

/**
 * Persona Info Bar — 글래스모피즘 프로필 카드
 */
function PersonaInfoBar({ portfolio, metrics }) {
  const avatarGrad  = AVATAR_STYLES[portfolio.portfolio_id] || 'from-gray-400 to-gray-600';
  const avatarGlow  = AVATAR_GLOW[portfolio.portfolio_id] || '';
  const isUp        = metrics.total_return_pct >= 0;
  const returnColor = isUp ? '#ef4444' : '#3b82f6';
  const returnSign  = metrics.total_return_pct > 0 ? '+' : '';
  const gainKRW     = metrics.total_value_krw - metrics.total_cost_krw;

  return (
    <div className="glass-card p-5 mb-6 animate-fade-in relative overflow-hidden">

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">

        {/* ── 좌: 핵심 수치 ── */}
        <div>
          <p className="text-[11px] text-[var(--text-muted)] tracking-widest uppercase mb-1">
            총 수익률
          </p>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span
              className="text-4xl md:text-5xl font-extrabold tracking-tighter leading-none"
              style={{ color: returnColor }}
            >
              {returnSign}{metrics.total_return_pct.toFixed(2)}%
            </span>
            {metrics.flags?.length > 0 && (
              <span className="badge-yellow text-xs">⚠ {metrics.flags.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-sm flex-wrap">
            <span className="font-semibold" style={{ color: returnColor }}>
              {gainKRW >= 0 ? '+' : ''}{formatKRW(Math.abs(gainKRW))}
            </span>
            <span className="text-[var(--text-muted)] opacity-40">·</span>
            <span className="text-[var(--text-muted)]">
              총 자산&nbsp;
              <span className="font-semibold text-[var(--text-secondary)]">
                {formatKRW(metrics.total_value_krw)}
              </span>
            </span>
          </div>
        </div>

        {/* ── 우: 프로필 ── */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* 텍스트 */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-1.5">
              <span className="text-xs text-[var(--text-muted)]">{portfolio.age_group}</span>
              <span className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {portfolio.owner_name}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold
                             text-emerald-400 bg-emerald-500/10 border border-emerald-500/20
                             px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {portfolio.style}
            </span>
          </div>

          {/* 아바타 */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarGrad}
                          flex items-center justify-center text-white font-black text-xl
                          shadow-md ${avatarGlow}`}
            >
              {portfolio.owner_name[0]}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400
                            border-2 border-[var(--bg-card)] shadow" />
          </div>
        </div>

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
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Theme logic
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
    }
  }, [isDark]);
  
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
  
  // Module D: Generate insights (Gemini AI 실호출 — Skills-D §7)
  const [insights, setInsights] = useState([]);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);

  useEffect(() => {
    setIsInsightsLoading(true);
    setInsights(generateInsights(metrics, normalized)); // 즉시 룰 기반으로 먼저 표시
    generateInsightsWithAI(metrics, normalized)
      .then(cards => {
        setInsights(cards);
        setIsInsightsLoading(false);
      })
      .catch(() => {
        setIsInsightsLoading(false);
      });
  }, [activeId, refreshKey]);
  
  const scrollToSection = (sectionId) => {
    setActiveTab(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      // scroll to element considering sticky header offset
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    // Simulate network latency (0.8s ~ 1.5s)
    const delay = Math.floor(Math.random() * 700) + 800;
    
    setTimeout(() => {
      setRefreshKey(k => k + 1);
      setLastRefreshed(new Date().toISOString());
      setIsRefreshing(false);
    }, delay);
  }, [isRefreshing]);
  
  return (
    <div className="min-h-screen transition-colors">
      {/* Header with persona switcher */}
      <Header
        personas={portfolios}
        activeId={activeId}
        onSelect={setActiveId}
        onRefresh={handleRefresh}
        isDark={isDark}
        toggleDark={() => setIsDark(!isDark)}
        isRefreshing={isRefreshing}
        activeTab={activeTab}
        onTabChange={scrollToSection}
      />
      
      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Persona info bar */}
        <PersonaInfoBar portfolio={normalized} metrics={metrics} />
        
        {/* Dashboard Content */}
        <div className="animate-fade-in space-y-8">
          
          {/* Section 1: Overview */}
          <section id="section-overview" className="space-y-4 scroll-mt-24">
            <V1BalanceHub
              metrics={metrics}
              normalizedPortfolio={normalized}
              accountGroups={accountGroups}
            />
            <V2KPICards metrics={metrics} />
          </section>

          {/* Section 2: Portfolio */}
          <section id="section-portfolio" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">포트폴리오 심층 분석</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 items-start">
              <V3AllocationChart metrics={metrics} />
              <V6Treemap metrics={metrics} />
            </div>
          </section>

          {/* Section 3: Performance & Insights */}
          <section id="section-insights" className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">수익률 추이 및 AI 분석</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 items-start">
              <V4Timeline metrics={metrics} />
              <div className="flex flex-col gap-4">
                <V5AIHealth metrics={metrics} isLoading={isInsightsLoading} />
                <V5InsightFeed insights={insights} isLoading={isInsightsLoading} />
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className="mt-12 pb-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Maxi-Sight · MaxItOut Team · 데이터 기준: {new Date(lastRefreshed || normalized.generated_at).toLocaleString('ko-KR', {
              year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
            })} ·
            환율 ₩{normalized.exchange_rate_usd_krw.toLocaleString()}/USD
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            본 서비스는 투자 정보 제공 목적이며, 투자 권유가 아닙니다.
          </p>
        </footer>
      </main>
    </div>
  );
}
