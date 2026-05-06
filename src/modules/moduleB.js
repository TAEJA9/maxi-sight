/**
 * Module B — Investment Metrics Calculation (Skills-B.md)
 * All financial indicators calculated in pure JavaScript
 */

import { ASSET_CLASSES } from './moduleA.js';

// ── 시드 기반 PRNG (mulberry32) ───────────────────────────────
// portfolio_id를 시드로 사용 → 같은 포트폴리오는 항상 동일한 시뮬레이션 결과
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function makePRNG(seed) {
  let s = (seed >>> 0) || 1;
  return function () {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const RISK_FREE_RATE = 0.035; // 3.5% — Korean 3Y Treasury (Skills-B §2)
const TRADING_DAYS = 250;     // Domestic annualization (Skills-B §5)
const TRADING_DAYS_CRYPTO = 365; // Crypto 24h (Skills-B §5)

// Default betas per asset class when API unavailable (Skills-B §4)
const DEFAULT_BETAS = {
  'EQ':   1.1,  // Domestic equity: slightly above market
  'EQ-F': 1.05, // Foreign equity
  'ET':   0.85, // Domestic ETF: slightly below (diversified)
  'ET-F': 0.90, // Foreign ETF
  'BD':   0.15, // Bonds: low market sensitivity
  'CS':   0.0,  // Cash: no beta
  'CM':   0.25, // Commodities: low-moderate
  'CR':   null, // Crypto: excluded from beta (Skills-B §4)
  'SV':   0.0,  // Savings: no beta
  'AL':   0.4,  // Alternatives
  'UN':   1.0,  // Unknown: default to market
};

// Simulated betas for known tickers (approximations)
const TICKER_BETAS = {
  'TSLA': 2.1, 'TQQQ': 2.8, 'NVDA': 1.9, 'AAPL': 1.2, 'MSFT': 1.1,
  'SCHD': 0.75, 'VOO': 1.0, 'SPY': 1.0, 'QQQ': 1.1, 'VTI': 1.0,
  '005930': 0.95, '305540': 1.4, '408530': 0.1, 'KORAU': 0.3,
};

/**
 * Generate simulated historical price series for a holding
 * Used to estimate volatility, MDD, and correlation in absence of API data
 * Skills-B §3, §5, §8
 */
function generateSimulatedReturns(holding, days = 252, rand = Math.random) {
  const { ticker, asset_class, total_cost_krw, total_current_krw } = holding;
  const totalReturn = (total_current_krw - total_cost_krw) / total_cost_krw;
  const dailyMu = Math.log(1 + totalReturn) / days;

  const annualVol = {
    'EQ':   0.28, 'EQ-F': 0.30, 'ET':   0.22, 'ET-F': 0.20,
    'BD':   0.06, 'CS':   0.00, 'CM':   0.18, 'CR':   0.80,
    'SV':   0.00, 'UN':   0.25, 'AL':   0.20,
  }[asset_class] ?? 0.25;

  const tickerVolMultiplier = {
    'TQQQ': 3.0, 'TSLA': 1.8, 'SOL': 2.5, 'NVDA': 1.6, 'KORAU': 0.6,
  }[ticker] ?? 1.0;

  const dailyVol = (annualVol * tickerVolMultiplier) / Math.sqrt(TRADING_DAYS);
  const returns = [];

  for (let i = 0; i < days; i++) {
    const u1 = rand();
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
    returns.push(dailyMu + dailyVol * z);
  }
  return returns;
}

/**
 * Calculate portfolio-level daily returns from holdings
 */
function calcPortfolioReturns(normalizedPortfolio, days = 252, rand = Math.random) {
  const { holdings } = normalizedPortfolio;
  const totalValue = holdings.reduce((s, h) => s + h.total_current_krw, 0);
  if (totalValue === 0) return Array(days).fill(0);

  const portfolioReturns = Array(days).fill(0);
  holdings.forEach(h => {
    const weight = h.total_current_krw / totalValue;
    const returns = generateSimulatedReturns(h, days, rand);
    returns.forEach((r, i) => { portfolioReturns[i] += weight * r; });
  });

  return portfolioReturns;
}

/**
 * CAGR calculation (Skills-B §1)
 * CAGR = (currentValue / initialCost)^(1/years) - 1
 */
export function calcCAGR(normalizedPortfolio, holdingYears = 1.5) {
  const { holdings } = normalizedPortfolio;
  const totalCost = holdings.reduce((s, h) => s + h.total_cost_krw, 0);
  const totalValue = holdings.reduce((s, h) => s + h.total_current_krw, 0);
  
  if (totalCost === 0) return null;
  
  // If < 1 year, return simple return rate
  if (holdingYears < 1) {
    const simpleReturn = (totalValue - totalCost) / totalCost * 100;
    return { cagr_pct: parseFloat(simpleReturn.toFixed(2)), is_simple: true };
  }
  
  const cagr = (Math.pow(totalValue / totalCost, 1 / holdingYears) - 1) * 100;
  return { cagr_pct: parseFloat(cagr.toFixed(2)), is_simple: false };
}

/**
 * Volatility calculation (Skills-B §5)
 * annualized = std(log returns) × √tradingDays
 */
export function calcVolatility(portfolioReturns, hasCrypto = false) {
  if (!portfolioReturns || portfolioReturns.length < 30) {
    return { volatility_annualized_pct: null, flag: 'INSUFFICIENT_DATA' };
  }
  
  const n = portfolioReturns.length;
  const mean = portfolioReturns.reduce((s, r) => s + r, 0) / n;
  const variance = portfolioReturns.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / (n - 1);
  const dailyStd = Math.sqrt(variance);
  
  const annFactor = hasCrypto ? TRADING_DAYS_CRYPTO : TRADING_DAYS;
  const annualizedVol = dailyStd * Math.sqrt(annFactor) * 100;
  
  return {
    volatility_annualized_pct: parseFloat(annualizedVol.toFixed(2)),
    flag: null,
  };
}

/**
 * Sharpe Ratio (Skills-B §2)
 * Sharpe = (portfolioReturn - riskFreeRate) / portfolioVolatility
 */
export function calcSharpe(cagrPct, volatilityPct) {
  if (volatilityPct == null || volatilityPct === 0) {
    return { sharpe_ratio: null, flag: 'ZERO_VOLATILITY' };
  }
  const excessReturn = (cagrPct / 100) - RISK_FREE_RATE;
  const sharpe = excessReturn / (volatilityPct / 100);
  return { sharpe_ratio: parseFloat(sharpe.toFixed(2)), flag: null };
}

/**
 * MDD calculation (Skills-B §3)
 * MDD = (peak - trough) / peak × 100
 */
export function calcMDD(portfolioReturns) {
  if (!portfolioReturns || portfolioReturns.length === 0) {
    return { mdd_pct: 0, flag: 'APPROX_MDD' };
  }
  
  // Reconstruct cumulative portfolio value from returns
  let cumulativeValue = 100;
  const values = [cumulativeValue];
  portfolioReturns.forEach(r => {
    cumulativeValue *= (1 + r);
    values.push(cumulativeValue);
  });
  
  let maxDrawdown = 0;
  let peak = values[0];
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) {
      peak = values[i];
    }
    const drawdown = (peak - values[i]) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return {
    mdd_pct: parseFloat((maxDrawdown * 100).toFixed(2)),
    flag: null,
  };
}

/**
 * Portfolio Beta (Skills-B §4)
 * Beta = Σ(holding_beta × holding_weight)
 */
export function calcBeta(normalizedPortfolio) {
  const { holdings } = normalizedPortfolio;
  const totalValue = holdings.reduce((s, h) => s + h.total_current_krw, 0);
  
  if (totalValue === 0) return { portfolio_beta: 1.0 };
  
  let weightedBeta = 0;
  let weightedTotal = 0;
  
  holdings.forEach(h => {
    // Skip crypto in beta calculation (Skills-B §4)
    if (h.asset_class === 'CR') return;
    
    const weight = h.total_current_krw / totalValue;
    const beta = TICKER_BETAS[h.ticker] ?? DEFAULT_BETAS[h.asset_class] ?? 1.0;
    weightedBeta += weight * beta;
    weightedTotal += weight;
  });
  
  // Renormalize if crypto was excluded
  const normalizedBeta = weightedTotal > 0 ? weightedBeta / weightedTotal : 1.0;
  return { portfolio_beta: parseFloat(normalizedBeta.toFixed(2)) };
}

/**
 * Sortino Ratio (Skills-B §7)
 * Sortino = (portfolioReturn - riskFreeRate) / downsideVolatility
 */
export function calcSortino(cagrPct, portfolioReturns) {
  if (!portfolioReturns || portfolioReturns.length === 0) {
    return { sortino_ratio: null, flag: 'INSUFFICIENT_DATA' };
  }
  
  const TARGET_RETURN = 0; // 0% threshold
  const negativeReturns = portfolioReturns.filter(r => r < TARGET_RETURN);
  
  if (negativeReturns.length === 0) {
    return { sortino_ratio: null, flag: 'NO_DRAWDOWN' };
  }
  
  const downsideVariance = negativeReturns.reduce((s, r) => s + r * r, 0) / portfolioReturns.length;
  const downsideStd = Math.sqrt(downsideVariance) * Math.sqrt(TRADING_DAYS);
  
  if (downsideStd === 0) {
    return { sortino_ratio: null, flag: 'ZERO_VOLATILITY' };
  }
  
  const excessReturn = (cagrPct / 100) - RISK_FREE_RATE;
  const sortino = excessReturn / downsideStd;
  
  return { sortino_ratio: parseFloat(sortino.toFixed(2)), flag: null };
}

/**
 * Asset allocation by class (Skills-B §6)
 */
export function calcAllocation(normalizedPortfolio) {
  const { holdings } = normalizedPortfolio;
  const totalValue = holdings.reduce((s, h) => s + h.total_current_krw, 0);
  
  const allocation = {};
  holdings.forEach(h => {
    const cls = h.asset_class;
    if (!allocation[cls]) allocation[cls] = 0;
    allocation[cls] += h.total_current_krw;
  });
  
  // Convert to percentages
  Object.keys(allocation).forEach(cls => {
    allocation[cls] = totalValue > 0
      ? parseFloat(((allocation[cls] / totalValue) * 100).toFixed(2))
      : 0;
  });
  
  return allocation;
}

/**
 * Super Asset allocation (Domestic vs Overseas)
 */
export function calcSuperAllocation(normalizedPortfolio) {
  const { holdings } = normalizedPortfolio;
  const totalValue = holdings.reduce((s, h) => s + h.total_current_krw, 0);
  
  const superAllocation = { domestic: 0, overseas: 0 };
  const overseasClasses = ['EQ-F', 'ET-F', 'CR', 'CM']; // Commodities usually USD-based
  
  holdings.forEach(h => {
    if (overseasClasses.includes(h.asset_class)) {
      superAllocation.overseas += h.total_current_krw;
    } else {
      superAllocation.domestic += h.total_current_krw;
    }
  });
  
  return {
    domestic_pct: totalValue > 0 ? parseFloat(((superAllocation.domestic / totalValue) * 100).toFixed(2)) : 0,
    overseas_pct: totalValue > 0 ? parseFloat(((superAllocation.overseas / totalValue) * 100).toFixed(2)) : 0,
  };
}

/**
 * Ticker allocation for Treemap
 */
export function calcTickerAllocation(normalizedPortfolio) {
  const { holdings } = normalizedPortfolio;
  
  const tickerMap = {};
  holdings.forEach(h => {
    const key = h.ticker || 'Cash';
    if (!tickerMap[key]) {
      tickerMap[key] = {
        name: h.name || h.ticker,
        ticker: key,
        value: 0,
        asset_class: h.asset_class,
      };
    }
    tickerMap[key].value += h.total_current_krw;
  });
  
  return Object.values(tickerMap).sort((a, b) => b.value - a.value);
}

/**
 * Annual Dividend Estimate (from dividend_yield_pct field) & Simulated Schedule
 */
export function calcDividend(normalizedPortfolio) {
  const { holdings } = normalizedPortfolio;
  
  let annual_dividend_krw = 0;
  const dividend_items = [];
  
  // 1월~12월 수령 예정액 시뮬레이션용 배열 초기화
  const monthly_schedule_data = Array.from({ length: 12 }, (_, i) => ({
    month: `${i + 1}월`,
    amount: 0
  }));

  const upcoming_this_month = [];
  const upcoming_next_month = [];
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-based (e.g. 5)
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

  holdings.forEach((h, i) => {
    const yieldPct = h.dividend_yield_pct ?? 0;
    if (yieldPct <= 0) return;
    
    const annual = h.total_current_krw * (yieldPct / 100);
    annual_dividend_krw += annual;
    
    dividend_items.push({
      name: h.name,
      ticker: h.ticker,
      yield_pct: yieldPct,
      annual_krw: Math.round(annual),
      monthly_krw: Math.round(annual / 12),
    });

    // ── 배당 일정 시뮬레이션 (가정) ──
    // EQ-F, ET-F (해외) -> 보통 분기배당 (3,6,9,12월 또는 1,4,7,10월 등)
    // EQ, ET (국내) -> 보통 연배당 (4월) 
    // 예외적으로 종목 해시값 등에 기반해 임의로 배정하여 풍부하게 보이게 함.
    let payMonths = [];
    const tickerHash = h.ticker ? h.ticker.charCodeAt(0) + h.ticker.charCodeAt(h.ticker.length-1) : i;
    
    if (h.asset_class.includes('-F')) {
      // 해외자산: 월배당(12번) 또는 분기배당(4번)
      if (tickerHash % 5 === 0 || h.name.includes('Dividend')) {
        // 월배당
        payMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      } else {
        // 분기배당 (스타팅 월: 1, 2, 3 중 하나)
        const startMonth = (tickerHash % 3) + 1; 
        payMonths = [startMonth, startMonth+3, startMonth+6, startMonth+9];
      }
    } else {
      // 국내자산: 연배당(4월 집중) 또는 분기(4,5,8,11 등 임의)
      if (tickerHash % 3 === 0) {
        payMonths = [4, 8, 11]; // 임의 분기
      } else {
        payMonths = [4]; // 전형적인 4월 결산 배당
      }
    }

    const payAmountPerTime = Math.round(annual / payMonths.length);

    payMonths.forEach(m => {
      monthly_schedule_data[m - 1].amount += payAmountPerTime;

      // 이번달 / 다음달 목록에 추가
      // 가상의 배당락일: 해당 월의 10일~28일 사이
      if (m === currentMonth || m === nextMonth) {
        const exDay = (tickerHash % 19) + 10; 
        const year = (m === 1 && currentMonth === 12) ? today.getFullYear() + 1 : today.getFullYear();
        const exDateStr = `${year}.${String(m).padStart(2, '0')}.${String(exDay).padStart(2, '0')}`;
        
        const scheduleItem = {
          ticker: h.ticker,
          name: h.name,
          exDate: exDateStr,
          amount: payAmountPerTime
        };

        if (m === currentMonth) upcoming_this_month.push(scheduleItem);
        else upcoming_next_month.push(scheduleItem);
      }
    });
  });
  
  // 날짜순 정렬
  upcoming_this_month.sort((a, b) => a.exDate.localeCompare(b.exDate));
  upcoming_next_month.sort((a, b) => a.exDate.localeCompare(b.exDate));

  return {
    annual_dividend_krw: Math.round(annual_dividend_krw),
    monthly_dividend_krw: Math.round(annual_dividend_krw / 12),
    dividend_items: dividend_items.sort((a, b) => b.annual_krw - a.annual_krw),
    monthly_schedule: monthly_schedule_data,
    upcoming_schedule: {
      thisMonth: upcoming_this_month,
      nextMonth: upcoming_next_month
    }
  };
}

/**
 * Correlation Matrix (Skills-B §8)
 * Pearson correlation of daily log-returns between all holding pairs
 * Excludes CR vs non-CR pairs across different market hours:
 *   → CR holdings are date-aligned by day index (not calendar)
 */
export function calcCorrelationMatrix(normalizedPortfolio, days = 252, rand = Math.random) {
  const { holdings } = normalizedPortfolio;
  const nonCashHoldings = holdings.filter(h => !['CS', 'SV'].includes(h.asset_class));

  if (nonCashHoldings.length < 2) {
    return { matrix: {}, flag: 'SINGLE_ASSET' };
  }

  // 각 종목별 시뮬레이션 수익률 생성
  const returnsMap = {};
  nonCashHoldings.forEach(h => {
    returnsMap[h.ticker] = generateSimulatedReturns(h, days, rand);
  });

  // 피어슨 상관계수 계산 헬퍼
  function pearson(a, b) {
    const n = a.length;
    const meanA = a.reduce((s, v) => s + v, 0) / n;
    const meanB = b.reduce((s, v) => s + v, 0) / n;
    let num = 0, denA = 0, denB = 0;
    for (let i = 0; i < n; i++) {
      const da = a[i] - meanA;
      const db = b[i] - meanB;
      num  += da * db;
      denA += da * da;
      denB += db * db;
    }
    const denom = Math.sqrt(denA * denB);
    return denom === 0 ? 0 : parseFloat((num / denom).toFixed(4));
  }

  const matrix = {};
  const tickers = nonCashHoldings.map(h => h.ticker);
  for (let i = 0; i < tickers.length; i++) {
    for (let j = i + 1; j < tickers.length; j++) {
      const key = `${tickers[i]}_${tickers[j]}`;
      matrix[key] = pearson(returnsMap[tickers[i]], returnsMap[tickers[j]]);
    }
  }

  return { matrix, flag: null };
}

/**
 * Per-holding return contribution
 */
export function calcHoldingContributions(normalizedPortfolio) {
  const { holdings } = normalizedPortfolio;
  const totalValue = holdings.reduce((s, h) => s + h.total_current_krw, 0);
  
  return holdings.map(h => {
    const gain = h.total_current_krw - h.total_cost_krw;
    const returnPct = h.total_cost_krw > 0
      ? ((h.total_current_krw - h.total_cost_krw) / h.total_cost_krw) * 100
      : 0;
    const weight = totalValue > 0 ? (h.total_current_krw / totalValue) * 100 : 0;
    
    return {
      ...h,
      gain_krw: gain,
      return_pct: parseFloat(returnPct.toFixed(2)),
      weight_pct: parseFloat(weight.toFixed(2)),
    };
  }).sort((a, b) => b.return_pct - a.return_pct);
}

/**
 * Generate performance timeline data for V4 chart
 * Creates relative return % series vs simulated benchmarks
 */
export function generateTimeline(normalizedPortfolio, days = 252, rand = Math.random) {
  const portfolioReturns = calcPortfolioReturns(normalizedPortfolio, days, rand);

  const kospiReturns = [];
  const sp500Returns = [];
  for (let i = 0; i < days; i++) {
    const u1 = rand(), u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
    kospiReturns.push(0.00031 + 0.012 * z);
    const u3 = rand(), u4 = rand();
    const z2 = Math.sqrt(-2 * Math.log(u3 + 1e-10)) * Math.cos(2 * Math.PI * u4);
    sp500Returns.push(0.00045 + 0.010 * z2);
  }
  
  // Build cumulative return series starting from today - days
  const today = new Date();
  let pfValue = 100, kospiValue = 100, sp500Value = 100;
  const timeline = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const label = `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    
    if (i < days - 1) {
      pfValue *= (1 + portfolioReturns[days - 1 - i]);
      kospiValue *= (1 + kospiReturns[days - 1 - i]);
      sp500Value *= (1 + sp500Returns[days - 1 - i]);
    }
    
    timeline.push({
      date: label,
      fullDate: date.toISOString().slice(0, 10),
      portfolio: parseFloat((pfValue - 100).toFixed(2)),
      kospi: parseFloat((kospiValue - 100).toFixed(2)),
      sp500: parseFloat((sp500Value - 100).toFixed(2)),
    });
  }
  
  return timeline;
}

/**
 * Module B Main: Calculate all investment metrics
 * @param {Object} normalizedPortfolio - Output from Module A
 * @param {number} holdingYears - Estimated holding period in years
 * @returns {Object} Complete metrics object (Module B schema)
 */
export function calculateMetrics(normalizedPortfolio, holdingYears = 1.5) {
  const { holdings } = normalizedPortfolio;

  // portfolio_id 기반 고정 시드 → 새로고침해도 동일한 시뮬레이션 결과
  const rand = makePRNG(hashString(normalizedPortfolio.portfolio_id ?? 'default'));

  const totalCost = holdings.reduce((s, h) => s + h.total_cost_krw, 0);
  const totalValue = holdings.reduce((s, h) => s + h.total_current_krw, 0);
  const totalReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const hasCrypto = holdings.some(h => h.asset_class === 'CR');
  const portfolioReturns = calcPortfolioReturns(normalizedPortfolio, 252, rand);

  const cagrResult = calcCAGR(normalizedPortfolio, holdingYears);
  const cagrPct = cagrResult?.cagr_pct ?? 0;

  const volResult   = calcVolatility(portfolioReturns, hasCrypto);
  const sharpeResult = calcSharpe(cagrPct, volResult.volatility_annualized_pct);
  const mddResult   = calcMDD(portfolioReturns);
  const betaResult  = calcBeta(normalizedPortfolio);
  const sortinoResult = calcSortino(cagrPct, portfolioReturns);
  const allocation  = calcAllocation(normalizedPortfolio);
  const contributions = calcHoldingContributions(normalizedPortfolio);
  const timeline    = generateTimeline(normalizedPortfolio, 252, rand);
  // Skills-B §8: 상관관계 매트릭스 (시드 동일 rand 재사용)
  const corrResult  = calcCorrelationMatrix(normalizedPortfolio, 252, rand);

  const flags = [
    ...(volResult.flag    ? [volResult.flag]    : []),
    ...(sharpeResult.flag ? [sharpeResult.flag] : []),
    ...(mddResult.flag    ? [mddResult.flag]    : []),
    ...(sortinoResult.flag ? [sortinoResult.flag] : []),
    ...(corrResult.flag   ? [corrResult.flag]   : []),
    ...(cagrResult?.is_simple ? ['SIMPLE_RETURN_ONLY'] : []),
  ];

  return {
    portfolio_id:              normalizedPortfolio.portfolio_id,
    calculated_at:             new Date().toISOString(),
    total_value_krw:           totalValue,
    total_cost_krw:            totalCost,
    total_return_pct:          parseFloat(totalReturn.toFixed(2)),
    cagr_pct:                  cagrPct,
    cagr_is_simple:            cagrResult?.is_simple ?? false,
    sharpe_ratio:              sharpeResult.sharpe_ratio,
    sortino_ratio:             sortinoResult.sortino_ratio,
    mdd_pct:                   mddResult.mdd_pct,
    portfolio_beta:            betaResult.portfolio_beta,
    volatility_annualized_pct: volResult.volatility_annualized_pct,
    allocation,
    super_allocation:          calcSuperAllocation(normalizedPortfolio),
    ticker_allocation:         calcTickerAllocation(normalizedPortfolio),
    dividend:                  calcDividend(normalizedPortfolio),
    contributions,
    timeline,
    correlation_matrix:        corrResult.matrix,   // Skills-B §8
    flags,
  };
}
