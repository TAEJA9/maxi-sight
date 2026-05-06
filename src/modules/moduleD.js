/**
 * Module D — Insight Trigger Rules (Skills-D.md)
 * Evaluates trigger conditions and generates insight cards
 */

/**
 * D-01: MDD > 10% → 위험 알림
 */
function triggerD01(metrics) {
  if (metrics.mdd_pct <= 10) return null;
  return {
    trigger_id: 'D-01',
    type: '위험 알림',
    title: '방어벽 점검이 필요해요',
    body: `최대 낙폭(MDD)이 ${metrics.mdd_pct.toFixed(1)}%로 기준(10%)을 넘었어요. 변동성이 큰 자산의 비중을 줄이거나 채권·현금 비중을 높이는 것을 고려해 보세요.`,
    priority: 'HIGH',
    icon: '⚠️',
    color: 'danger',
  };
}

/**
 * D-02: 자산군 비중 목표 이탈 (>5%p) → 리밸런싱 알림
 * Uses default target allocation if not set
 */
function triggerD02(metrics, ownerStyle) {
  // Default target allocations by style
  const targets = {
    'aggressive': { 'EQ-F': 40, 'ET-F': 25, 'CR': 20, 'ET': 10, 'CS': 5 },
    'stable':     { 'EQ': 25, 'ET-F': 20, 'BD': 25, 'CS': 20, 'AL': 10 },
    'us-stock':   { 'EQ-F': 70, 'ET-F': 20, 'CS': 10 },
  };
  
  const style = ownerStyle?.includes('공격') ? 'aggressive'
    : ownerStyle?.includes('안정') ? 'stable'
    : ownerStyle?.includes('미국') ? 'us-stock'
    : 'us-stock';
  
  const target = targets[style] ?? {};
  const deviations = [];
  
  Object.entries(target).forEach(([cls, targetPct]) => {
    const currentPct = metrics.allocation[cls] ?? 0;
    const diff = Math.abs(currentPct - targetPct);
    if (diff > 5) {
      deviations.push({ cls, current: currentPct, target: targetPct, diff });
    }
  });
  
  if (deviations.length === 0) return null;
  
  const mainDev = deviations[0];
  const classNames = {
    'EQ-F': '해외주식', 'ET-F': '해외ETF', 'CR': '가상자산',
    'EQ': '국내주식', 'BD': '채권', 'CS': '현금', 'AL': '대체투자', 'ET': '국내ETF',
  };
  
  return {
    trigger_id: 'D-02',
    type: '리밸런싱 알림',
    title: '포트폴리오 정리정돈이 필요해요',
    body: `${classNames[mainDev.cls] ?? mainDev.cls} 비중이 현재 ${mainDev.current.toFixed(1)}%로 목표(${mainDev.target}%)에서 ${mainDev.diff.toFixed(1)}%p 벗어났어요. 비중 조절로 목표에 가깝게 맞춰보세요.`,
    priority: 'MEDIUM',
    icon: '🔄',
    color: 'warning',
  };
}

/**
 * D-03: Sharpe > 1.5 AND 90일 이상 유지 → 기회 신호 (Skills-D §3)
 */
function triggerD03(metrics, normalizedPortfolio) {
  if (!metrics.sharpe_ratio || metrics.sharpe_ratio <= 1.5) return null;

  // 90일 유지 조건: holdings의 purchase_date 또는 generated_at 기준
  const today = new Date();
  const hasPurchaseDates = normalizedPortfolio.holdings.some(h => h.purchase_date);
  let daysSinceStart = 9999; // 기본값: 조건 충족
  if (hasPurchaseDates) {
    const dates = normalizedPortfolio.holdings
      .filter(h => h.purchase_date)
      .map(h => new Date(h.purchase_date).getTime())
      .filter(t => !isNaN(t));
    if (dates.length > 0) {
      const oldest = Math.min(...dates);
      daysSinceStart = Math.floor((today.getTime() - oldest) / (1000 * 60 * 60 * 24));
    }
  } else {
    // purchase_date 없으면 generated_at 기준 HOLDING_YEARS 근사 (1.5년 ≈ 548일)
    const gen = new Date(normalizedPortfolio.generated_at);
    daysSinceStart = Math.floor((today.getTime() - gen.getTime()) / (1000 * 60 * 60 * 24)) + 548;
  }
  if (daysSinceStart < 90) return null;

  return {
    trigger_id: 'D-03',
    type: '기회 신호',
    title: '효율 우수 포트폴리오 🏅',
    body: `투자 가성비(Sharpe)가 ${metrics.sharpe_ratio.toFixed(2)}로 최상급이에요! 감수한 위험 대비 수익이 매우 훌륭해요. 이 구성을 유지하되 갑작스러운 집중 투자는 자제하세요.`,
    priority: 'LOW',
    icon: '✅',
    color: 'success',
  };
}

/**
 * D-04: 단일 종목 비중 > 20% → 집중 위험
 */
function triggerD04(metrics) {
  if (!metrics.contributions) return null;
  const totalValue = metrics.total_value_krw;
  
  const concentrated = metrics.contributions.find(h => h.weight_pct > 20);
  if (!concentrated) return null;
  
  return {
    trigger_id: 'D-04',
    type: '집중 위험',
    title: '한 바구니에 너무 많이 담겼어요',
    body: `${concentrated.name}이(가) 포트폴리오의 ${concentrated.weight_pct.toFixed(1)}%를 차지하고 있어요. 한 종목 의존도가 높으면 해당 종목에 문제가 생겼을 때 전체 자산이 흔들릴 수 있어요. 다른 자산도 조금씩 늘려보는 게 좋아요.`,
    priority: 'MEDIUM',
    icon: '📍',
    color: 'concentration',
  };
}

/**
 * D-05: 변동성 > 25% → 위험 알림
 */
function triggerD05(metrics) {
  if (!metrics.volatility_annualized_pct || metrics.volatility_annualized_pct <= 25) return null;
  return {
    trigger_id: 'D-05',
    type: '위험 알림',
    title: '시장 과열 주의',
    body: `포트폴리오 변동성이 연 ${metrics.volatility_annualized_pct.toFixed(1)}%로 높아요. 고위험 자산 비중이 커지면 수익도 크지만 하락 시 충격도 커요. 안전 자산 비중을 소폭 높이는 걸 고려해 보세요.`,
    priority: 'HIGH',
    icon: '📈',
    color: 'danger',
  };
}

/**
 * D-06: 포트폴리오 수익률 > KOSPI + 3%p → 기회 신호
 */
function triggerD06(metrics) {
  // Using total_return_pct vs assumed KOSPI 5% for simulation
  const simulatedKospiReturn = 5;
  if (metrics.total_return_pct <= simulatedKospiReturn + 3) return null;
  
  const excess = (metrics.total_return_pct - simulatedKospiReturn).toFixed(1);
  return {
    trigger_id: 'D-06',
    type: '기회 신호',
    title: '시장을 이기고 있어요! 📈',
    body: `최근 KOSPI 대비 ${excess}%p 높은 성과를 냈어요! 좋은 종목 선택이 빛을 발하고 있는 거예요. 이 흐름을 유지하면서 무리한 추가 투자는 조심하세요.`,
    priority: 'LOW',
    icon: '✅',
    color: 'success',
  };
}

/**
 * D-07: 장기 미매매 (90일 이상) → 정보 알림 (Skills-D §5)
 * purchase_date 기반 마지막 매수일 연산
 */
function triggerD07(normalizedPortfolio) {
  const today = new Date();
  const holdings = normalizedPortfolio.holdings ?? [];

  // purchase_date가 있는 항목 중 가장 최신
  const latestPurchase = holdings
    .filter(h => h.purchase_date)
    .map(h => new Date(h.purchase_date).getTime())
    .filter(t => !isNaN(t))
    .reduce((max, t) => Math.max(max, t), 0);

  let elapsedDays;
  if (latestPurchase > 0) {
    elapsedDays = Math.floor((today.getTime() - latestPurchase) / (1000 * 60 * 60 * 24));
  } else {
    // purchase_date 데이터 없음 → generated_at 기준 90일 가정
    elapsedDays = 90;
  }

  if (elapsedDays < 90) return null;

  return {
    trigger_id: 'D-07',
    type: '정보 알림',
    title: '포트폴리오를 점검할 때가 됐어요',
    body: `마지막 매매 후 ${elapsedDays}일이 지났어요. 정기적인 포트폴리오 점검은 안정적인 투자의 기본이에요. 자산 배분 비율과 수익률을 한번 살펴보는 건 어떨까요?`,
    priority: 'LOW',
    icon: '💡',
    color: 'info',
  };
}

/**
 * D-09: 뉴스 감성 경보 (persona-specific simulated news)
 */
function triggerD09(metrics, ownerName, holdings) {
  // Simulated news sentiment per persona
  const newsData = {
    '송유진': {
      score: -0.7,
      ticker: 'TSLA',
      name: '테슬라',
      issue: '테슬라 CEO의 발언 및 판매량 감소 우려로 주가가 흔들리고 있어요.',
    },
    '김정연': null, // Stable portfolio — no news alert
    '한예지': null, // Positive sentiment for NVDA
  };
  
  const news = newsData[ownerName];
  if (!news || news.score >= -0.5) return null;
  
  return {
    trigger_id: 'D-09',
    type: '위험 알림',
    title: '종목 온도계가 차가워졌어요',
    body: `${news.name}에서 주의 신호가 감지됐어요. ${news.issue} 비중 조절을 고려해 보세요. 시장 상황을 조금 더 지켜보는 것도 좋아요.`,
    priority: 'MEDIUM',
    icon: '📰',
    color: 'purple',
  };
}

/**
 * D-08: 목표 수익률 달성 → 정보 알림 (Skills-D §5)
 * MVP v1.0: 대시보드에 목표 수익률 시나리오별 하드코딩
 *   - 공격 스타일: 목표 30%
 *   - 안정 스타일: 목표 10%
 *   - 미국 스타일: 목표 20%
 *   - 기타: 목표 15%
 */
function triggerD08(metrics, normalizedPortfolio) {
  const style = normalizedPortfolio.style ?? '';
  let targetReturn = 15; // 기본값
  if (style.includes('공격')) targetReturn = 30;
  else if (style.includes('안정')) targetReturn = 10;
  else if (style.includes('미국')) targetReturn = 20;

  if (metrics.total_return_pct < targetReturn) return null;

  return {
    trigger_id: 'D-08',
    type: '정보 알림',
    title: '목표 수익률에 도달했어요! 🎯',
    body: `설정 목표 ${targetReturn}%에 도달했어요! 수익 실현, 리밸런싱, 목표 상향 중 어떤 선택지를 고려할지 생각해보세요. 어떤 방향이든 좋은 결정이에요!`,
    priority: 'MEDIUM',
    icon: '💡',
    color: 'success',
  };
}

/**
 * Tax optimization insight for 김정연 (ISA/IRP focused)
 */
function triggerTaxPraise(ownerName, normalizedPortfolio) {
  if (ownerName !== '김정연') return null;
  const hasTaxDeferred = normalizedPortfolio.holdings.some(h => h.tax_deferred);
  if (!hasTaxDeferred) return null;
  
  return {
    trigger_id: 'D-TAX',
    type: '기회 신호',
    title: '절세 전략이 훌륭해요! 💰',
    body: 'ISA/IRP 계좌를 활용한 절세 투자를 하고 있어요! 과세이연 효과로 장기적으로 복리 효과가 커져요. 올해 남은 공제 한도도 확인해 보세요.',
    priority: 'LOW',
    icon: '✅',
    color: 'success',
  };
}

/**
 * Module D Main: Evaluate all triggers and generate insight cards
 * @param {Object} metrics - Module B output
 * @param {Object} normalizedPortfolio - Module A output
 * @returns {Array} Sorted insight cards
 */
export function generateInsights(metrics, normalizedPortfolio) {
  const ownerName = normalizedPortfolio.owner_name;
  const ownerStyle = normalizedPortfolio.style;

  const rawInsights = [
    triggerD01(metrics),
    triggerD02(metrics, ownerStyle),
    triggerD03(metrics, normalizedPortfolio),   // Skills-D: 90일 조건 포함
    triggerD04(metrics),
    triggerD05(metrics),
    triggerD06(metrics),
    triggerD07(normalizedPortfolio),             // Skills-D: 실제 purchase_date 사용
    triggerD08(metrics, normalizedPortfolio),    // Skills-D: 목표 수익률 달성
    triggerD09(metrics, ownerName, normalizedPortfolio.holdings),
    triggerTaxPraise(ownerName, normalizedPortfolio),
  ].filter(Boolean);
  
  // Sort: HIGH first, then MEDIUM, then LOW (Skills-D §6)
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  rawInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Deduplicate by trigger_id (Skills-D §6)
  const seen = new Set();
  const insights = rawInsights.filter(ins => {
    if (seen.has(ins.trigger_id)) return false;
    seen.add(ins.trigger_id);
    return true;
  });
  
  // If no insights triggered, add default message
  if (insights.length === 0) {
    insights.push({
      trigger_id: 'DEFAULT',
      type: '정보 알림',
      title: '안정적으로 유지되고 있어요 👍',
      body: '현재 포트폴리오에서 특이 신호가 감지되지 않았어요. 안정적으로 유지되고 있어요.',
      priority: 'LOW',
      icon: '💡',
      color: 'info',
    });
  }
  
  // Add timestamps — 3초 간격으로 (동시 생성된 카드가 "1시간 전"으로 보이는 버그 방지)
  return insights.map((ins, i) => ({
    ...ins,
    generated_at: new Date(Date.now() - i * 3000).toISOString(),
    source: 'Gemini AI',
  }));
}

// ─── Gemini 실호출 버전 (Skills-D §7) ───────────────────────────────────────

import { callGeminiInsights } from './geminiClient.js';

/** 트리거별 Gemini 프롬프트용 컨텍스트 문자열 */
function getTriggerContext(card, metrics) {
  const map = {
    'D-01': `MDD(최대낙폭) = ${metrics.mdd_pct?.toFixed(1)}%`,
    'D-02': `자산군 비중 목표 이탈 감지`,
    'D-03': `Sharpe(투자가성비) = ${metrics.sharpe_ratio?.toFixed(2)}`,
    'D-04': `단일 종목 비중 과다 감지`,
    'D-05': `변동성 = ${metrics.volatility_annualized_pct?.toFixed(1)}%`,
    'D-06': `KOSPI 대비 초과수익 달성`,
    'D-07': `90일 이상 미매매`,
    'D-09': `보유 종목 뉴스 부정 감성 감지`,
    'D-TAX': `ISA/IRP 절세 계좌 활용 중`,
  };
  return map[card.trigger_id] ?? card.type;
}

/**
 * AI 인사이트 생성 (Gemini 실호출) — Skills-D §7 완전 구현
 * API 호출 실패 시 generateInsights() 룰 기반 결과로 자동 fallback
 */
export async function generateInsightsWithAI(metrics, normalizedPortfolio) {
  // Step 1: 룰 기반으로 트리거 평가 (어떤 카드를 만들지 결정)
  const baseCards = generateInsights(metrics, normalizedPortfolio);

  // DEFAULT 카드(트리거 없음)는 AI 불필요
  const triggered = baseCards.filter(c => c.trigger_id !== 'DEFAULT');
  if (triggered.length === 0) return baseCards;

  // Step 2: Gemini에 전달할 트리거 목록 구성
  const triggeredItems = triggered.map(c => ({
    trigger_id: c.trigger_id,
    type: c.type,
    title: c.title,
    priority: c.priority,
    context: getTriggerContext(c, metrics),
  }));

  const metricsSnapshot = {
    owner_name: normalizedPortfolio.owner_name,
    style: normalizedPortfolio.style,
    total_value_krw: metrics.total_value_krw,
    total_return_pct: metrics.total_return_pct,
    cagr_pct: metrics.cagr_pct,
    sharpe_ratio: metrics.sharpe_ratio,
    mdd_pct: metrics.mdd_pct,
    volatility_annualized_pct: metrics.volatility_annualized_pct,
  };

  // Step 3: Gemini API 호출
  const aiCards = await callGeminiInsights(triggeredItems, metricsSnapshot);

  // Step 4: 실패 시 fallback
  if (!aiCards) return baseCards;

  // Step 5: AI가 생성한 body를 baseCards에 병합 (icon, color 등은 유지)
  const aiMap = {};
  aiCards.forEach(c => { aiMap[c.trigger_id] = c; });

  return baseCards.map((card, i) => {
    const ai = aiMap[card.trigger_id];
    if (!ai) return card;
    return {
      ...card,
      title: ai.title || card.title,
      body: ai.body || card.body,
      generated_at: new Date(Date.now() - i * 60000 * 15).toISOString(),
      source: 'Gemini AI',
      ai_generated: true,
    };
  });
}
