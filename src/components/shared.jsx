import React, { useState, useRef, useEffect } from 'react';
import { EASY_GUIDE } from '../modules/moduleE.js';
import { HelpCircle } from 'lucide-react';

/**
 * EasyGuide tooltip component (Skills-C §3 / Skills-E §2)
 * Shows on hover (PC) / tap (mobile)
 */
export function EasyGuide({ term, className = '' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const guide = EASY_GUIDE[term];
  
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  
  if (!guide) return null;
  
  return (
    <span
      ref={ref}
      className={`relative inline-flex items-center cursor-pointer ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(v => !v)}
    >
      <HelpCircle size={13} className="text-[var(--text-muted)] hover:text-emerald-400 transition-colors" />
      
      {visible && (
        <div className="easy-guide-popup bottom-full left-0 mb-2 w-64">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-400">{guide.term}</span>
            {guide.alias && (
              <span className="badge-emerald text-xs">{guide.alias}</span>
            )}
          </div>
          <p className="text-xs text-[var(--text-primary)] leading-relaxed">{guide.desc}</p>
          {guide.sub && (
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{guide.sub}</p>
          )}
        </div>
      )}
    </span>
  );
}

/**
 * Stat badge (positive / negative / neutral)
 */
export function StatBadge({ value, suffix = '%', className = '' }) {
  const isUp = value > 0;
  const isDown = value < 0;
  
  const colorClass = isUp
    ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : isDown
    ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    : 'text-gray-400 bg-gray-600/10 border-gray-600/20';
  
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass} ${className}`}>
      {isUp ? '+' : ''}{value?.toFixed(2)}{suffix}
    </span>
  );
}

/**
 * Loading skeleton (Skills-C §5)
 */
export function SkeletonCard({ height = 'h-32', className = '' }) {
  return (
    <div className={`glass-card p-5 ${className} ${height}`}>
      <div className="skeleton h-4 w-24 mb-3 rounded" />
      <div className="skeleton h-8 w-36 mb-2 rounded" />
      <div className="skeleton h-3 w-48 rounded" />
    </div>
  );
}

/**
 * Section header with optional subtitle
 */
export function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/**
 * Period selector tabs for V4 chart
 */
export function PeriodSelector({ periods, active, onChange }) {
  return (
    <div className="flex gap-1 bg-[var(--border)] rounded-full p-1">
      {periods.map(p => (
        <button
          key={p}
          className={`period-btn ${active === p ? 'active' : ''}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

/**
 * Account type badge
 */
export function AccountBadge({ code, label, taxDeferred }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--border)] px-1.5 py-0.5 rounded">
        {code}
      </span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      {taxDeferred && (
        <span className="text-xs text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded-full border border-indigo-400/20">
          🔒 과세이연
        </span>
      )}
    </div>
  );
}
