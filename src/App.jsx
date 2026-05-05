import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Layers, RefreshCw, Activity, Sun, Moon, User } from 'lucide-react';

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
function Header({ personas, activeId, onSelect, onRefresh, isDark, toggleDark, isRefreshing }) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border)] transition-colors">
      <div className="max-w-[1400px] mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <Activity size={16} className="text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold gradient-text tracking-tight">Maxi-Sight</span>
              <span className="text-xs text-[var(--text-muted)] hidden sm:inline">by MaxItOut</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={toggleDark}
              className="p-2 rounded-xl hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-emerald-400 transition-all"
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
            <div className="w-px h-4 bg-[var(--border)] mx-2" />
            <UserDropdown personas={personas} activeId={activeId} onSelect={onSelect} />
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
  const avatarGrad = AVATAR_STYLES[portfolio.portfolio_id] || 'from-gray-400 to-gray-600';
  
  const returnColor = metrics.total_return_pct >= 0 ? 'text-red-500' : 'text-blue-500';
  const returnSign = metrics.total_return_pct > 0 ? '+' : '';
  
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-fade-in">
      {/* Primary: Return Rate */}
      <div>
        <h2 className="text-sm font-medium text-[var(--text-muted)] mb-1">내 포트폴리오 총 수익률</h2>
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl md:text-6xl font-extrabold tracking-tighter ${returnColor}`}>
            {returnSign}{metrics.total_return_pct.toFixed(2)}%
          </span>
          {metrics.flags?.length > 0 && (
            <span className="badge-yellow text-xs transform -translate-y-2">
              ⚠ {metrics.flags.length}개 경고
            </span>
          )}
        </div>
      </div>
      
      {/* Secondary: Persona Info */}
      <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-3 shadow-sm">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-bold text-lg shadow-inner`}>
          {portfolio.owner_name[0]}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[var(--text-primary)] leading-tight">{portfolio.owner_name}</span>
            <span className="text-xs text-[var(--text-muted)]">{portfolio.age_group}</span>
          </div>
          <div className="mt-0.5">
            <span className="text-xs font-medium text-emerald-500">{portfolio.style}</span>
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Theme logic
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

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
  
  // Module D: Generate insights
  const insights = useMemo(
    () => generateInsights(metrics, normalized),
    [metrics, normalized]
  );
  
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
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors">
      {/* Header with persona switcher */}
      <Header
        personas={portfolios}
        activeId={activeId}
        onSelect={setActiveId}
        onRefresh={handleRefresh}
        isDark={isDark}
        toggleDark={() => setIsDark(!isDark)}
        isRefreshing={isRefreshing}
      />
      
      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Persona info bar */}
        <PersonaInfoBar portfolio={normalized} metrics={metrics} />
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          {/* Main Left: V1 + V4 */}
          <div className="space-y-5">
            <V1BalanceHub
              metrics={metrics}
              normalizedPortfolio={normalized}
              accountGroups={accountGroups}
            />
            
            <V2KPICards metrics={metrics} />
            
            <V4Timeline metrics={metrics} />
          </div>
          
          {/* Main Right: V5 + V3 */}
          <div className="space-y-5">
            <V5InsightFeed insights={insights} />
            
            <V3AllocationChart metrics={metrics} />
          </div>
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
