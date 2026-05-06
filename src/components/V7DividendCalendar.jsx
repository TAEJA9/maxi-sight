import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { SectionHeader } from './shared.jsx';

// 숫자 포맷
const formatCurrency = (val) => val.toLocaleString('ko-KR') + '원';

// 커스텀 툴팁
function DividendTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] p-3 rounded-xl shadow-lg backdrop-blur-md">
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{label} 예상 배당금</p>
        <p className="text-lg font-bold text-emerald-400">{formatCurrency(val)}</p>
      </div>
    );
  }
  return null;
}

export function V7DividendCalendar({ metrics }) {
  const [activeTab, setActiveTab] = useState('thisMonth');
  
  if (!metrics || !metrics.dividend) return null;
  const { monthly_schedule, upcoming_schedule } = metrics.dividend;
  
  // 현재 월 하이라이트를 위한 로직
  const today = new Date();
  const currentMonthIndex = today.getMonth(); // 0-based

  const scheduleList = upcoming_schedule[activeTab] || [];

  return (
    <div className="glass-card p-5 animate-fade-in-up">
      <SectionHeader 
        title="배당 캘린더" 
        subtitle="월별 예상 배당금 및 지급 일정" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 mt-4">
        
        {/* 1. 월별 배당 수령 예정 막대 차트 */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">월별 수령 예정액</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly_schedule} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  hide={true} 
                  domain={[0, 'dataMax + 10000']} 
                />
                <Tooltip 
                  content={<DividendTooltip />} 
                  cursor={{ fill: 'var(--bg-card-hover)', opacity: 0.4 }} 
                />
                <Bar 
                  dataKey="amount" 
                  radius={[4, 4, 4, 4]} 
                  animationDuration={1500}
                >
                  {monthly_schedule.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === currentMonthIndex ? '#34d399' : 'var(--border)'} 
                      className="transition-colors duration-300"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. 종목별 배당 지급 일정 리스트 */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">지급 일정</h3>
            <div className="flex bg-[var(--bg-secondary)] p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('thisMonth')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'thisMonth' 
                    ? 'bg-[var(--bg-card)] text-emerald-400 shadow' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                이번 달
              </button>
              <button
                onClick={() => setActiveTab('nextMonth')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'nextMonth' 
                    ? 'bg-[var(--bg-card)] text-emerald-400 shadow' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                다음 달
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {scheduleList.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)] pb-4">
                예정된 배당이 없어요
              </div>
            ) : (
              scheduleList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors">
                  <div className="flex flex-col overflow-hidden mr-3">
                    <span className="text-sm font-bold text-[var(--text-primary)] truncate">{item.name}</span>
                    <span className="text-[11px] text-[var(--text-muted)] mt-0.5">배당락: {item.exDate}</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-400 whitespace-nowrap">
                    +{formatCurrency(item.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
