import React from 'react';
import { INSIGHT_COLORS, formatInsightTime } from '../modules/moduleE.js';
import { SectionHeader } from './shared.jsx';
import { Zap } from 'lucide-react';

const PRIORITY_LABEL = {
  HIGH:   { label: '긴급', cls: 'text-red-400 bg-red-500/10' },
  MEDIUM: { label: '주의', cls: 'text-yellow-400 bg-yellow-500/10' },
  LOW:    { label: '참고', cls: 'text-gray-400 bg-gray-600/10'  },
};

/**
 * Single insight card
 */
function InsightCard({ insight, delay = 0 }) {
  const colors = INSIGHT_COLORS[insight.color] ?? INSIGHT_COLORS.info;
  const priority = PRIORITY_LABEL[insight.priority] ?? PRIORITY_LABEL.LOW;
  
  return (
    <div
      className={`rounded-2xl border p-4 ${colors.border} ${colors.bg} animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{insight.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{insight.title}</span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${priority.cls}`}>
                {priority.label}
              </span>
            </div>
            <span className={`text-xs ${colors.label} font-medium`}>{insight.type}</span>
          </div>
        </div>
      </div>
      
      {/* Body */}
      <p className="text-sm text-[var(--text-primary)] leading-relaxed pl-7">{insight.body}</p>
      
      {/* Footer */}
      <div className="flex items-center gap-1.5 mt-3 pl-7">
        <Zap size={10} className="text-[var(--text-muted)]" />
        <span className="text-xs text-[var(--text-muted)]">
          {formatInsightTime(insight.generated_at)} · {insight.source}
        </span>
      </div>
    </div>
  );
}

/**
 * V5 — AI 인사이트 피드 (Skills-C §V5 / Skills-D)
 */
export function V5InsightFeed({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="glass-card p-6 animate-fade-in-up">
        <SectionHeader title="AI 인사이트 피드" />
        <div className="text-center py-8">
          <div className="text-4xl mb-3">👍</div>
          <p className="text-[var(--text-muted)] text-sm">현재 특이 신호가 없어요. 안정적으로 유지되고 있어요</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-card p-6 animate-fade-in-up">
      <SectionHeader
        title="AI 인사이트 피드"
        subtitle={`${insights.length}개의 인사이트`}
      >
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>실시간 분석</span>
        </div>
      </SectionHeader>
      
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <InsightCard
            key={insight.trigger_id}
            insight={insight}
            delay={idx * 80}
          />
        ))}
      </div>
    </div>
  );
}
