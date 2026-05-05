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
 * D-03: Sharpe > 1.5 → 기회 신호
 */
function triggerD03(metrics) {
  if (!metrics.sharpe_ratio || metrics.sharpe_ratio <= 1.5) return null;
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
 * D-07: 장기 미매매 (항상 트리거 — 데이터 기준일로부터 90일 가정)
 */
function triggerD07() {
  return {
    trigger_id: 'D-07',
    type: '정보 알림',
    title: '포트폴리오를 점검할 때가 됐어요',
    body: '정기적인 포트폴리오 점검은 안정적인 투자의 기본이에요. 자산 배분 비율과 수익률을 한번 살펴보는 건 어떨까요?',
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
    triggerD03(metrics),
    triggerD04(metrics),
    triggerD05(metrics),
    triggerD06(metrics),
    triggerD09(metrics, ownerName, normalizedPortfolio.holdings),
    triggerTaxPraise(ownerName, normalizedPortfolio),
    triggerD07(), // Always include as background info
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
  
  // Add timestamps
  return insights.map((ins, i) => ({
    ...ins,
    generated_at: new Date(Date.now() - i * 60000 * 15).toISOString(),
    source: 'Gemini AI',
  }));
}
