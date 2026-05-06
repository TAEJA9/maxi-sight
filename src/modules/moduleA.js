/**
 * Module A — Data Normalization Pipeline (Skills-A.md)
 * Normalizes raw portfolio JSON into standardized schema for Module B processing
 */

// ── 1. 계좌 유형 분류 코드 (Skills-A §1) ──────────────────────────────────
export const ACCOUNT_TYPES = {
  '01': { label: 'ISA',    fullName: '개인종합자산관리계좌', taxDeferred: false, taxNote: '이자·배당 비과세 한도 (200만/400만원)' },
  '02': { label: 'IRP',    fullName: '개인형 퇴직연금',      taxDeferred: true,  taxNote: '연금소득세 분리과세, 55세 이후 수령' },
  '03': { label: '일반 위탁', fullName: '일반 위탁 (국내)',  taxDeferred: false, taxNote: '배당소득세 15.4%, 매매차익 비과세' },
  '04': { label: '해외 주식', fullName: '해외 주식 (OVS)',   taxDeferred: false, taxNote: '양도소득세 22% (250만원 초과분)' },
  '05': { label: '연금저축', fullName: '연금저축펀드 및 보험', taxDeferred: true, taxNote: '세액공제 연 400만원, 연금소득세 3.3~5.5%' },
  '06': { label: 'CMA/파킹', fullName: 'CMA / 파킹통장 / 외화예금', taxDeferred: false, taxNote: '이자소득세 15.4%' },
  '07': { label: '가상자산', fullName: '가상자산 (CRP)',     taxDeferred: false, taxNote: '가상자산 소득세 22% (250만원 초과분)' },
};

// ── 2. 자산 클래스 코드 (Skills-A §2) ────────────────────────────────────
export const ASSET_CLASSES = {
  'EQ':   { label: '국내 주식',  color: '#3b82f6', beta: 1.0 },
  'EQ-F': { label: '해외 주식',  color: '#6366f1', beta: 1.0 },
  'ET':   { label: '국내 ETF',   color: '#10b981', beta: 0.9 },
  'ET-F': { label: '해외 ETF',   color: '#059669', beta: 0.95 },
  'BD':   { label: '채권',       color: '#f59e0b', beta: 0.2 },
  'CS':   { label: '현금/CMA',   color: '#6b7280', beta: 0.0 },
  'CM':   { label: '금/원자재',  color: '#d97706', beta: 0.3 },
  'CR':   { label: '가상자산',   color: '#a855f7', beta: null }, // Skills-A §계좌특수: CR 베타 제외
  'SV':   { label: '저축/청약',  color: '#0ea5e9', beta: 0.0 },
  'AL':   { label: '대체투자',   color: '#f43f5e', beta: 0.4 },
  'UN':   { label: '미분류',     color: '#374151', beta: 1.0 },
};

// ── 4. 수치 포맷 유틸리티 (Skills-E §4 기준) ─────────────────────────────

/**
 * KRW 금액 포맷 — 억 이상은 "N억 N,NNN만원" 형식 (Skills-E §4)
 */
export function formatKRW(amount) {
  if (amount == null || isNaN(amount)) return '—';
  const n = Math.round(amount);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 100_000_000) {
    const eok = Math.floor(abs / 100_000_000);
    const man = Math.floor((abs % 100_000_000) / 10_000);
    if (man === 0) return `${sign}${eok.toLocaleString('ko-KR')}억원`;
    return `${sign}${eok.toLocaleString('ko-KR')}억 ${man.toLocaleString('ko-KR')}만원`;
  }
  if (abs >= 10_000) {
    const man = Math.floor(abs / 10_000);
    const rest = abs % 10_000;
    if (rest === 0) return `${sign}${man.toLocaleString('ko-KR')}만원`;
    return `${sign}${n.toLocaleString('ko-KR')}원`;
  }
  return `${sign}${n.toLocaleString('ko-KR')}원`;
}

/**
 * USD 금액 포맷
 */
export function formatUSD(krwAmount, exchangeRate = 1350) {
  const usd = krwAmount / exchangeRate;
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * 퍼센트 포맷 (부호 포함)
 */
export function formatPct(pct, decimals = 2) {
  if (pct == null) return '—';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(decimals)}%`;
}

// ── 단일 holding 정규화 ──────────────────────────────────────────────────

/**
 * Normalizes a single holding to the standard schema (Skills-A §5, §7)
 */
function normalizeHolding(holding, exchangeRate) {
  const flags = [];

  // 수량 음수 검증
  if (holding.qty < 0) flags.push('INVALID_QTY');

  // 취득단가 누락
  if (holding.cost_krw == null) flags.push('MISSING_COST');

  // 자산 클래스 추론: USD 통화 → EQ-F / ET-F 자동 변환 (Skills-A §3)
  let assetClass = holding.asset_class;
  if (holding.currency === 'USD') {
    if (assetClass === 'EQ') assetClass = 'EQ-F';
    if (assetClass === 'ET') assetClass = 'ET-F';
  }
  // 허용 코드 외 → UN
  if (!Object.keys(ASSET_CLASSES).includes(assetClass)) {
    assetClass = 'UN';
  }

  const costKrw = holding.cost_krw ?? 0;
  let currentKrw = holding.current_krw ?? holding.cost_krw ?? 0;

  // CMA/저축 이자 적용: current_krw 미입력 시 원금+이자 (Skills-A §5 CMA)
  if ((assetClass === 'CS' || holding.account_type === '06') && !holding.current_krw) {
    currentKrw = costKrw + (holding.interest_krw ?? 0);
  }

  // 가상자산 시세 미조회 플래그 (Skills-A §4)
  if (assetClass === 'CR' && !holding.current_krw) {
    flags.push('STALE_PRICE');
    currentKrw = costKrw;
  }

  // tax_deferred: holding 명시값 우선, 없으면 account_type 기준 (Skills-A §5 IRP/연금)
  const taxDeferred = holding.tax_deferred ?? ACCOUNT_TYPES[holding.account_type]?.taxDeferred ?? false;

  // ISA→IRP 이전 여부 (Skills-A §5 ISA)
  const isaToIrp = holding.account_type === '01' ? (holding.isa_to_irp ?? false) : undefined;

  // 연금 수령 개시 나이 (Skills-A §5 IRP/연금저축, 기본값 55)
  const pensionStartAge = ['02', '05'].includes(holding.account_type)
    ? (holding.pension_start_age ?? 55)
    : undefined;

  return {
    id:               holding.id,
    ticker:           holding.ticker,
    name:             holding.name,
    asset_class:      assetClass,
    account_type:     holding.account_type,
    qty:              holding.qty,
    cost_krw:         costKrw,
    current_krw:      currentKrw,
    purchase_date:    holding.purchase_date ?? null,            // Skills-A §5 해외주식
    currency:         holding.currency ?? 'KRW',
    tax_deferred:     taxDeferred,
    coin_symbol:      holding.coin_symbol ?? null,             // Skills-A §5 가상자산
    exchange_name:    holding.exchange_name ?? null,
    interest_krw:     holding.interest_krw ?? 0,               // Skills-A §5 CMA
    maturity_date:    holding.maturity_date ?? null,            // Skills-A §5 저축
    sub_type:         holding.sub_type ?? null,                 // Skills-A §5 저축 (청약)
    dividend_yield_pct: holding.dividend_yield_pct ?? 0,
    isa_to_irp:       isaToIrp,                                 // Skills-A §5 ISA
    pension_start_age: pensionStartAge,                         // Skills-A §5 IRP/연금
    flag:             flags.length === 0 ? 'OK' : flags.join(','),
    // 계산 편의 필드
    total_cost_krw:    costKrw * holding.qty,
    total_current_krw: currentKrw * holding.qty,
  };
}

// ── Module A 메인 ─────────────────────────────────────────────────────────

/**
 * Module A Main: 포트폴리오 데이터 정규화
 * @param {Object} rawPortfolio - portfolio.json의 단일 포트폴리오
 * @returns {Object} Module B 입력용 정규화 포트폴리오
 */
export function normalizePortfolio(rawPortfolio) {
  const exchangeRate = rawPortfolio.exchange_rate_usd_krw ?? 1350;

  const holdings = rawPortfolio.holdings.map(h => normalizeHolding(h, exchangeRate));

  // ── 검증 체크리스트 §8 ─────────────────────────────────────────────────
  const validationFlags = [];
  holdings.forEach(h => {
    // 1. ticker 비어있지 않음
    if (!h.ticker) validationFlags.push(`MISSING_TICKER: ${h.id}`);
    // 2. current_krw ≥ 0
    if (h.current_krw < 0) validationFlags.push(`NEGATIVE_PRICE: ${h.ticker}`);
    // 3. asset_class 허용 코드 목록
    if (!Object.keys(ASSET_CLASSES).includes(h.asset_class)) validationFlags.push(`UNKNOWN_CLASS: ${h.ticker}`);
    // 4. account_type 허용 코드 목록
    if (!Object.keys(ACCOUNT_TYPES).includes(h.account_type)) validationFlags.push(`UNKNOWN_ACCOUNT: ${h.ticker}`);
    // 5. USD 자산에 exchange_rate_usd_krw 존재 여부
    if (h.currency === 'USD' && !exchangeRate) validationFlags.push(`MISSING_EXCHANGE_RATE: ${h.ticker}`);
    // 6. CR(가상자산) coin_symbol 필수
    if (h.asset_class === 'CR' && !h.coin_symbol) validationFlags.push(`MISSING_COIN_SYMBOL: ${h.ticker}`);
    // 7. 오류 플래그 보유 종목 전달
    if (h.flag !== 'OK') validationFlags.push(`ITEM_FLAG: ${h.ticker}=${h.flag}`);
  });
  // 7. 전체 보유 종목 수 ≥ 1
  if (holdings.length < 1) validationFlags.push('NO_HOLDINGS');

  return {
    portfolio_id:         rawPortfolio.portfolio_id,
    owner_name:           rawPortfolio.owner_name,
    age_group:            rawPortfolio.age_group,
    style:                rawPortfolio.style,
    generated_at:         rawPortfolio.generated_at,
    rate_date:            new Date().toISOString().slice(0, 10),
    exchange_rate_usd_krw: exchangeRate,
    holdings,
    validation_flags:     validationFlags,
  };
}

// ── 계좌별 그룹핑 (V1 아코디언용) ────────────────────────────────────────

export function groupByAccount(normalizedPortfolio) {
  const groups = {};
  normalizedPortfolio.holdings.forEach(h => {
    const code = h.account_type;
    if (!groups[code]) {
      groups[code] = {
        code,
        ...ACCOUNT_TYPES[code],
        holdings:    [],
        total_cost:  0,
        total_value: 0,
      };
    }
    groups[code].holdings.push(h);
    groups[code].total_cost  += h.total_cost_krw;
    groups[code].total_value += h.total_current_krw;
  });
  return Object.values(groups);
}

// ── CSV 멀티소스 파서 (Skills-A §6) ──────────────────────────────────────

/**
 * CSV 컬럼 자동 매핑 테이블 (Skills-A §6.2)
 */
const CSV_COLUMN_MAP = {
  ticker:        ['ticker', '종목코드', 'symbol', '코인심볼'],
  name:          ['name', '종목명', '자산명', 'coin_name'],
  qty:           ['qty', 'quantity', '수량', '보유수량', '코인수량'],
  cost_krw:      ['cost', '취득단가', 'avg_cost', '매수단가'],
  current_krw:   ['current', '현재가', 'price', '현재시세'],
  account_type:  ['account', '계좌', 'account_type', '계좌유형'],
  asset_class:   ['class', '자산분류', 'asset_type', '자산클래스'],
  purchase_date: ['date', '매수일', 'purchase_date', '취득일'],
  exchange_name: ['exchange', '거래소', 'exchange_name'],
};

/**
 * CSV 문자열을 portfolio holdings 배열로 변환 (Skills-A §6)
 * @param {string} csvText - 헤더 행 포함 CSV 텍스트
 * @returns {Array} holdings 배열 (rawPortfolio.holdings 형식)
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  // 헤더를 표준 필드로 매핑
  const colMap = {}; // colIndex → standardField
  headers.forEach((h, idx) => {
    for (const [stdField, aliases] of Object.entries(CSV_COLUMN_MAP)) {
      if (aliases.map(a => a.toLowerCase()).includes(h.toLowerCase())) {
        colMap[idx] = stdField;
        break;
      }
    }
  });

  const holdings = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (cells.every(c => !c)) continue;

    const raw = {};
    cells.forEach((val, idx) => {
      const field = colMap[idx];
      if (field) raw[field] = val;
    });

    // 타입 변환
    const holding = {
      id:           `csv-${i}`,
      ticker:       raw.ticker ?? '',
      name:         raw.name ?? raw.ticker ?? '',
      asset_class:  raw.asset_class ?? 'UN',
      account_type: raw.account_type ?? '03',
      qty:          parseFloat(raw.qty) || 0,
      cost_krw:     parseFloat(raw.cost_krw) || null,
      current_krw:  parseFloat(raw.current_krw) || null,
      purchase_date: raw.purchase_date ?? null,
      exchange_name: raw.exchange_name ?? null,
      currency:     'KRW',
    };
    holdings.push(holding);
  }
  return holdings;
}
