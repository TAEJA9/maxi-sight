import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { ACCOUNT_TYPES, ASSET_CLASSES, formatKRW, formatUSD, formatPct } from '../modules/moduleA.js';
import { AccountBadge, SectionHeader } from './shared.jsx';

/**
 * V1 — 종합 잔고 허브 (Skills-C §V1)
 * Shows total portfolio value with KRW/USD, account accordion
 */
export function V1BalanceHub({ metrics, normalizedPortfolio, accountGroups }) {
  const [expandedAccounts, setExpandedAccounts] = useState(new Set(['04']));
  
  const totalValue = metrics.total_value_krw;
  const totalCost = metrics.total_cost_krw;
  const totalGain = totalValue - totalCost;
  const totalReturn = metrics.total_return_pct;
  const exchangeRate = normalizedPortfolio.exchange_rate_usd_krw;
  
  const toggleAccount = (code) => {
    setExpandedAccounts(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };
  
  return (
    <div className="glass-card p-6 animate-fade-in-up">
      {/* Total Value Header */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 mb-1 tracking-wider uppercase">총 자산</p>
        <div className="flex items-end gap-3 flex-wrap">
          <span className="text-4xl font-bold text-white tracking-tight">
            {formatKRW(totalValue)}
          </span>
          <span className="text-lg text-gray-500 mb-0.5">
            {formatUSD(totalValue, exchangeRate)}
          </span>
        </div>
        
        {/* Return Summary */}
        <div className="flex items-center gap-3 mt-2">
          <div className={`flex items-center gap-1 text-sm font-semibold ${totalGain >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
            {totalGain >= 0
              ? <TrendingUp size={15} />
              : <TrendingDown size={15} />
            }
            {totalGain >= 0 ? '+' : ''}{formatKRW(Math.abs(totalGain))}
          </div>
          <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
            totalReturn >= 0
              ? 'bg-red-500/10 text-red-400'
              : 'bg-blue-500/10 text-blue-400'
          }`}>
            {formatPct(totalReturn)}
          </span>
        </div>
        
        {/* Reference date */}
        <p className="text-xs text-gray-600 mt-2">
          기준일: {new Date(normalizedPortfolio.generated_at).toLocaleDateString('ko-KR')}
        </p>
      </div>
      
      {/* Divider */}
      <div className="h-px bg-white/5 mb-4" />
      
      {/* Account Groups Accordion */}
      <div>
        <SectionHeader title="계좌별 현황" />
        <div className="space-y-2">
          {accountGroups.map(group => {
            const isExpanded = expandedAccounts.has(group.code);
            const groupReturn = group.total_cost > 0
              ? ((group.total_value - group.total_cost) / group.total_cost) * 100
              : 0;
            const isUSD = ['04', '07'].includes(group.code);
            
            return (
              <div key={group.code} className="rounded-xl overflow-hidden border border-white/5">
                {/* Account Header */}
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-white/4 transition-colors"
                  onClick={() => toggleAccount(group.code)}
                >
                  <div className="flex items-center gap-2">
                    <AccountBadge
                      code={group.code}
                      label={group.label}
                      taxDeferred={group.taxDeferred}
                    />
                    {group.code === '07' && (
                      <span className="badge-purple text-xs">24H</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatKRW(group.total_value)}</p>
                      {isUSD && (
                        <p className="text-xs text-gray-500">{formatUSD(group.total_value, exchangeRate)}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                      groupReturn >= 0 ? 'text-red-400 bg-red-500/10' : 'text-blue-400 bg-blue-500/10'
                    }`}>
                      {formatPct(groupReturn)}
                    </span>
                    {isExpanded
                      ? <ChevronUp size={14} className="text-gray-500" />
                      : <ChevronDown size={14} className="text-gray-500" />
                    }
                  </div>
                </button>
                
                {/* Holdings List */}
                {isExpanded && (
                  <div className="bg-black/20 px-3 pb-3 animate-fade-in">
                    {group.holdings.map(h => {
                      const hReturn = h.cost_krw > 0
                        ? ((h.current_krw - h.cost_krw) / h.cost_krw) * 100
                        : 0;
                      const assetInfo = ASSET_CLASSES[h.asset_class];
                      
                      return (
                        <div key={h.id} className="holding-row flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: assetInfo?.color ?? '#666' }}
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-200 truncate">{h.name}</p>
                              <p className="text-xs text-gray-600">{h.ticker} · {h.qty}주</p>
                            </div>
                          </div>
                          
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-sm font-semibold text-white">
                              {formatKRW(h.total_current_krw)}
                            </p>
                            <p className={`text-xs font-medium ${hReturn >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                              {formatPct(hReturn)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
