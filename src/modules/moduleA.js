/**
 * Module A — Data Normalization Pipeline (Skills-A.md)
 * Normalizes raw portfolio JSON into standardized schema for Module B processing
 */

// Account type code mappings
export const ACCOUNT_TYPES = {
  '01': { label: 'ISA', fullName: '개인종합자산관리계좌', taxDeferred: false, taxNote: '이자·배당 비과세 한도' },
  '02': { label: 'IRP', fullName: '개인형 퇴직연금', taxDeferred: true, taxNote: '연금소득세 분리과세' },
  '03': { label: '일반 위탁', fullName: '일반 위탁 (국내)', taxDeferred: false, taxNote: '배당소득세 15.4%' },
  '04': { label: '해외 주식', fullName: '해외 주식 (OVS)', taxDeferred: false, taxNote: '양도소득세 22%' },
  '05': { label: '연금저축', fullName: '연금저축펀드', taxDeferred: true, taxNote: '세액공제 연 400만원' },
  '06': { label: 'CMA/파킹', fullName: 'CMA / 파킹통장', taxDeferred: false, taxNote: '이자소득세 15.4%' },
  '07': { label: '가상자산', fullName: '가상자산 (CRP)', taxDeferred: false, taxNote: '가상자산 소득세 22%' },
};

// Asset class code mappings
export const ASSET_CLASSES = {
  'EQ':   { label: '국내 주식', color: '#3b82f6', beta: 1.0 },
  'EQ-F': { label: '해외 주식', color: '#6366f1', beta: 1.0 },
  'ET':   { label: '국내 ETF', color: '#10b981', beta: 0.9 },
  'ET-F': { label: '해외 ETF', color: '#059669', beta: 0.95 },
  'BD':   { label: '채권',     color: '#f59e0b', beta: 0.2 },
  'CS':   { label: '현금/CMA', color: '#6b7280', beta: 0.0 },
  'CM':   { label: '금/원자재', color: '#d97706', beta: 0.3 },
  'CR':   { label: '가상자산', color: '#a855f7', beta: null }, // excluded from beta
  'SV':   { label: '저축',     color: '#0ea5e9', beta: 0.0 },
  'AL':   { label: '대체투자', color: '#f43f5e', beta: 0.4 },
  'UN':   { label: '미분류',   color: '#374151', beta: 1.0 },
};

/**
 * Normalizes a single holding to the standard schema
 */
function normalizeHolding(holding, exchangeRate) {
  const flags = [];
  
  // Validate qty
  if (holding.qty < 0) flags.push('INVALID_QTY');
  
  // Validate cost
  if (holding.cost_krw == null) flags.push('MISSING_COST');
  
  // Normalize asset class: infer EQ-F/ET-F from currency + account_type
  let assetClass = holding.asset_class;
  if (holding.currency === 'USD') {
    if (assetClass === 'EQ') assetClass = 'EQ-F';
    if (assetClass === 'ET') assetClass = 'ET-F';
  }
  
  // Currency conversion: USD holdings cost_krw/current_krw already in KRW in our data
  // but flagged with currency='USD' means they represent per-share KRW equivalent
  const costKrw = holding.cost_krw ?? 0;
  const currentKrw = holding.current_krw ?? holding.cost_krw ?? 0;
  
  // For CMA/savings: current = cost + interest (if no current_krw provided)
  let finalCurrentKrw = currentKrw;
  if (holding.asset_class === 'CS' && !holding.current_krw) {
    finalCurrentKrw = costKrw + (holding.interest_krw ?? 0);
  }
  
  // Flag if stale price (coin without current_krw)
  if (assetClass === 'CR' && !holding.current_krw) {
    flags.push('STALE_PRICE');
    finalCurrentKrw = costKrw;
  }
  
  return {
    id: holding.id,
    ticker: holding.ticker,
    name: holding.name,
    asset_class: assetClass,
    account_type: holding.account_type,
    qty: holding.qty,
    cost_krw: costKrw,
    current_krw: finalCurrentKrw,
    currency: holding.currency ?? 'KRW',
    tax_deferred: holding.tax_deferred ?? ACCOUNT_TYPES[holding.account_type]?.taxDeferred ?? false,
    coin_symbol: holding.coin_symbol ?? null,
    exchange_name: holding.exchange_name ?? null,
    interest_krw: holding.interest_krw ?? 0,
    maturity_date: holding.maturity_date ?? null,
    sub_type: holding.sub_type ?? null,
    flag: flags.length === 0 ? 'OK' : flags.join(','),
    // Computed values
    total_cost_krw: costKrw * holding.qty,
    total_current_krw: finalCurrentKrw * holding.qty,
  };
}

/**
 * Module A Main: Normalize portfolio data
 * @param {Object} rawPortfolio - Raw portfolio from portfolio.json
 * @returns {Object} Normalized portfolio ready for Module B
 */
export function normalizePortfolio(rawPortfolio) {
  const exchangeRate = rawPortfolio.exchange_rate_usd_krw ?? 1350;
  const today = new Date();
  
  const holdings = rawPortfolio.holdings.map(h => normalizeHolding(h, exchangeRate));
  
  // Validation checks (Skills-A §8)
  const validationFlags = [];
  holdings.forEach(h => {
    if (!h.ticker) validationFlags.push(`MISSING_TICKER: ${h.id}`);
    if (h.current_krw < 0) validationFlags.push(`NEGATIVE_PRICE: ${h.ticker}`);
    if (!Object.keys(ASSET_CLASSES).includes(h.asset_class)) validationFlags.push(`UNKNOWN_CLASS: ${h.ticker}`);
    if (h.asset_class === 'CR' && !h.coin_symbol) validationFlags.push(`MISSING_COIN_SYMBOL: ${h.ticker}`);
  });
  
  return {
    portfolio_id: rawPortfolio.portfolio_id,
    owner_name: rawPortfolio.owner_name,
    age_group: rawPortfolio.age_group,
    style: rawPortfolio.style,
    generated_at: rawPortfolio.generated_at,
    rate_date: today.toISOString().slice(0, 10),
    exchange_rate_usd_krw: exchangeRate,
    holdings,
    validation_flags: validationFlags,
  };
}

/**
 * Groups holdings by account type for V1 accordion
 */
export function groupByAccount(normalizedPortfolio) {
  const groups = {};
  normalizedPortfolio.holdings.forEach(h => {
    const code = h.account_type;
    if (!groups[code]) {
      groups[code] = {
        code,
        ...ACCOUNT_TYPES[code],
        holdings: [],
        total_cost: 0,
        total_value: 0,
      };
    }
    groups[code].holdings.push(h);
    groups[code].total_cost += h.total_cost_krw;
    groups[code].total_value += h.total_current_krw;
  });
  return Object.values(groups);
}

/**
 * Format KRW amount per Skills-E §4
 */
export function formatKRW(amount) {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    return `${Math.round(amount / 10000).toLocaleString('ko-KR')}만원`;
  }
  return `${amount.toLocaleString('ko-KR')}원`;
}

/**
 * Format USD amount
 */
export function formatUSD(krwAmount, exchangeRate = 1350) {
  const usd = krwAmount / exchangeRate;
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Format percentage with sign
 */
export function formatPct(pct, decimals = 2) {
  if (pct == null) return '—';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(decimals)}%`;
}
