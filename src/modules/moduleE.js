/**
 * Module E — Natural Language Translation (Skills-E.md)
 * Translates financial metrics into plain Korean for non-expert users
 */

/**
 * CAGR translation (Skills-E §1)
 */
export function translateCAGR(cagrPct, isSimple = false) {
  if (isSimple) return '아직 성장 속도를 측정하기엔 기간이 짧아요';
  if (cagrPct == null) return '아직 성장 속도를 측정하기엔 기간이 짧아요';
  if (cagrPct >= 15) return '내 돈이 빠르게 자라고 있어요! 🚀';
  if (cagrPct >= 10) return '꾸준히 잘 성장하고 있어요 📈';
  if (cagrPct >= 7)  return '안정적인 성장 속도예요';
  if (cagrPct >= 3)  return '성장은 하고 있지만, 속도를 높여볼 수 있어요';
  if (cagrPct >= 0)  return '거의 제자리예요. 전략 점검을 추천해요';
  return '원금이 줄고 있어요. 점검이 필요해요 ⚠️';
}

/**
 * Sharpe Ratio translation (Skills-E §1)
 */
export function translateSharpe(sharpe) {
  if (sharpe == null) return '변동성 데이터 부족으로 계산할 수 없어요';
  if (sharpe > 1.5)  return '위험 대비 수익이 탁월해요! 최상급 효율이에요 🏅';
  if (sharpe > 1.0)  return '효율 좋은 투자 중이에요! 유지하세요';
  if (sharpe > 0.5)  return '괜찮은 투자를 하고 있어요';
  if (sharpe > 0)    return '위험 대비 수익이 아직 아쉬워요';
  return '감수하는 위험만큼 수익이 나오지 않고 있어요';
}

/**
 * MDD translation (Skills-E §1)
 */
export function translateMDD(mdd) {
  if (mdd == null) return '—';
  if (mdd < 5)   return '방어력이 튼튼해요 🛡️';
  if (mdd < 10)  return '약간의 출렁임이 있어요, 주시하세요';
  if (mdd < 15)  return '제법 흔들렸어요. 리스크 점검을 추천해요';
  if (mdd < 25)  return '큰 하락을 경험했어요 — 리스크 점검이 필요해요';
  return '심각한 낙폭이에요. 포트폴리오 재검토를 권장해요 🚨';
}

/**
 * EasyGuide popup definitions for financial terms (Skills-E §2)
 */
export const EASY_GUIDE = {
  'CAGR': {
    term: 'CAGR',
    alias: '성장 스피드계',
    desc: '내 돈이 1년에 평균 몇 % 자랐는지 — 성장 스피드계',
    sub: '복리로 계산하기 때문에 단순 수익률보다 정확해요',
  },
  'Sharpe': {
    term: 'Sharpe Ratio',
    alias: '투자 가성비',
    desc: '위험을 감수하고 수익을 얼마나 잘 챙겼는지 — 투자 가성비',
    sub: '높을수록 같은 위험으로 더 많이 벌었다는 뜻이에요',
  },
  'MDD': {
    term: 'MDD',
    alias: '내구도 테스트',
    desc: '가장 많이 떨어졌을 때 얼마나 깨졌는지 — 내구도 테스트',
    sub: '낮을수록 하락장에서 잘 버틴다는 뜻이에요',
  },
  '변동성': {
    term: '변동성',
    alias: '스트레스 지수',
    desc: '내 자산이 얼마나 롤러코스터처럼 움직이는지 — 스트레스 지수',
    sub: '높을수록 가격이 크게 오르내린다는 뜻이에요',
  },
  '리밸런싱': {
    term: '리밸런싱',
    alias: '포트폴리오 정리정돈',
    desc: '흔들린 비중을 원래대로 되돌리는 포트폴리오 정리정돈',
    sub: '주기적으로 하면 위험을 일정하게 유지할 수 있어요',
  },
  '베타': {
    term: '베타',
    alias: '민감도',
    desc: '시장이 움직일 때 내 포트폴리오가 얼마나 따라 움직이는지 — 민감도',
    sub: '1이면 시장과 똑같이, 0.5면 절반만 움직여요',
  },
  'Sortino': {
    term: 'Sortino Ratio',
    alias: '하락장 맷집',
    desc: '하락장에서의 맷집 — 떨어질 때 얼마나 잘 버티는지',
    sub: '하락 구간의 변동성만 보기 때문에 Sharpe보다 보수적이에요',
  },
  '상관관계': {
    term: '상관관계',
    alias: '따로국밥 지수',
    desc: '따로국밥 지수 — 종목들이 서로 다르게 움직이는 정도',
    sub: '서로 반대로 움직일수록 위험이 잘 분산돼요',
  },
  '뉴스감성': {
    term: '뉴스 감성',
    alias: '종목 온도계',
    desc: '종목 온도계 — 지금 사람들이 이 종목을 얼마나 좋게 보는지',
    sub: '긍정 뉴스가 많을수록 초록, 부정이면 보라색으로 표시돼요',
  },
  'ETF': {
    term: 'ETF',
    alias: '묶음 펀드',
    desc: '주식처럼 사고팔 수 있는 펀드 묶음 상품',
    sub: '여러 종목을 한 번에 사는 효과가 있어요',
  },
  'ISA': {
    term: 'ISA',
    alias: '절세 통장',
    desc: '세금 혜택이 있는 개인종합자산관리계좌',
    sub: '일정 기간 유지하면 이자·배당 소득세를 줄일 수 있어요',
  },
  'IRP': {
    term: 'IRP',
    alias: '퇴직연금',
    desc: '퇴직금을 쌓고 세액공제 혜택을 받는 퇴직연금계좌',
    sub: '55세 이후 연금으로 받을 수 있어요',
  },
  '수익률': {
    term: '수익률',
    alias: '벌어들인 %',
    desc: '투자한 원금 대비 현재까지 얼마나 벌었는지 비율',
    sub: '(현재가 - 원금) ÷ 원금 × 100으로 계산해요',
  },
  '벤치마크': {
    term: '벤치마크',
    alias: '기준 점수',
    desc: '내 투자 성과를 비교할 기준 지수',
    sub: '코스피나 S&P 500을 많이 사용해요',
  },
  '수익성': {
    term: '수익성',
    alias: '성장 속도',
    desc: 'CAGR(연 15% 기준)을 0~100점으로 환산한 성장 점수',
    sub: '100점이면 연 15% 이상 성장 중이에요',
  },
  '효율성': {
    term: '효율성',
    alias: '투자 가성비',
    desc: 'Sharpe Ratio(2.0 기준)를 환산 — 위험 대비 수익이 얼마나 좋은지',
    sub: '높을수록 같은 위험으로 더 많이 벌고 있어요',
  },
  '리스크': {
    term: '리스크 방어',
    alias: '하락 방어력',
    desc: 'MDD(최대 낙폭)를 기준으로 환산 — 가장 많이 떨어졌을 때의 타격',
    sub: '낮을수록 하락장에서 잘 버텼다는 뜻이에요',
  },
  '안정성': {
    term: '안정성',
    alias: '가격 진정성',
    desc: '연환산 변동성(35% 기준) 기반 — 가격이 얼마나 출렁이는지',
    sub: '높을수록 조용하고 예측 가능하게 움직여요',
  },
  '분산도': {
    term: '분산도',
    alias: '계란 바구니 수',
    desc: 'HHI(자산 집중도 지수) 기반 — 자산이 얼마나 고르게 퍼져 있는지',
    sub: '낮을수록 한 종목에 몰려 있어 위험해요',
  },
};

/**
 * CAGR color class based on value (Skills-C §V2)
 */
export function cagrColorClass(cagr) {
  if (cagr == null) return 'text-gray-400';
  if (cagr >= 7)  return 'text-emerald-400';
  if (cagr >= 3)  return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * Sharpe color class
 */
export function sharpeColorClass(sharpe) {
  if (sharpe == null) return 'text-gray-400';
  if (sharpe >= 1.0) return 'text-emerald-400';
  if (sharpe >= 0.5) return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * MDD color class (lower is better)
 */
export function mddColorClass(mdd) {
  if (mdd == null) return 'text-gray-400';
  if (mdd < 5)   return 'text-emerald-400';
  if (mdd < 15)  return 'text-yellow-400';
  return 'text-red-400';
}

/**
 * Return percentage color (KR convention: red=up, blue=down)
 */
export function returnColorClass(pct) {
  if (pct > 0)  return 'text-red-400';
  if (pct < 0)  return 'text-blue-400';
  return 'text-gray-400';
}

/**
 * Format time for insight card display
 */
export function formatInsightTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}시간 전`;
  return `${Math.floor(diffH / 24)}일 전`;
}

/**
 * Insight card border color map (Skills-C §V5)
 */
export const INSIGHT_COLORS = {
  danger:        { accent: 'border-l-red-500',    bg: 'bg-red-500/10',    label: 'text-red-400'    },
  warning:       { accent: 'border-l-orange-500', bg: 'bg-orange-500/10', label: 'text-orange-400' },
  success:       { accent: 'border-l-emerald-500',bg: 'bg-emerald-500/10',label: 'text-emerald-400'},
  info:          { accent: 'border-l-gray-500',   bg: 'bg-gray-500/10',   label: 'text-gray-400'   },
  purple:        { accent: 'border-l-purple-500', bg: 'bg-purple-500/10', label: 'text-purple-400' },
  concentration: { accent: 'border-l-yellow-500', bg: 'bg-yellow-500/10', label: 'text-yellow-400' },
};
